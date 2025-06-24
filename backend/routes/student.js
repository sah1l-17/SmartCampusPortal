import express from "express"
import multer from "multer"
import Course from "../models/Course.js"
import Event from "../models/Event.js"
import { authenticate, authorize } from "../middleware/auth.js"

const router = express.Router()

// Configure multer for file uploads with size limit
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Invalid file type"))
    }
  },
})

// Get student courses
router.get("/courses", authenticate, authorize("student"), async (req, res) => {
  try {
    const courses = await Course.find({ enrolledStudents: req.user._id })
      .populate("faculty", "name email")
      .sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    console.error("Get student courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student events
router.get("/events", authenticate, authorize("student"), async (req, res) => {
  try {
    const events = await Event.find({
      status: "approved",
      isActive: true,
    })
      .populate("organizer", "name")
      .sort({ date: 1 })

    res.json(events)
  } catch (error) {
    console.error("Get student events error:", error)
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
      return res.status(400).json({ message: "Event is not approved" })
    }

    // Check if already registered
    const alreadyRegistered = event.registeredStudents.some((reg) => reg.student.toString() === req.user._id.toString())

    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered for this event" })
    }

    // Check capacity
    if (event.maxParticipants > 0 && event.registeredStudents.length >= event.maxParticipants) {
      return res.status(400).json({ message: "Event is full" })
    }

    event.registeredStudents.push({ student: req.user._id })
    await event.save()

    res.json({ message: "Successfully registered for event" })
  } catch (error) {
    console.error("Register for event error:", error)
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
        return res.status(404).json({ message: "Course not found" })
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

      res.json({ message: "Assignment submitted successfully" })
    } catch (error) {
      console.error("Submit assignment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get student performance/insights
router.get("/performance", authenticate, authorize("student"), async (req, res) => {
  try {
    const courses = await Course.find({ enrolledStudents: req.user._id })
      .populate("faculty", "name")
      .populate("assignments.submissions.student", "name email userId")

    const performance = courses.map((course) => {
      const assignments = course.assignments || []
      const studentSubmissions = assignments.map((assignment) => {
        const submission = assignment.submissions.find((sub) => sub.student._id.toString() === req.user._id.toString())
        return {
          assignmentId: assignment._id,
          title: assignment.title,
          maxMarks: assignment.maxMarks,
          dueDate: assignment.dueDate,
          isSubmitted: !!submission,
          marks: submission?.marks || 0,
          feedback: submission?.feedback || "",
          isGraded: submission?.isGraded || false,
        }
      })

      const totalMarks = assignments.reduce((sum, assignment) => sum + assignment.maxMarks, 0)
      const obtainedMarks = studentSubmissions.reduce(
        (sum, submission) => sum + (submission.isGraded ? submission.marks : 0),
        0,
      )
      const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(1) : 0

      // Calculate attendance percentage
      const attendanceRecords = course.attendance || []
      const totalClasses = attendanceRecords.length
      const attendedClasses = attendanceRecords.filter((record) =>
        record.students.some(
          (student) =>
            student.student.toString() === req.user._id.toString() &&
            (student.status === "present" || student.status === "late"),
        ),
      ).length

      const attendancePercentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(1) : 0

      return {
        courseId: course._id,
        courseTitle: course.title,
        courseCode: course.code,
        faculty: course.faculty.name,
        assignments: studentSubmissions,
        totalMarks,
        obtainedMarks,
        percentage: Number.parseFloat(percentage),
        attendancePercentage: Number.parseFloat(attendancePercentage),
        totalClasses,
        attendedClasses,
      }
    })

    res.json(performance)
  } catch (error) {
    console.error("Get student performance error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student attendance for all courses
router.get("/attendance", authenticate, authorize("student"), async (req, res) => {
  try {
    const courses = await Course.find({ enrolledStudents: req.user._id })
      .populate("faculty", "name")
      .populate("attendance.students.student", "name email userId")

    const attendanceData = courses.map((course) => {
      const attendanceRecords = course.attendance.map((record) => {
        const studentRecord = record.students.find(
          (student) => student.student._id.toString() === req.user._id.toString(),
        )

        return {
          date: record.date,
          topic: record.topic,
          status: studentRecord ? studentRecord.status : "absent",
        }
      })

      const totalClasses = attendanceRecords.length
      const presentCount = attendanceRecords.filter((record) => record.status === "present").length
      const lateCount = attendanceRecords.filter((record) => record.status === "late").length
      const absentCount = attendanceRecords.filter((record) => record.status === "absent").length

      const attendancePercentage = totalClasses > 0 ? (((presentCount + lateCount) / totalClasses) * 100).toFixed(1) : 0

      return {
        courseId: course._id,
        courseTitle: course.title,
        courseCode: course.code,
        faculty: course.faculty.name,
        records: attendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date)),
        summary: {
          totalClasses,
          presentCount,
          lateCount,
          absentCount,
          attendancePercentage: Number.parseFloat(attendancePercentage),
        },
      }
    })

    res.json(attendanceData)
  } catch (error) {
    console.error("Get student attendance error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

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

export default router
