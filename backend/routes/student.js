import express from "express"
import Course from "../models/Course.js"
import Event from "../models/Event.js"
import Notification from "../models/Notification.js"
import Placement from "../models/Placement.js"
import { authenticate, authorize } from "../middleware/auth.js"
import { logActivity } from "../utils/activity.js"
import multer from "multer"

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|zip|rar/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    if (extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// Get student courses
router.get("/courses", authenticate, authorize("student"), async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user._id,
    })
      .populate("faculty", "name email")
      .sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    console.error("Get student courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single course for student
router.get("/courses/:courseId", authenticate, authorize("student"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findOne({
      _id: courseId,
      enrolledStudents: req.user._id,
    })
      .populate("faculty", "name email")
      .populate("assignments.submissions.student", "name email userId")

    if (!course) {
      return res.status(404).json({ message: "Course not found or you're not enrolled" })
    }

    res.json(course)
  } catch (error) {
    console.error("Get course error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Submit assignment
router.post(
  "/courses/:courseId/assignments/:assignmentId/submit",
  authenticate,
  authorize("student"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { courseId, assignmentId } = req.params

      const course = await Course.findOne({
        _id: courseId,
        enrolledStudents: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found or you're not enrolled" })
      }

      const assignment = course.assignments.id(assignmentId)
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" })
      }

      // Check if already submitted
      const existingSubmission = assignment.submissions.find(
        (sub) => sub.student.toString() === req.user._id.toString(),
      )

      if (existingSubmission) {
        return res.status(400).json({ message: "Assignment already submitted" })
      }

      // Check if overdue
      if (new Date() > assignment.dueDate) {
        return res.status(400).json({ message: "Assignment submission deadline has passed" })
      }

      const submission = {
        student: req.user._id,
        submittedAt: new Date(),
        files: req.file
          ? [
              {
                filename: req.file.originalname,
                data: req.file.buffer,
                contentType: req.file.mimetype,
                size: req.file.size,
              },
            ]
          : [],
      }

      assignment.submissions.push(submission)
      await course.save()

      // Log activity
      await logActivity(
        "assignment_submitted",
        `Assignment "${assignment.title}" submitted by ${req.user.name}`,
        req.user._id,
        "Assignment",
        assignment._id,
        { courseId, assignmentTitle: assignment.title },
      )

      res.json({ message: "Assignment submitted successfully" })
    } catch (error) {
      console.error("Submit assignment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Download course material
router.get(
  "/courses/:courseId/materials/:materialId/download",
  authenticate,
  authorize("student"),
  async (req, res) => {
    try {
      const { courseId, materialId } = req.params

      const course = await Course.findOne({
        _id: courseId,
        enrolledStudents: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found or you're not enrolled" })
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

// Download assignment attachment
router.get(
  "/courses/:courseId/assignments/:assignmentId/attachments/:attachmentId/download",
  authenticate,
  authorize("student"),
  async (req, res) => {
    try {
      const { courseId, assignmentId, attachmentId } = req.params

      const course = await Course.findOne({
        _id: courseId,
        enrolledStudents: req.user._id,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found or you're not enrolled" })
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

// Get student events
router.get("/events", authenticate, authorize("student"), async (req, res) => {
  try {
    const events = await Event.find({
      status: "approved",
      isActive: true,
    })
      .populate("organizer", "name email")
      .populate("registeredStudents.student", "name email userId")
      .sort({ date: 1 })

    res.json(events)
  } catch (error) {
    console.error("Get events error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Register for event
router.post("/events/:eventId/register", authenticate, authorize("student"), async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    if (event.status !== "approved") {
      return res.status(400).json({ message: "Event is not approved for registration" })
    }

    // Check if already registered
    const alreadyRegistered = event.registeredStudents.some((reg) => reg.student.toString() === req.user._id.toString())

    if (alreadyRegistered) {
      return res.status(400).json({ message: "You are already registered for this event" })
    }

    // Check capacity
    if (event.maxParticipants > 0 && event.registeredStudents.length >= event.maxParticipants) {
      return res.status(400).json({ message: "Event is full" })
    }

    // Check if event has passed
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: "Cannot register for past events" })
    }

    event.registeredStudents.push({
      student: req.user._id,
      registeredAt: new Date(),
    })

    await event.save()

    // Log activity
    await logActivity(
      "event_registered",
      `Student ${req.user.name} registered for event "${event.title}"`,
      req.user._id,
      "Event",
      event._id,
      { eventTitle: event.title },
    )

    res.json({ message: "Successfully registered for event" })
  } catch (error) {
    console.error("Register for event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student notifications
router.get("/notifications", authenticate, authorize("student"), async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipients: "students" },
        { recipients: "all" },
        { recipients: "department", department: req.user.department },
      ],
    })
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(notifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student attendance
router.get("/attendance", authenticate, authorize("student"), async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user._id,
    })
      .populate("faculty", "name")
      .select("title code attendance")

    const attendanceData = []

    courses.forEach((course) => {
      course.attendance.forEach((record) => {
        const studentAttendance = record.students.find((s) => s.student.toString() === req.user._id.toString())

        if (studentAttendance) {
          attendanceData.push({
            courseTitle: course.title,
            courseCode: course.code,
            date: record.date,
            topic: record.topic,
            status: studentAttendance.status,
          })
        }
      })
    })

    // Sort by date (newest first)
    attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date))

    res.json(attendanceData)
  } catch (error) {
    console.error("Get attendance error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student performance insights
router.get("/insights", authenticate, authorize("student"), async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user._id,
    }).select("title code assignments attendance")

    const insights = {
      totalCourses: courses.length,
      totalAssignments: 0,
      submittedAssignments: 0,
      gradedAssignments: 0,
      averageGrade: 0,
      attendancePercentage: 0,
      courseWiseData: [],
    }

    let totalGrades = 0
    let totalAttendanceRecords = 0
    let presentCount = 0

    courses.forEach((course) => {
      const courseData = {
        courseTitle: course.title,
        courseCode: course.code,
        assignments: 0,
        submitted: 0,
        graded: 0,
        averageGrade: 0,
        attendancePercentage: 0,
      }

      // Assignment data
      course.assignments.forEach((assignment) => {
        insights.totalAssignments++
        courseData.assignments++

        const submission = assignment.submissions.find((sub) => sub.student.toString() === req.user._id.toString())

        if (submission) {
          insights.submittedAssignments++
          courseData.submitted++

          if (submission.isGraded) {
            insights.gradedAssignments++
            courseData.graded++
            totalGrades += submission.marks
            courseData.averageGrade += submission.marks
          }
        }
      })

      if (courseData.graded > 0) {
        courseData.averageGrade = courseData.averageGrade / courseData.graded
      }

      // Attendance data
      let coursePresentCount = 0
      let courseAttendanceRecords = 0

      course.attendance.forEach((record) => {
        const studentAttendance = record.students.find((s) => s.student.toString() === req.user._id.toString())

        if (studentAttendance) {
          totalAttendanceRecords++
          courseAttendanceRecords++

          if (studentAttendance.status === "present") {
            presentCount++
            coursePresentCount++
          }
        }
      })

      if (courseAttendanceRecords > 0) {
        courseData.attendancePercentage = (coursePresentCount / courseAttendanceRecords) * 100
      }

      insights.courseWiseData.push(courseData)
    })

    if (insights.gradedAssignments > 0) {
      insights.averageGrade = totalGrades / insights.gradedAssignments
    }

    if (totalAttendanceRecords > 0) {
      insights.attendancePercentage = (presentCount / totalAttendanceRecords) * 100
    }

    res.json(insights)
  } catch (error) {
    console.error("Get insights error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get placement records for student's department
router.get("/placements", authenticate, authorize("student"), async (req, res) => {
  try {
    const { year } = req.query
    const filter = { department: req.user.department }

    if (year) {
      filter.yearOfPlacement = Number.parseInt(year)
    }

    const placements = await Placement.find(filter).sort({ yearOfPlacement: -1, createdAt: -1 })

    res.json(placements)
  } catch (error) {
    console.error("Get placements error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
