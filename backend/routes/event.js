import express from "express"
import Event from "../models/Event.js"
import { authenticate, authorize } from "../middleware/auth.js"
import { logActivity } from "../utils/activity.js"
import xlsx from "xlsx"

const router = express.Router()

// Get all approved events (public)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({
      status: "approved",
      isActive: true,
    })
      .populate("organizer", "name email department")
      .populate("registeredStudents.student", "name email userId _id")
      .sort({ date: 1 })

    res.json(events)
  } catch (error) {
    console.error("Get events error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single event
router.get("/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)
      .populate("organizer", "name email")
      .populate("registeredStudents.student", "name email userId")

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    res.json(event)
  } catch (error) {
    console.error("Get event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get event image - NEW ROUTE
router.get("/:eventId/image", async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)
    if (!event || !event.image || !event.image.data) {
      return res.status(404).json({ message: "Event image not found" })
    }

    res.setHeader("Content-Type", event.image.contentType)
    res.setHeader("Cache-Control", "public, max-age=86400") // Cache for 1 day
    res.send(event.image.data)
  } catch (error) {
    console.error("Get event image error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Register for event (students only)
router.post("/:eventId/register", authenticate, authorize("student"), async (req, res) => {
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

// Unregister from event (students only)
router.delete("/:eventId/unregister", authenticate, authorize("student"), async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findById(eventId)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    // Check if registered
    const registrationIndex = event.registeredStudents.findIndex((reg) => reg.student.toString() === req.user._id.toString())

    if (registrationIndex === -1) {
      return res.status(400).json({ message: "Not registered for this event" })
    }

    // Remove registration
    event.registeredStudents.splice(registrationIndex, 1)
    await event.save()

    // Log activity
    await logActivity(
      "event_unregistered",
      `Student ${req.user.name} unregistered from event "${event.title}"`,
      req.user._id,
      "Event",
      event._id,
    )

    res.json({ message: "Successfully unregistered from the event" })
  } catch (error) {
    console.error("Unregister from event error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Download event registrations (for faculty who organized the event)
router.get("/:eventId/registrations/download", authenticate, async (req, res) => {
  try {
    const { eventId } = req.params

    const event = await Event.findOne({
      _id: eventId,
      organizer: req.user._id,
    }).populate("registeredStudents.student", "name email userId department")

    if (!event) {
      return res.status(404).json({ message: "Event not found or you don't have permission" })
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

export default router
