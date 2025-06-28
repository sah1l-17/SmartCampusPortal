import express from "express"
import multer from "multer"
import xlsx from "xlsx"
import Course from "../models/Course.js"
import User from "../models/User.js"
import Event from "../models/Event.js"
import { authenticate, authorize } from "../middleware/auth.js"
import { logActivity } from "../utils/activity.js"

const router = express.Router()

// Configure multer for file uploads with size limit
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|mp4|avi|mov|xlsx|xls|txt|zip|rar/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// Create course
router.post("/courses", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const { title, code, description, semester, credits } = req.body

    if (!title || !code || !description || !semester || !credits) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: code.trim().toUpperCase() })
    if (existingCourse) {
      return res.status(400).json({ message: "Course code already exists" })
    }

    const course = new Course({
      title: title.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      department: req.user.department,
      faculty: req.user._id,
      semester: Number.parseInt(semester),
      credits: Number.parseInt(credits),
    })

    // Auto-enroll existing students from the same department
    const existingStudents = await User.find({
      role: "student",
      department: req.user.department,
      isActive: true,
    })

    course.enrolledStudents = existingStudents.map((student) => student._id)
    await course.save()

    // Log activity
    await logActivity(
      "course_created",
      `Course "${title}" created by ${req.user.name}`,
      req.user._id,
      "Course",
      course._id,
      { courseCode: code, department: req.user.department },
    )

    // Populate the course with faculty and student details
    const populatedCourse = await Course.findById(course._id)
      .populate("faculty", "name email userId")
      .populate("enrolledStudents", "name email userId")

    res.status(201).json({
      message: "Course created successfully",
      course: populatedCourse,
    })
  } catch (error) {
    console.error("Create course error:", error)

    if (error.code === 11000) {
      return res.status(400).json({ message: "Course code already exists" })
    }

    res.status(500).json({ message: "Server error" })
  }
})

// Get faculty courses
router.get("/courses", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const courses = await Course.find({ faculty: req.user._id })
      .populate("enrolledStudents", "name email userId")
      .sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    console.error("Get courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get course students
router.get("/courses/:courseId/students", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findOne({
      _id: courseId,
      faculty: req.user._id,
    }).populate("enrolledStudents", "name email userId department")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json({
      course: {
        title: course.title,
        code: course.code,
        department: course.department,
      },
      students: course.enrolledStudents,
    })
  } catch (error) {
    console.error("Get course students error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add course material
router.post(
  "/courses/:courseId/materials",
  authenticate,
  authorize("faculty"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { courseId } = req.params
      const { title, description, type, url } = req.body

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      const material = {
        title,
        description,
        type,
        url: type === "link" ? url : undefined,
        file: req.file
          ? {
              filename: req.file.originalname,
              data: req.file.buffer,
              contentType: req.file.mimetype,
              size: req.file.size,
            }
          : undefined,
      }

      course.materials.push(material)
      await course.save()

      res.json({ message: "Material added successfully", material })
    } catch (error) {
      console.error("Add material error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Add assignment
router.post(
  "/courses/:courseId/assignments",
  authenticate,
  authorize("faculty"),
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const { courseId } = req.params
      const { title, description, dueDate, maxMarks } = req.body

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      const assignment = {
        title,
        description,
        dueDate: new Date(dueDate),
        maxMarks: Number.parseInt(maxMarks),
        attachments: req.files
          ? req.files.map((file) => ({
              filename: file.originalname,
              data: file.buffer,
              contentType: file.mimetype,
              size: file.size,
            }))
          : [],
      }

      course.assignments.push(assignment)
      await course.save()

      res.json({ message: "Assignment added successfully", assignment })
    } catch (error) {
      console.error("Add assignment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Grade assignment submission
router.patch(
  "/courses/:courseId/assignments/:assignmentId/submissions/:submissionId/grade",
  authenticate,
  authorize("faculty"),
  async (req, res) => {
    try {
      const { courseId, assignmentId, submissionId } = req.params
      const { marks, feedback } = req.body

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      const assignment = course.assignments.id(assignmentId)
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" })
      }

      const submission = assignment.submissions.id(submissionId)
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" })
      }

      submission.marks = Number.parseInt(marks)
      submission.feedback = feedback
      submission.isGraded = true

      await course.save()

      res.json({ message: "Assignment graded successfully" })
    } catch (error) {
      console.error("Grade assignment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get assignments for grading (for insights) - FIXED TO SHOW UNIQUE COURSES
router.get("/assignments", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const courses = await Course.find({ faculty: req.user._id })
      .populate("assignments.submissions.student", "name email userId")
      .select("title code assignments")

    const assignmentsForGrading = []

    courses.forEach((course) => {
      course.assignments.forEach((assignment) => {
        const ungraded = assignment.submissions.filter((sub) => !sub.isGraded)
        const graded = assignment.submissions.filter((sub) => sub.isGraded)

        assignmentsForGrading.push({
          courseId: course._id,
          courseTitle: course.title,
          courseCode: course.code,
          assignmentId: assignment._id,
          assignmentTitle: assignment.title,
          dueDate: assignment.dueDate,
          maxMarks: assignment.maxMarks,
          totalSubmissions: assignment.submissions.length,
          ungradedCount: ungraded.length,
          gradedCount: graded.length,
          submissions: assignment.submissions,
        })
      })
    })

    res.json(assignmentsForGrading)
  } catch (error) {
    console.error("Get assignments for grading error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark attendance
router.post("/courses/:courseId/attendance", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const { courseId } = req.params
    const { date, topic, attendance } = req.body

    const course = await Course.findOne({
      _id: courseId,
      faculty: req.user._id,
    })

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Check if attendance for this date already exists
    const existingAttendance = course.attendance.find(
      (att) => att.date.toDateString() === new Date(date).toDateString(),
    )

    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance for this date already exists" })
    }

    const attendanceRecord = {
      date: new Date(date),
      topic: topic || "",
      students: attendance.map((att) => ({
        student: att.studentId,
        status: att.status,
      })),
      markedBy: req.user._id,
    }

    course.attendance.push(attendanceRecord)
    await course.save()

    res.json({ message: "Attendance marked successfully" })
  } catch (error) {
    console.error("Mark attendance error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get attendance records
router.get("/courses/:courseId/attendance", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findOne({
      _id: courseId,
      faculty: req.user._id,
    })
      .populate("attendance.students.student", "name email userId")
      .populate("attendance.markedBy", "name")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json({
      course: {
        title: course.title,
        code: course.code,
      },
      attendance: course.attendance.sort((a, b) => new Date(b.date) - new Date(a.date)),
    })
  } catch (error) {
    console.error("Get attendance error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Download attendance as Excel
router.get("/courses/:courseId/attendance/download", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findOne({
      _id: courseId,
      faculty: req.user._id,
    }).populate("attendance.students.student", "name email userId")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    // Prepare data for Excel
    const attendanceData = []

    course.attendance.forEach((record) => {
      record.students.forEach((studentRecord) => {
        attendanceData.push({
          Date: record.date.toDateString(),
          Topic: record.topic,
          StudentName: studentRecord.student.name,
          StudentID: studentRecord.student.userId,
          Status: studentRecord.status,
        })
      })
    })

    // Create workbook
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(attendanceData)
    xlsx.utils.book_append_sheet(wb, ws, "Attendance")

    // Generate buffer
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" })

    res.setHeader("Content-Disposition", `attachment; filename="${course.code}_attendance.xlsx"`)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.send(buffer)
  } catch (error) {
    console.error("Download attendance error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create event
router.post("/events", authenticate, authorize("faculty"), upload.single("image"), async (req, res) => {
  try {
    const { title, description, date, time, venue, maxParticipants } = req.body

    if (!title || !description || !date || !time || !venue) {
      return res.status(400).json({ message: "All required fields must be provided" })
    }

    const event = new Event({
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      time: time.trim(),
      venue: venue.trim(),
      maxParticipants: maxParticipants ? Number.parseInt(maxParticipants) : 0,
      organizer: req.user._id,
      department: req.user.department,
    })

    if (req.file) {
      event.image = {
        filename: req.file.originalname,
        data: req.file.buffer,
        contentType: req.file.mimetype,
        size: req.file.size,
      }
    }

    await event.save()

    // Log activity
    await logActivity(
      "event_created",
      `Event "${title}" created by ${req.user.name}`,
      req.user._id,
      "Event",
      event._id,
      { eventDate: date, venue },
    )

    const populatedEvent = await Event.findById(event._id).populate("organizer", "name email userId")

    res.status(201).json({
      message: "Event created successfully and sent for approval",
      event: populatedEvent,
    })
  } catch (error) {
    console.error("Create event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get faculty events
router.get("/events", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .populate("registeredStudents.student", "name email userId department")
      .populate("organizer", "name email")
      .sort({ createdAt: -1 })

    res.json(events)
  } catch (error) {
    console.error("Get events error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete event - NEW ROUTE
router.delete("/events/:eventId", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user._id,
    })

    if (!event) {
      return res.status(404).json({ message: "Event not found or you don't have permission to delete it" })
    }

    await Event.findByIdAndDelete(eventId)

    // Log activity
    await logActivity(
      "event_deleted",
      `Event "${event.title}" deleted by ${req.user.name}`,
      req.user._id,
      "Event",
      event._id,
      { eventTitle: event.title },
    )

    res.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Delete event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Download event registrations
router.get("/events/:eventId/registrations/download", authenticate, authorize("faculty"), async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user._id,
    }).populate("registeredStudents.student", "name email userId department")

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Prepare data for Excel
    const registrationData = event.registeredStudents.map((reg) => ({
      StudentName: reg.student.name,
      StudentID: reg.student.userId,
      Email: reg.student.email,
      Department: reg.student.department,
      RegisteredAt: reg.registeredAt.toDateString(),
    }))

    // Create workbook
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(registrationData)
    xlsx.utils.book_append_sheet(wb, ws, "Registrations")

    // Generate buffer
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" })

    res.setHeader("Content-Disposition", `attachment; filename="${event.title}_registrations.xlsx"`)
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.send(buffer)
  } catch (error) {
    console.error("Download registrations error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Download course material - Faculty only
router.get(
  "/courses/:courseId/materials/:materialId/download",
  authenticate,
  authorize("faculty"),
  async (req, res) => {
    try {
      const { courseId, materialId } = req.params

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      const material = course.materials.id(materialId)
      if (!material || !material.file) {
        return res.status(404).json({ message: "Material not found" })
      }

      res.setHeader("Content-Disposition", `attachment; filename="${material.file.filename}"`)
      res.setHeader("Content-Type", material.file.contentType)
      res.send(material.file.data)
    } catch (error) {
      console.error("Download material error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Download assignment attachment - Faculty only
router.get(
  "/courses/:courseId/assignments/:assignmentId/attachments/:attachmentId/download",
  authenticate,
  authorize("faculty"),
  async (req, res) => {
    try {
      const { courseId, assignmentId, attachmentId } = req.params

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      const assignment = course.assignments.id(assignmentId)
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" })
      }

      const attachment = assignment.attachments.id(attachmentId)
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" })
      }

      res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`)
      res.setHeader("Content-Type", attachment.contentType)
      res.send(attachment.data)
    } catch (error) {
      console.error("Download attachment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Download assignment submission
router.get(
  "/courses/:courseId/assignments/:assignmentId/submissions/:submissionId/download",
  authenticate,
  authorize("faculty"),
  async (req, res) => {
    try {
      const { courseId, assignmentId, submissionId } = req.params

      const course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      const assignment = course.assignments.id(assignmentId)
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" })
      }

      const submission = assignment.submissions.id(submissionId)
      if (!submission || !submission.files || submission.files.length === 0) {
        return res.status(404).json({ message: "Submission file not found" })
      }

      const file = submission.files[0] // Get first file
      res.setHeader("Content-Disposition", `attachment; filename="${file.filename}"`)
      res.setHeader("Content-Type", file.contentType)
      res.send(file.data)
    } catch (error) {
      console.error("Download submission error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

export default router
