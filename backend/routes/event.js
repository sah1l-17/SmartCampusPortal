import express from "express"
import Event from "../models/Event.js"
import { authenticate } from "../middleware/auth.js"
import xlsx from "xlsx"

const router = express.Router()

// Get all approved events (public)
router.get("/", async (req, res) => {
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
