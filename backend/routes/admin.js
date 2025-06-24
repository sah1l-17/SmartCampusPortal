import express from "express"
import multer from "multer"
import xlsx from "xlsx"
import User from "../models/User.js"
import Course from "../models/Course.js"
import Event from "../models/Event.js"
import Placement from "../models/Placement.js"
import Notification from "../models/Notification.js"
import Activity from "../models/Activity.js"
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

// Get all users
router.get("/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 10 } = req.query

    const query = {}

    if (role && role !== "all") {
      query.role = role
    }

    if (department && department !== "all") {
      query.department = department
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { userId: { $regex: search, $options: "i" } },
      ]
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await User.countDocuments(query)

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create user
router.post("/users", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { name, email, userId, role, department, phone } = req.body

    if (!name || !email || !userId || !role || !department) {
      return res.status(400).json({ message: "All required fields must be provided" })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { userId }],
    })

    if (existingUser) {
      return res.status(400).json({ message: "User with this email or ID already exists" })
    }

    // Generate default password
    const defaultPassword = `${userId}@${new Date().getFullYear()}`

    const user = new User({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      userId: userId.trim(),
      password: defaultPassword,
      role,
      department: department.trim(),
      phone: phone?.trim(),
      isActive: true,
    })

    await user.save()

    // Log activity
    await logActivity("user_created", `User ${name} (${userId}) created by admin`, req.user._id, "User", user._id, {
      role,
      department,
    })

    // Remove password from response
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
      defaultPassword,
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update user
router.put("/users/:userId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params
    const { name, email, role, department, phone, isActive } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Update fields
    if (name) user.name = name.trim()
    if (email) user.email = email.trim().toLowerCase()
    if (role) user.role = role
    if (department) user.department = department.trim()
    if (phone !== undefined) user.phone = phone?.trim()
    if (isActive !== undefined) user.isActive = isActive

    await user.save()

    // Log activity
    await logActivity("user_updated", `User ${user.name} updated by admin`, req.user._id, "User", user._id, {
      role: user.role,
      department: user.department,
    })

    const userResponse = user.toObject()
    delete userResponse.password

    res.json({
      message: "User updated successfully",
      user: userResponse,
    })
  } catch (error) {
    console.error("Update user error:", error)
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

    await User.findByIdAndDelete(userId)

    // Log activity
    await logActivity("user_deleted", `User ${user.name} deleted by admin`, req.user._id, "User", user._id, {
      role: user.role,
      department: user.department,
    })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Reset user password
router.post("/users/:userId/reset-password", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Generate new password
    const newPassword = `${user.userId}@${new Date().getFullYear()}`
    user.password = newPassword

    await user.save()

    // Log activity
    await logActivity("password_reset", `Password reset for user ${user.name} by admin`, req.user._id, "User", user._id)

    res.json({
      message: "Password reset successfully",
      newPassword,
    })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all courses
router.get("/courses", authenticate, authorize("admin"), async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("faculty", "name email userId")
      .populate("enrolledStudents", "name email userId")
      .sort({ createdAt: -1 })

    res.json(courses)
  } catch (error) {
    console.error("Get courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get course details
router.get("/courses/:courseId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findById(courseId)
      .populate("faculty", "name email userId")
      .populate("enrolledStudents", "name email userId")
      .populate("attendance.students.student", "name email userId")
      .populate("attendance.markedBy", "name")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    console.error("Get course details error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Download course material
router.get("/courses/:courseId/materials/:materialId/download", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { courseId, materialId } = req.params

    const course = await Course.findById(courseId)

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
})

// Download assignment attachment
router.get(
  "/courses/:courseId/assignments/:assignmentId/attachments/:attachmentId/download",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const { courseId, assignmentId, attachmentId } = req.params

      const course = await Course.findById(courseId)

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

// Get all events
router.get("/events", authenticate, authorize("admin"), async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer", "name email userId")
      .populate("registeredStudents.student", "name email userId department")
      .sort({ createdAt: -1 })

    res.json(events)
  } catch (error) {
    console.error("Get events error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Approve/Reject event
router.patch("/events/:eventId/status", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { eventId } = req.params
    const { status, rejectionReason } = req.body

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    event.status = status
    if (status === "rejected" && rejectionReason) {
      event.rejectionReason = rejectionReason
    }

    await event.save()

    // Log activity
    await logActivity(
      `event_${status}`,
      `Event "${event.title}" ${status} by admin`,
      req.user._id,
      "Event",
      event._id,
      { status, rejectionReason },
    )

    res.json({
      message: `Event ${status} successfully`,
      event,
    })
  } catch (error) {
    console.error("Update event status error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete event
router.delete("/events/:eventId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    await Event.findByIdAndDelete(eventId)

    // Log activity
    await logActivity("event_deleted", `Event "${event.title}" deleted by admin`, req.user._id, "Event", event._id)

    res.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Delete event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all placements
router.get("/placements", authenticate, authorize("admin"), async (req, res) => {
  try {
    const placements = await Placement.find()
      .populate("student", "name email userId department")
      .sort({ createdAt: -1 })

    res.json(placements)
  } catch (error) {
    console.error("Get placements error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create placement
router.post("/placements", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { studentId, companyName, jobRole, packageAmount, yearOfPlacement } = req.body

    if (!studentId || !companyName || !jobRole || !packageAmount || !yearOfPlacement) {
      return res.status(400).json({ message: "All fields are required" })
    }

    // Check if student exists
    const student = await User.findById(studentId)
    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" })
    }

    const placement = new Placement({
      student: studentId,
      companyName: companyName.trim(),
      jobRole: jobRole.trim(),
      packageAmount: Number.parseFloat(packageAmount),
      yearOfPlacement: Number.parseInt(yearOfPlacement),
    })

    await placement.save()

    // Log activity
    await logActivity(
      "placement_created",
      `Placement record created for ${student.name} at ${companyName}`,
      req.user._id,
      "Placement",
      placement._id,
      { companyName, jobRole, packageAmount },
    )

    const populatedPlacement = await Placement.findById(placement._id).populate(
      "student",
      "name email userId department",
    )

    res.status(201).json({
      message: "Placement created successfully",
      placement: populatedPlacement,
    })
  } catch (error) {
    console.error("Create placement error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update placement
router.put("/placements/:placementId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { placementId } = req.params
    const { companyName, jobRole, packageAmount, yearOfPlacement } = req.body

    const placement = await Placement.findById(placementId)
    if (!placement) {
      return res.status(404).json({ message: "Placement not found" })
    }

    if (companyName) placement.companyName = companyName.trim()
    if (jobRole) placement.jobRole = jobRole.trim()
    if (packageAmount) placement.packageAmount = Number.parseFloat(packageAmount)
    if (yearOfPlacement) placement.yearOfPlacement = Number.parseInt(yearOfPlacement)

    await placement.save()

    // Log activity
    await logActivity(
      "placement_updated",
      `Placement record updated for placement ID ${placementId}`,
      req.user._id,
      "Placement",
      placement._id,
    )

    const populatedPlacement = await Placement.findById(placement._id).populate(
      "student",
      "name email userId department",
    )

    res.json({
      message: "Placement updated successfully",
      placement: populatedPlacement,
    })
  } catch (error) {
    console.error("Update placement error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete placement
router.delete("/placements/:placementId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { placementId } = req.params

    const placement = await Placement.findById(placementId)
    if (!placement) {
      return res.status(404).json({ message: "Placement not found" })
    }

    await Placement.findByIdAndDelete(placementId)

    // Log activity
    await logActivity(
      "placement_deleted",
      `Placement record deleted for placement ID ${placementId}`,
      req.user._id,
      "Placement",
      placement._id,
    )

    res.json({ message: "Placement deleted successfully" })
  } catch (error) {
    console.error("Delete placement error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Upload placements via Excel
router.post("/placements/upload", authenticate, authorize("admin"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Parse Excel file
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    if (data.length === 0) {
      return res.status(400).json({ message: "Excel file is empty" })
    }

    // Validate required columns
    const requiredColumns = [
      "StudentID",
      "StudentName",
      "CompanyName",
      "Package",
      "YearOfPlacement",
      "Department",
      "JobRole",
    ]
    const firstRow = data[0]
    const missingColumns = requiredColumns.filter((col) => !(col in firstRow))

    if (missingColumns.length > 0) {
      return res.status(400).json({
        message: `Missing required columns: ${missingColumns.join(", ")}. Required columns are: ${requiredColumns.join(", ")}`,
      })
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
    }

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // Excel row number (accounting for header)

      try {
        // Validate required fields
        if (
          !row.StudentID ||
          !row.StudentName ||
          !row.CompanyName ||
          !row.Package ||
          !row.YearOfPlacement ||
          !row.Department ||
          !row.JobRole
        ) {
          results.failed++
          results.errors.push(`Row ${rowNumber}: Missing required fields`)
          continue
        }

        // Find student by StudentID
        const student = await User.findOne({
          userId: row.StudentID.toString().trim(),
          role: "student",
        })

        if (!student) {
          results.failed++
          results.errors.push(`Row ${rowNumber}: Student with ID ${row.StudentID} not found`)
          continue
        }

        // Validate student name matches
        if (student.name.trim().toLowerCase() !== row.StudentName.toString().trim().toLowerCase()) {
          results.failed++
          results.errors.push(
            `Row ${rowNumber}: Student name "${row.StudentName}" does not match database record "${student.name}" for ID ${row.StudentID}`,
          )
          continue
        }

        // Validate department matches
        if (student.department.trim().toLowerCase() !== row.Department.toString().trim().toLowerCase()) {
          results.failed++
          results.errors.push(
            `Row ${rowNumber}: Department "${row.Department}" does not match student's department "${student.department}" for ID ${row.StudentID}`,
          )
          continue
        }

        // Validate package is a number
        const packageAmount = Number.parseFloat(row.Package)
        if (isNaN(packageAmount) || packageAmount <= 0) {
          results.failed++
          results.errors.push(`Row ${rowNumber}: Invalid package amount "${row.Package}"`)
          continue
        }

        // Validate year
        const year = Number.parseInt(row.YearOfPlacement)
        if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 5) {
          results.failed++
          results.errors.push(`Row ${rowNumber}: Invalid year "${row.YearOfPlacement}"`)
          continue
        }

        // Check if placement already exists for this student
        const existingPlacement = await Placement.findOne({
          student: student._id,
          companyName: row.CompanyName.toString().trim(),
          yearOfPlacement: year,
        })

        if (existingPlacement) {
          // Update existing placement
          existingPlacement.jobRole = row.JobRole.toString().trim()
          existingPlacement.packageAmount = packageAmount
          await existingPlacement.save()
        } else {
          // Create new placement
          const placement = new Placement({
            student: student._id,
            companyName: row.CompanyName.toString().trim(),
            jobRole: row.JobRole.toString().trim(),
            packageAmount: packageAmount,
            yearOfPlacement: year,
          })
          await placement.save()
        }

        results.successful++
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        results.failed++
        results.errors.push(`Row ${rowNumber}: ${error.message}`)
      }
    }

    // Log activity
    await logActivity(
      "placements_bulk_upload",
      `Bulk placement upload: ${results.successful} successful, ${results.failed} failed`,
      req.user._id,
      "Placement",
      null,
      { successful: results.successful, failed: results.failed },
    )

    res.json({
      message: "Placement upload completed",
      results,
    })
  } catch (error) {
    console.error("Upload placements error:", error)
    res.status(500).json({ message: "Server error during file processing" })
  }
})

// Get all notifications
router.get("/notifications", authenticate, authorize("admin"), async (req, res) => {
  try {
    const notifications = await Notification.find().populate("createdBy", "name email").sort({ createdAt: -1 })

    res.json(notifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create notification
router.post("/notifications", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { title, message, type, targetAudience, department } = req.body

    if (!title || !message || !type || !targetAudience) {
      return res.status(400).json({ message: "All required fields must be provided" })
    }

    const notification = new Notification({
      title: title.trim(),
      message: message.trim(),
      type,
      targetAudience,
      department: targetAudience === "department" ? department : undefined,
      createdBy: req.user._id,
    })

    await notification.save()

    // Log activity
    await logActivity(
      "notification_created",
      `Notification "${title}" created`,
      req.user._id,
      "Notification",
      notification._id,
      { type, targetAudience, department },
    )

    const populatedNotification = await Notification.findById(notification._id).populate("createdBy", "name email")

    res.status(201).json({
      message: "Notification created successfully",
      notification: populatedNotification,
    })
  } catch (error) {
    console.error("Create notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update notification
router.put("/notifications/:notificationId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { notificationId } = req.params
    const { title, message, type, targetAudience, department, isActive } = req.body

    const notification = await Notification.findById(notificationId)
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    if (title) notification.title = title.trim()
    if (message) notification.message = message.trim()
    if (type) notification.type = type
    if (targetAudience) notification.targetAudience = targetAudience
    if (targetAudience === "department" && department) notification.department = department
    if (isActive !== undefined) notification.isActive = isActive

    await notification.save()

    // Log activity
    await logActivity(
      "notification_updated",
      `Notification "${notification.title}" updated`,
      req.user._id,
      "Notification",
      notification._id,
    )

    const populatedNotification = await Notification.findById(notification._id).populate("createdBy", "name email")

    res.json({
      message: "Notification updated successfully",
      notification: populatedNotification,
    })
  } catch (error) {
    console.error("Update notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete notification
router.delete("/notifications/:notificationId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { notificationId } = req.params

    const notification = await Notification.findById(notificationId)
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    await Notification.findByIdAndDelete(notificationId)

    // Log activity
    await logActivity(
      "notification_deleted",
      `Notification "${notification.title}" deleted`,
      req.user._id,
      "Notification",
      notification._id,
    )

    res.json({ message: "Notification deleted successfully" })
  } catch (error) {
    console.error("Delete notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get system statistics
router.get("/stats", authenticate, authorize("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalFaculty,
      totalCourses,
      totalEvents,
      totalPlacements,
      totalNotifications,
      recentActivities,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "faculty", isActive: true }),
      Course.countDocuments(),
      Event.countDocuments(),
      Placement.countDocuments(),
      Notification.countDocuments({ isActive: true }),
      Activity.find().populate("user", "name").sort({ createdAt: -1 }).limit(10),
    ])

    res.json({
      totalUsers,
      totalStudents,
      totalFaculty,
      totalCourses,
      totalEvents,
      totalPlacements,
      totalNotifications,
      recentActivities,
    })
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get recent activities
router.get("/activities", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query

    const activities = await Activity.find()
      .populate("user", "name email userId")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Activity.countDocuments()

    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get activities error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
