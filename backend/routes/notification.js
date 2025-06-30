import express from "express"
import Notification from "../models/Notification.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Helper function to get user filter based on role
const getUserFilter = (user) => {
  if (user.role === "student") {
    return {
      $or: [
        { recipients: "students" },
        { recipients: "all" },
        { recipients: "department", department: user.department },
      ],
    }
  } else if (user.role === "faculty") {
    return {
      $or: [
        { recipients: "faculty" },
        { recipients: "all" },
        { recipients: "department", department: user.department },
      ],
    }
  } else if (user.role === "admin") {
    // Admin can see all notifications
    return {}
  }
  return {}
}

// Helper function to check if user has access to notification
const hasNotificationAccess = (notification, user) => {
  if (user.role === "admin") {
    return true
  } else if (user.role === "student") {
    return (
      notification.recipients === "students" ||
      notification.recipients === "all" ||
      (notification.recipients === "department" && notification.department === user.department)
    )
  } else if (user.role === "faculty") {
    return (
      notification.recipients === "faculty" ||
      notification.recipients === "all" ||
      (notification.recipients === "department" && notification.department === user.department)
    )
  }
  return false
}

// Get notifications for the authenticated user
router.get("/", authenticate, async (req, res) => {
  try {
    const filter = getUserFilter(req.user)

    const notifications = await Notification.find(filter)
      .populate("sender", "name email")
      .sort({ createdAt: -1 })
      .limit(50)

    // Add isRead property for each notification based on whether user ID is in readBy array
    const notificationsWithReadStatus = notifications.map(notification => ({
      ...notification.toObject(),
      isRead: notification.readBy && notification.readBy.includes(req.user._id)
    }))

    res.json(notificationsWithReadStatus)
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get unread notifications count
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const filter = getUserFilter(req.user)
    
    // Add filter for unread notifications (user ID not in readBy array)
    filter.readBy = { $ne: req.user._id }

    const unreadCount = await Notification.countDocuments(filter)

    res.json({ unreadCount })
  } catch (error) {
    console.error("Get unread count error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark a specific notification as read
router.patch("/:notificationId/read", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params

    const notification = await Notification.findById(notificationId)

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    // Check if user has access to this notification
    if (!hasNotificationAccess(notification, req.user)) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Add user to readBy array if not already there
    if (!notification.readBy) {
      notification.readBy = []
    }
    
    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id)
      await notification.save()
    }

    res.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("Mark as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark ALL notifications as read for the authenticated user
router.patch("/mark-all-read", authenticate, async (req, res) => {
  try {
    const filter = getUserFilter(req.user)
    
    // Find all notifications that the user has access to and hasn't read yet
    filter.readBy = { $ne: req.user._id }

    const notifications = await Notification.find(filter)

    // Mark all as read by adding user ID to readBy array
    const updatePromises = notifications.map(notification => {
      if (!notification.readBy) {
        notification.readBy = []
      }
      if (!notification.readBy.includes(req.user._id)) {
        notification.readBy.push(req.user._id)
        return notification.save()
      }
    })

    await Promise.all(updatePromises.filter(Boolean))

    res.json({ 
      message: "All notifications marked as read",
      count: notifications.length 
    })
  } catch (error) {
    console.error("Mark all as read error:", error)
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
    if (!hasNotificationAccess(notification, req.user)) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Add isRead property
    const notificationWithReadStatus = {
      ...notification.toObject(),
      isRead: notification.readBy && notification.readBy.includes(req.user._id)
    }

    res.json(notificationWithReadStatus)
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
    if (!hasNotificationAccess(notification, req.user)) {
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