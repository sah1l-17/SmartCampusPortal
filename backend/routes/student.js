import express from "express"
import multer from "multer"
import Course from "../models/Course.js"
import Event from "../models/Event.js"
import Notification from "../models/Notification.js"
import Placement from "../models/Placement.js"
import { authenticate, authorize } from "../middleware/auth.js"
import { logActivity } from "../utils/activity.js"

const router = express.Router()

// Configure multer for file uploads
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

// Get student dashboard data
router.get("/dashboard", authenticate, authorize("student"), async (req, res) => {
  try {
    const studentId = req.user._id

    // Get enrolled courses
    const courses = await Course.find({
      enrolledStudents: studentId,
      isActive: true,
    })
      .populate("faculty", "name email")
      .select("title code faculty assignments materials")

    // Get upcoming events
    const upcomingEvents = await Event.find({
      status: "approved",
      date: { $gte: new Date() },
      $or: [{ department: req.user.department }, { department: { $exists: false } }],
    })
      .populate("organizer", "name")
      .sort({ date: 1 })
      .limit(5)

    // Get recent notifications
    const notifications = await Notification.find({
      $or: [
        { targetRole: "student" },
        { targetRole: { $exists: false } },
        { department: req.user.department },
        { department: { $exists: false } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(5)

    // Get placement opportunities
    const placements = await Placement.find({
      status: "active",
      applicationDeadline: { $gte: new Date() },
      $or: [{ department: req.user.department }, { department: { $exists: false } }],
    })
      .sort({ applicationDeadline: 1 })
      .limit(5)

    // Calculate assignment statistics
    let totalAssignments = 0
    let submittedAssignments = 0
    let pendingAssignments = 0

    courses.forEach((course) => {
      course.assignments.forEach((assignment) => {
        totalAssignments++
        const submission = assignment.submissions.find((sub) => sub.student.toString() === studentId.toString())
        if (submission) {
          submittedAssignments++
        } else {
          pendingAssignments++
        }
      })
    })

    const stats = {
      enrolledCourses: courses.length,
      totalAssignments,
      submittedAssignments,
      pendingAssignments,
      upcomingEvents: upcomingEvents.length,
      availablePlacements: placements.length,
    }

    res.json({
      stats,
      courses,
      upcomingEvents,
      notifications,
      placements,
    })
  } catch (error) {
    console.error("Student dashboard error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student insights
router.get("/insights", authenticate, authorize("student"), async (req, res) => {
  try {
    const studentId = req.user._id

    // Get enrolled courses with detailed assignment and attendance data
    const courses = await Course.find({
      enrolledStudents: studentId,
      isActive: true,
    })
      .populate("faculty", "name email")
      .select("title code faculty assignments attendance")

    const insights = {
      academicPerformance: {
        totalCourses: courses.length,
        totalAssignments: 0,
        submittedAssignments: 0,
        gradedAssignments: 0,
        averageScore: 0,
        totalMarks: 0,
        obtainedMarks: 0,
      },
      attendanceOverview: {
        totalClasses: 0,
        attendedClasses: 0,
        attendancePercentage: 0,
      },
      courseWisePerformance: [],
    }

    let totalScore = 0
    let totalMaxMarks = 0

    courses.forEach((course) => {
      const courseData = {
        courseId: course._id,
        courseTitle: course.title,
        courseCode: course.code,
        faculty: course.faculty.name,
        assignments: {
          total: course.assignments.length,
          submitted: 0,
          graded: 0,
          averageScore: 0,
          totalMarks: 0,
          obtainedMarks: 0,
        },
        attendance: {
          totalClasses: 0,
          attendedClasses: 0,
          attendancePercentage: 0,
        },
      }

      // Calculate assignment performance
      course.assignments.forEach((assignment) => {
        insights.academicPerformance.totalAssignments++
        const submission = assignment.submissions.find((sub) => sub.student.toString() === studentId.toString())

        if (submission) {
          insights.academicPerformance.submittedAssignments++
          courseData.assignments.submitted++

          if (submission.isGraded) {
            insights.academicPerformance.gradedAssignments++
            courseData.assignments.graded++

            const marks = submission.marks || 0
            const maxMarks = assignment.maxMarks || 0

            insights.academicPerformance.obtainedMarks += marks
            insights.academicPerformance.totalMarks += maxMarks
            courseData.assignments.obtainedMarks += marks
            courseData.assignments.totalMarks += maxMarks

            totalScore += marks
            totalMaxMarks += maxMarks
          }
        }
      })

      // Calculate course assignment average
      if (courseData.assignments.totalMarks > 0) {
        courseData.assignments.averageScore = Math.round(
          (courseData.assignments.obtainedMarks / courseData.assignments.totalMarks) * 100,
        )
      }

      // Calculate attendance
      course.attendance.forEach((attendanceRecord) => {
        const studentAttendance = attendanceRecord.students.find(
          (student) => student.student.toString() === studentId.toString(),
        )

        if (studentAttendance) {
          courseData.attendance.totalClasses++
          insights.attendanceOverview.totalClasses++

          if (studentAttendance.status === "present") {
            courseData.attendance.attendedClasses++
            insights.attendanceOverview.attendedClasses++
          }
        }
      })

      // Calculate course attendance percentage
      if (courseData.attendance.totalClasses > 0) {
        courseData.attendance.attendancePercentage = Math.round(
          (courseData.attendance.attendedClasses / courseData.attendance.totalClasses) * 100,
        )
      }

      insights.courseWisePerformance.push(courseData)
    })

    // Calculate overall averages
    if (insights.academicPerformance.totalMarks > 0) {
      insights.academicPerformance.averageScore = Math.round(
        (insights.academicPerformance.obtainedMarks / insights.academicPerformance.totalMarks) * 100,
      )
    }

    if (insights.attendanceOverview.totalClasses > 0) {
      insights.attendanceOverview.attendancePercentage = Math.round(
        (insights.attendanceOverview.attendedClasses / insights.attendanceOverview.totalClasses) * 100,
      )
    }

    res.json(insights)
  } catch (error) {
    console.error("Student insights error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student courses
router.get("/courses", authenticate, authorize("student"), async (req, res) => {
  try {
    const courses = await Course.find({
      enrolledStudents: req.user._id,
      isActive: true,
    })
      .populate("faculty", "name email")
      .sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    console.error("Get student courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get course details
router.get("/courses/:courseId", authenticate, authorize("student"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findOne({
      _id: courseId,
      enrolledStudents: req.user._id,
      isActive: true,
    })
      .populate("faculty", "name email")
      .populate("assignments.submissions.student", "name email userId")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    console.error("Get course details error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Submit assignment
router.post(
  "/courses/:courseId/assignments/:assignmentId/submit",
  authenticate,
  authorize("student"),
  upload.array("files", 5),
  async (req, res) => {
    try {
      const { courseId, assignmentId } = req.params

      const course = await Course.findOne({
        _id: courseId,
        enrolledStudents: req.user._id,
        isActive: true,
      })

      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }

      const assignment = course.assignments.id(assignmentId)
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" })
      }

      // Check if assignment is overdue
      if (new Date() > assignment.dueDate) {
        return res.status(400).json({ message: "Assignment submission deadline has passed" })
      }

      // Check if student has already submitted
      const existingSubmission = assignment.submissions.find(
        (sub) => sub.student.toString() === req.user._id.toString(),
      )

      if (existingSubmission) {
        return res.status(400).json({ message: "Assignment already submitted" })
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "At least one file is required" })
      }

      const submission = {
        student: req.user._id,
        files: req.files.map((file) => ({
          filename: file.originalname,
          data: file.buffer,
          contentType: file.mimetype,
          size: file.size,
        })),
        submittedAt: new Date(),
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
        { courseId, courseTitle: course.title },
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
        isActive: true,
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
        isActive: true,
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

// Get student attendance
router.get("/attendance", authenticate, authorize("student"), async (req, res) => {
  try {
    const studentId = req.user._id

    const courses = await Course.find({
      enrolledStudents: studentId,
      isActive: true,
    })
      .populate("faculty", "name email")
      .select("title code faculty attendance")

    const attendanceData = courses.map((course) => {
      const courseAttendance = {
        courseId: course._id,
        courseTitle: course.title,
        courseCode: course.code,
        faculty: course.faculty.name,
        totalClasses: 0,
        attendedClasses: 0,
        attendancePercentage: 0,
        records: [],
      }

      course.attendance.forEach((record) => {
        const studentRecord = record.students.find((student) => student.student.toString() === studentId.toString())

        if (studentRecord) {
          courseAttendance.totalClasses++
          const attended = studentRecord.status === "present"
          if (attended) {
            courseAttendance.attendedClasses++
          }

          courseAttendance.records.push({
            date: record.date,
            topic: record.topic,
            status: studentRecord.status,
            markedAt: studentRecord.markedAt,
          })
        }
      })

      // Calculate attendance percentage
      if (courseAttendance.totalClasses > 0) {
        courseAttendance.attendancePercentage = Math.round(
          (courseAttendance.attendedClasses / courseAttendance.totalClasses) * 100,
        )
      }

      // Sort records by date (newest first)
      courseAttendance.records.sort((a, b) => new Date(b.date) - new Date(a.date))

      return courseAttendance
    })

    res.json(attendanceData)
  } catch (error) {
    console.error("Get student attendance error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get events
router.get("/events", authenticate, authorize("student"), async (req, res) => {
  try {
    const events = await Event.find({
      status: "approved",
      $or: [{ department: req.user.department }, { department: { $exists: false } }],
    })
      .populate("organizer", "name email")
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

    if (new Date() > event.date) {
      return res.status(400).json({ message: "Event registration has closed" })
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
    )

    res.json({ message: "Successfully registered for the event" })
  } catch (error) {
    console.error("Register for event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get notifications
router.get("/notifications", authenticate, authorize("student"), async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetRole: "student" },
        { targetRole: { $exists: false } },
        { department: req.user.department },
        { department: { $exists: false } },
      ],
    })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })

    res.json(notifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get placements
router.get("/placements", authenticate, authorize("student"), async (req, res) => {
  try {
    const placements = await Placement.find({
      status: "active",
      $or: [{ department: req.user.department }, { department: { $exists: false } }],
    }).sort({ applicationDeadline: 1 })

    res.json(placements)
  } catch (error) {
    console.error("Get placements error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Apply for placement
router.post("/placements/:placementId/apply", authenticate, authorize("student"), async (req, res) => {
  try {
    const { placementId } = req.params

    const placement = await Placement.findById(placementId)
    if (!placement) {
      return res.status(404).json({ message: "Placement not found" })
    }

    if (placement.status !== "active") {
      return res.status(400).json({ message: "Placement is not active" })
    }

    if (new Date() > placement.applicationDeadline) {
      return res.status(400).json({ message: "Application deadline has passed" })
    }

    // Check if already applied
    const alreadyApplied = placement.appliedStudents.some((app) => app.student.toString() === req.user._id.toString())

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied for this placement" })
    }

    placement.appliedStudents.push({
      student: req.user._id,
      appliedAt: new Date(),
    })

    await placement.save()

    // Log activity
    await logActivity(
      "placement_applied",
      `Student ${req.user.name} applied for placement "${placement.company} - ${placement.position}"`,
      req.user._id,
      "Placement",
      placement._id,
    )

    res.json({ message: "Successfully applied for the placement" })
  } catch (error) {
    console.error("Apply for placement error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
