import express from "express"
import Notification from "../models/Notification.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get notifications for the authenticated user
router.get("/", authenticate, async (req, res) => {
  try {
    let filter = {}

    if (req.user.role === "student") {
      filter = {
        $or: [
          { recipients: "students" },
          { recipients: "all" },
          { recipients: "department", department: req.user.department },
        ],
      }
    } else if (req.user.role === "faculty") {
      filter = {
        $or: [
          { recipients: "faculty" },
          { recipients: "all" },
          { recipients: "department", department: req.user.department },
        ],
      }
    } else if (req.user.role === "admin") {
      // Admin can see all notifications
      filter = {}
    }

    const notifications = await Notification.find(filter)
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .limit(50)

    res.json(notifications)
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single notification
router.get("/:notificationId", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params

    const notification = await Notification.findById(notificationId).populate("sender", "name email")

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    // Check if user has access to this notification
    let hasAccess = false

    if (req.user.role === "admin") {
      hasAccess = true
    } else if (req.user.role === "student") {
      hasAccess =
        notification.recipients === "students" ||
        notification.recipients === "all" ||
        (notification.recipients === "department" && notification.department === req.user.department)
    } else if (req.user.role === "faculty") {
      hasAccess =
        notification.recipients === "faculty" ||
        notification.recipients === "all" ||
        (notification.recipients === "department" && notification.department === req.user.department)
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(notification)
  } catch (error) {
    console.error("Get notification error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Download notification attachment
router.get("/:notificationId/attachments/:attachmentId/download", authenticate, async (req, res) => {
  try {
    const { notificationId, attachmentId } = req.params

    const notification = await Notification.findById(notificationId)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    // Check if user has access to this notification
    let hasAccess = false

    if (req.user.role === "admin") {
      hasAccess = true
    } else if (req.user.role === "student") {
      hasAccess =
        notification.recipients === "students" ||
        notification.recipients === "all" ||
        (notification.recipients === "department" && notification.department === req.user.department)
    } else if (req.user.role === "faculty") {
      hasAccess =
        notification.recipients === "faculty" ||
        notification.recipients === "all" ||
        (notification.recipients === "department" && notification.department === req.user.department)
    }

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" })
    }

    const attachment = notification.attachments.id(attachmentId)
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
})

export default router
