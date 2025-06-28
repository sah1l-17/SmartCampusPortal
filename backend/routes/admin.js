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
        message: `Cannot set capacity below current registrations (${currentRegistrations} students already registered)`,
      })
    }

    // Update the capacity
    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { maxParticipants: Number(maxParticipants) },
      { new: true },
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

// Get all courses with enrolled students (for admin) - UPDATED TO INCLUDE STUDENTS LIST
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

// Get single course by ID (for admin) - NEW ROUTE
router.get("/courses/:courseId", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findById(courseId)
      .populate("faculty", "name email userId")
      .populate("enrolledStudents", "name email userId department")
      .populate("assignments.submissions.student", "name email userId")

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    console.error("Get course detail error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get course students (for admin) - NEW ROUTE
router.get("/courses/:courseId/students", authenticate, authorize("admin"), async (req, res) => {
  try {
    const { courseId } = req.params

    const course = await Course.findById(courseId).populate("enrolledStudents", "name email userId department")

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

// Download course material - Admin access
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

// Download assignment attachment - Admin access
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

// Add single placement record - UPDATED TO HANDLE EXISTING RECORDS
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

    const placementData = {
      studentId,
      studentName: studentName || student.name,
      companyName,
      package: packageAmount,
      yearOfPlacement,
      department: department || student.department,
      jobRole,
      placementType,
      addedBy: req.user._id,
    }

    let placement
    let message
    let activityDescription

    if (existingPlacement) {
      // Update existing placement
      Object.assign(existingPlacement, placementData)
      placement = await existingPlacement.save()
      message = "Placement record updated successfully"
      activityDescription = `Placement record updated for ${studentName} at ${companyName}`
    } else {
      // Create new placement
      placement = new Placement(placementData)
      await placement.save()
      message = "Placement record added successfully"
      activityDescription = `Placement record added for ${studentName} at ${companyName}`
    }

    // Log activity
    await logActivity(
      existingPlacement ? "placement_updated" : "placement_added",
      activityDescription,
      req.user._id,
      "Placement",
      placement._id,
      { studentId, companyName, package: packageAmount },
    )

    res.status(201).json({ message, placement })
  } catch (error) {
    console.error("Add/Update placement error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Upload placements via Excel - COMPLETELY REWRITTEN WITH PROPER VALIDATION
router.post("/placements/upload", authenticate, authorize("admin"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    console.log("Processing Excel file upload...")

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(worksheet)

    console.log("Excel data parsed:", data.length, "rows found")
    console.log("Sample row:", data[0])

    const results = {
      success: 0,
      updated: 0,
      errors: [],
      invalidStudents: [],
      validationErrors: [],
    }

    // Required columns mapping (case-insensitive)
    const requiredColumns = {
      studentid: ["StudentID", "studentId", "student_id", "STUDENTID"],
      studentname: ["StudentName", "studentName", "student_name", "STUDENTNAME"],
      companyname: ["CompanyName", "companyName", "company_name", "COMPANYNAME", "Company"],
      package: ["Package", "package", "PACKAGE", "Salary", "salary"],
      yearofplacement: ["YearOfPlacement", "yearOfPlacement", "year_of_placement", "YEAROFPLACEMENT", "Year", "year"],
      department: ["Department", "department", "DEPARTMENT"],
      jobrole: ["JobRole", "jobRole", "job_role", "JOBROLE", "Role", "role"],
    }

    // Function to find column value by multiple possible names
    const getColumnValue = (row, columnNames) => {
      for (const name of columnNames) {
        if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
          return row[name]
        }
      }
      return null
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      const rowNumber = i + 2 // Excel row number (accounting for header)

      try {
        console.log(`Processing row ${rowNumber}:`, row)

        // Extract values using flexible column mapping
        const studentId = getColumnValue(row, requiredColumns.studentid)
        const studentName = getColumnValue(row, requiredColumns.studentname)
        const companyName = getColumnValue(row, requiredColumns.companyname)
        const packageAmount = getColumnValue(row, requiredColumns.package)
        const yearOfPlacement = getColumnValue(row, requiredColumns.yearofplacement)
        const department = getColumnValue(row, requiredColumns.department)
        const jobRole = getColumnValue(row, requiredColumns.jobrole) || ""

        console.log(`Row ${rowNumber} extracted values:`, {
          studentId,
          studentName,
          companyName,
          packageAmount,
          yearOfPlacement,
          department,
          jobRole,
        })

        // Validate required fields
        if (!studentId || !studentName || !companyName || !packageAmount) {
          results.validationErrors.push(
            `Row ${rowNumber}: Missing required fields. Found - StudentID: ${studentId}, StudentName: ${studentName}, CompanyName: ${companyName}, Package: ${packageAmount}`,
          )
          continue
        }

        // Convert and validate data types
        const numericPackage = Number(packageAmount)
        const numericYear = yearOfPlacement ? Number(yearOfPlacement) : new Date().getFullYear()

        if (isNaN(numericPackage) || numericPackage <= 0) {
          results.validationErrors.push(`Row ${rowNumber}: Invalid package amount: ${packageAmount}`)
          continue
        }

        if (isNaN(numericYear) || numericYear < 2000 || numericYear > new Date().getFullYear() + 5) {
          results.validationErrors.push(`Row ${rowNumber}: Invalid year: ${yearOfPlacement}`)
          continue
        }

        // Validate student exists in database
        const student = await User.findOne({
          userId: String(studentId).trim(),
          role: "student",
        })

        if (!student) {
          results.invalidStudents.push(`Row ${rowNumber}: Student ID ${studentId} not found in database`)
          continue
        }

        // Validate student name matches (case-insensitive, trimmed)
        const dbStudentName = student.name.trim().toLowerCase()
        const excelStudentName = String(studentName).trim().toLowerCase()

        if (dbStudentName !== excelStudentName) {
          results.invalidStudents.push(
            `Row ${rowNumber}: Student name mismatch for ID ${studentId}. Database: "${student.name}", Excel: "${studentName}"`,
          )
          continue
        }

        // Validate department if provided
        if (department) {
          const dbDepartment = student.department.trim().toLowerCase()
          const excelDepartment = String(department).trim().toLowerCase()

          if (dbDepartment !== excelDepartment) {
            results.invalidStudents.push(
              `Row ${rowNumber}: Department mismatch for student ${studentId}. Database: "${student.department}", Excel: "${department}"`,
            )
            continue
          }
        }

        // Check if placement already exists for this student and year
        const existingPlacement = await Placement.findOne({
          studentId: String(studentId).trim(),
          yearOfPlacement: numericYear,
        })

        const placementData = {
          studentId: String(studentId).trim(),
          studentName: String(studentName).trim(),
          companyName: String(companyName).trim(),
          package: numericPackage,
          yearOfPlacement: numericYear,
          department: department ? String(department).trim() : student.department,
          jobRole: jobRole ? String(jobRole).trim() : "",
          placementType: "campus", // Default value
          addedBy: req.user._id,
        }

        if (existingPlacement) {
          // Update existing placement
          Object.assign(existingPlacement, placementData)
          await existingPlacement.save()
          results.updated++
          console.log(`Row ${rowNumber}: Updated existing placement for ${studentId}`)
        } else {
          // Create new placement
          const placement = new Placement(placementData)
          await placement.save()
          results.success++
          console.log(`Row ${rowNumber}: Created new placement for ${studentId}`)
        }
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        results.errors.push(`Row ${rowNumber}: ${error.message}`)
      }
    }

    // Log activity
    await logActivity(
      "placements_uploaded",
      `Excel upload completed: ${results.success} new, ${results.updated} updated, ${results.errors.length + results.invalidStudents.length + results.validationErrors.length} errors`,
      req.user._id,
      "Placement",
      null,
      {
        successCount: results.success,
        updatedCount: results.updated,
        errorCount: results.errors.length,
        invalidStudentCount: results.invalidStudents.length,
        validationErrorCount: results.validationErrors.length,
      },
    )

    // Combine all errors for response
    const allErrors = [...results.validationErrors, ...results.invalidStudents, ...results.errors]

    console.log("Upload results:", results)

    res.json({
      message: `Upload completed. ${results.success} new records added, ${results.updated} records updated.`,
      results: {
        success: results.success,
        updated: results.updated,
        errors: allErrors,
        totalProcessed: data.length,
        totalErrors: allErrors.length,
      },
    })
  } catch (error) {
    console.error("Upload placements error:", error)
    res.status(500).json({
      message: "Server error during upload",
      error: error.message,
      results: {
        success: 0,
        updated: 0,
        errors: [`Server error: ${error.message}`],
        totalProcessed: 0,
        totalErrors: 1,
      },
    })
  }
})

// Broadcast notification - UPDATED WITH BETTER RECIPIENT HANDLING
router.post("/broadcast", authenticate, authorize("admin"), upload.array("attachments", 5), async (req, res) => {
  try {
    const { title, message, type, recipients, priority, department } = req.body

    console.log("Broadcasting notification:", { title, recipients, type, priority })

    // Normalize recipients value
    let normalizedRecipients = recipients
    if (recipients === "students") {
      normalizedRecipients = "students" // Keep as is for students
    } else if (recipients === "faculty") {
      normalizedRecipients = "faculty" // Keep as is for faculty
    }

    const notification = new Notification({
      title,
      message,
      type,
      recipients: normalizedRecipients,
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

    console.log("Notification saved successfully:", notification._id)
    res.json({ message: "Notification broadcasted successfully" })
  } catch (error) {
    console.error("Broadcast notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
