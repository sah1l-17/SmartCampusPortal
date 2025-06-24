import express from "express"
import multer from "multer"
import xlsx from "xlsx"
import User from "../models/User.js"
import Event from "../models/Event.js"
import Placement from "../models/Placement.js"
import Notification from "../models/Notification.js"
import Activity from "../models/Activity.js"
import Course from "../models/Course.js"
import { authenticate, authorize } from "../middleware/auth.js"
import { logActivity } from "../utils/activity.js"

const router = express.Router()

// Configure multer for file uploads with size limit
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /xlsx|xls|csv|pdf|doc|docx|jpg|jpeg|png|gif|mp4|avi|mov|txt|zip|rar/
    const extname = allowedTypes.test(file.originalname.toLowerCase())
    if (extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only Excel, PDF, DOC, image, video, and archive files are allowed"))
    }
  },
})

// Dashboard stats
router.get("/dashboard-stats", authenticate, authorize("admin"), async (req, res) => {
  try {
    const [totalStudents, totalFaculty, totalEvents, pendingEvents] = await Promise.all([
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "faculty", isActive: true }),
      Event.countDocuments(),
      Event.countDocuments({ status: "pending" }),
    ])

    res.json({
      totalStudents,
      totalFaculty,
      totalEvents,
      pendingEvents,
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get recent activities
router.get("/recent-activities", authenticate, authorize("admin"), async (req, res) => {
  try {
    const activities = await Activity.find().populate("user", "name").sort({ createdAt: -1 }).limit(10)

    res.json(activities)
  } catch (error) {
    console.error("Recent activities error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get pending events
router.get("/pending-events", authenticate, authorize("admin"), async (req, res) => {
  try {
    const events = await Event.find({ status: "pending" })
      .populate("organizer", "name email department")
      .sort({ createdAt: -1 })

    res.json(events)
  } catch (error) {
    console.error("Pending events error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update event status
router.patch("/events/:eventId/status", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { eventId } = req.params
    const { status } = req.body

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        status,
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true },
    )

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Log activity
    await logActivity(
      "event_status_updated",
      `Event "${event.title}" ${status} by ${req.user.name}`,
      req.user._id,
      "Event",
      event._id,
      { status },
    )

    res.json({ message: `Event ${status} successfully` })
  } catch (error) {
    console.error("Update event status error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update event capacity - FIXED VERSION
router.patch("/events/:eventId/capacity", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { eventId } = req.params
    const { maxParticipants } = req.body

    if (!maxParticipants || maxParticipants < 0) {
      return res.status(400).json({ message: "Invalid capacity value" })
    }

    // Get the current event first
    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if new capacity is less than current registrations
    const currentRegistrations = event.registeredStudents.length
    if (maxParticipants < currentRegistrations) {
      return res.status(400).json({ 
        message: `Cannot set capacity below current registrations (${currentRegistrations} students already registered)`
      })
    }

    // Update the capacity
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { maxParticipants: Number(maxParticipants) },
      { new: true }
    )

    // Log activity
    await logActivity(
      "event_capacity_updated",
      `Event "${updatedEvent.title}" capacity updated to ${maxParticipants} by ${req.user.name}`,
      req.user._id,
      "Event",
      updatedEvent._id,
      { newCapacity: maxParticipants },
    )

    res.json({ message: "Event capacity updated successfully", event: updatedEvent })
  } catch (error) {
    console.error("Update event capacity error:", error)
    res.status(500).json({ message: "Server error" })
  }
})
// Get users with filtering
router.get("/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { role, department } = req.query
    const filter = {}

    if (role && role !== "all") {
      filter.role = role
    }

    if (department && department !== "all") {
      filter.department = department
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 })

    res.json(users)
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all courses with enrolled students (for admin)
router.get("/courses", authenticate, authorize("admin"), async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("faculty", "name email userId")
      .populate("enrolledStudents", "name email userId department")
      .sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    console.error("Get courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Toggle user status
router.patch("/users/:userId/toggle-status", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot modify admin user" })
    }

    user.isActive = !user.isActive
    await user.save()

    // Log activity
    await logActivity(
      "user_status_updated",
      `User ${user.name} ${user.isActive ? "activated" : "deactivated"} by ${req.user.name}`,
      req.user._id,
      "User",
      user._id,
      { isActive: user.isActive },
    )

    res.json({ message: "User status updated successfully" })
  } catch (error) {
    console.error("Toggle user status error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete user
router.delete("/users/:userId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin user" })
    }

    await user.deleteOne()

    // Log activity
    await logActivity("user_deleted", `User ${user.name} deleted by ${req.user.name}`, req.user._id, "User", user._id, {
      deletedUser: user.name,
    })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get student by ID for placement - FIXED
router.get("/students/:studentId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { studentId } = req.params

    // Try to find by userId first, then by _id
    let student = await User.findOne({
      userId: studentId,
      role: "student",
    }).select("-password")

    // If not found by userId, try by _id
    if (!student) {
      student = await User.findOne({
        _id: studentId,
        role: "student",
      }).select("-password")
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }

    res.json({
      _id: student._id,
      name: student.name,
      email: student.email,
      department: student.department,
      userId: student.userId,
      yearOfPlacement: new Date().getFullYear(), // Default to current year
    })
  } catch (error) {
    console.error("Get student error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Add single placement record
router.post("/placements", authenticate, authorize("admin"), async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      companyName,
      package: packageAmount,
      yearOfPlacement,
      department,
      jobRole,
      placementType,
    } = req.body

    // Validate student exists
    const student = await User.findOne({ userId: studentId, role: "student" })
    if (!student) {
      return res.status(400).json({ message: "Invalid student ID. Student not found." })
    }

    // Check if placement already exists for this student and year
    const existingPlacement = await Placement.findOne({ studentId, yearOfPlacement })
    if (existingPlacement) {
      return res.status(400).json({ message: "Placement record already exists for this student and year" })
    }

    const placement = new Placement({
      studentId,
      studentName: studentName || student.name,
      companyName,
      package: packageAmount,
      yearOfPlacement,
      department: department || student.department,
      jobRole,
      placementType,
      addedBy: req.user._id,
    })

    await placement.save()

    // Log activity
    await logActivity(
      "placement_added",
      `Placement record added for ${studentName} at ${companyName}`,
      req.user._id,
      "Placement",
      placement._id,
      { studentId, companyName, package: packageAmount },
    )

    res.status(201).json({ message: "Placement record added successfully", placement })
  } catch (error) {
    console.error("Add placement error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Upload placements via Excel - UPDATED with better validation and upsert functionality
router.post("/placements/upload", authenticate, authorize("admin"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    const results = {
      success: 0,
      updated: 0,
      errors: [],
      invalidStudents: [],
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      try {
        // Handle different possible column names
        const studentId = row.StudentID || row.studentId || row["Student ID"] || row["Student Id"]
        const studentName = row.StudentName || row.studentName || row["Student Name"]
        const companyName = row.CompanyName || row.companyName || row["Company Name"] || row.Company
        const packageAmount = row.Package || row.package || row["Package (LPA)"] || row.Salary
        const yearOfPlacement =
          row.YearOfPlacement || row.yearOfPlacement || row["Year of Placement"] || row.Year || new Date().getFullYear()
        const department = row.Department || row.department
        const jobRole = row.JobRole || row.jobRole || row["Job Role"] || row.Role || ""
        const placementType = row.PlacementType || row.placementType || row["Placement Type"] || "campus"

        // Validate required fields
        if (!studentId || !studentName || !companyName || !packageAmount) {
          results.errors.push(`Row ${i + 2}: Missing required fields (StudentID, StudentName, CompanyName, Package)`)
          continue
        }

        // Validate student exists
        const student = await User.findOne({ userId: studentId, role: "student" })
        if (!student) {
          results.invalidStudents.push(`Row ${i + 2}: Invalid student ID ${studentId}`)
          continue
        }

        // Check if placement already exists for this student and year
        const existingPlacement = await Placement.findOne({
          studentId: studentId,
          yearOfPlacement: Number(yearOfPlacement),
        })

        if (existingPlacement) {
          // Update existing placement
          existingPlacement.studentName = studentName
          existingPlacement.companyName = companyName
          existingPlacement.package = Number(packageAmount)
          existingPlacement.department = department || student.department
          existingPlacement.jobRole = jobRole
          existingPlacement.placementType = placementType
          existingPlacement.addedBy = req.user._id

          await existingPlacement.save()
          results.updated++
        } else {
          // Create new placement
          const placement = new Placement({
            studentId: studentId,
            studentName: studentName,
            companyName: companyName,
            package: Number(packageAmount),
            yearOfPlacement: Number(yearOfPlacement),
            department: department || student.department,
            jobRole: jobRole,
            placementType: placementType,
            addedBy: req.user._id,
          })

          await placement.save()
          results.success++
        }
      } catch (error) {
        results.errors.push(`Row ${i + 2}: ${error.message}`)
      }
    }

    // Log activity
    await logActivity(
      "placements_uploaded",
      `${results.success} new and ${results.updated} updated placement records via Excel`,
      req.user._id,
      "Placement",
      null,
      {
        successCount: results.success,
        updatedCount: results.updated,
        errorCount: results.errors.length,
        invalidStudentCount: results.invalidStudents.length,
      },
    )

    res.json({
      message: `Upload completed. ${results.success} new records added, ${results.updated} records updated.`,
      results,
    })
  } catch (error) {
    console.error("Upload placements error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Broadcast notification
router.post("/broadcast", authenticate, authorize("admin"), upload.array("attachments", 5), async (req, res) => {
  try {
    const { title, message, type, recipients, priority, department } = req.body

    const notification = new Notification({
      title,
      message,
      type,
      recipients,
      priority,
      department: recipients === "department" ? department : undefined,
      sender: req.user._id,
      attachments: req.files
        ? req.files.map((file) => ({
            filename: file.originalname,
            data: file.buffer,
            contentType: file.mimetype,
            size: file.size,
          }))
        : [],
    })

    await notification.save()

    // Log activity
    await logActivity(
      "notification_broadcast",
      `Notification "${title}" broadcasted to ${recipients}`,
      req.user._id,
      "Notification",
      notification._id,
      { recipients, type, priority },
    )

    res.json({ message: "Notification broadcasted successfully" })
  } catch (error) {
    console.error("Broadcast notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})


export default router
