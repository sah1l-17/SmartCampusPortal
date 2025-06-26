import express from "express"
import Notification from "../models/Notification.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get notifications for user
router.get("/", authenticate, async (req, res) => {
  try {
    console.log("Fetching notifications for user:", req.user.role, req.user.department)

    // Build filter based on user role and recipients
    const filter = {
      isActive: true,
      $or: [
        { recipients: "all" },
        // Handle both singular and plural forms
        { recipients: req.user.role }, // "student", "faculty", "admin"
        { recipients: req.user.role + "s" }, // "students", "facultys" (though facultys isn't used)
      ],
    }

    // Add specific mappings for common cases
    if (req.user.role === "student") {
      filter.$or.push({ recipients: "students" })
    }
    if (req.user.role === "faculty") {
      filter.$or.push({ recipients: "faculty" }) // faculty is both singular and plural
    }

    // Add department filter if notification is for specific department
    if (req.user.department) {
      filter.$or.push({
        recipients: "department",
        department: req.user.department,
      })
    }

    console.log("Notification filter:", JSON.stringify(filter, null, 2))

    const notifications = await Notification.find(filter)
      .populate("sender", "name role")
      .sort({ createdAt: -1 })
      .limit(50)

    console.log(`Found ${notifications.length} notifications`)

    // Mark which notifications are read by this user
    const notificationsWithReadStatus = notifications.map((notification) => {
      const isRead = notification.readBy.some((read) => read.user.toString() === req.user._id.toString())
      return {
        ...notification.toObject(),
        isRead,
      }
    })

    res.json(notificationsWithReadStatus)
  } catch (error) {
    console.error("Get notifications error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Mark notification as read
router.patch("/:notificationId/read", authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params

    const notification = await Notification.findById(notificationId)
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" })
    }

    // Check if already read
    const alreadyRead = notification.readBy.some((read) => read.user.toString() === req.user._id.toString())

    if (!alreadyRead) {
      notification.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      })
      await notification.save()
    }

    res.json({ message: "Notification marked as read" })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get unread count
router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const filter = {
      isActive: true,
      $or: [{ recipients: "all" }, { recipients: req.user.role }, { recipients: req.user.role + "s" }],
    }

    // Add specific mappings for common cases
    if (req.user.role === "student") {
      filter.$or.push({ recipients: "students" })
    }
    if (req.user.role === "faculty") {
      filter.$or.push({ recipients: "faculty" })
    }

    // Add department filter
    if (req.user.department) {
      filter.$or.push({
        recipients: "department",
        department: req.user.department,
      })
    }

    const notifications = await Notification.find(filter)

    const unreadCount = notifications.filter((notification) => {
      return !notification.readBy.some((read) => read.user.toString() === req.user._id.toString())
    }).length

    res.json({ unreadCount })
  } catch (error) {
    console.error("Get unread count error:", error)
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

    const attachment = notification.attachments.id(attachmentId)
    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" })
    }

    res.set({
      "Content-Type": attachment.contentType,
      "Content-Disposition": `attachment; filename="${attachment.filename}"`,
      "Content-Length": attachment.size,
    })

    res.send(attachment.data)
  } catch (error) {
    console.error("Download attachment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
