"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

const CreateEventForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    maxParticipants: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Event title is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required"
    }

    if (!formData.date) {
      newErrors.date = "Event date is required"
    }

    if (!formData.time) {
      newErrors.time = "Event time is required"
    }

    if (!formData.venue.trim()) {
      newErrors.venue = "Event venue is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? Number.parseInt(formData.maxParticipants) : 0,
      }

      await axios.post("/faculty/events", eventData)
      toast.success("Event created successfully and sent for approval")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Create event error:", error)
      const message = error.response?.data?.message || "Failed to create event"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Event</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Event Title</label>
            <input
              type="text"
              className={`input ${errors.title ? "border-red-500" : ""}`}
              value={formData.title}
              name="title"
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className={`input ${errors.description ? "border-red-500" : ""}`}
              rows="3"
              value={formData.description}
              name="description"
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.description && <p className="form-error">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className={`input ${errors.date ? "border-red-500" : ""}`}
                value={formData.date}
                name="date"
                onChange={handleChange}
                required
                disabled={loading}
              />
              {errors.date && <p className="form-error">{errors.date}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                className={`input ${errors.time ? "border-red-500" : ""}`}
                value={formData.time}
                name="time"
                onChange={handleChange}
                required
                disabled={loading}
              />
              {errors.time && <p className="form-error">{errors.time}</p>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Venue</label>
            <input
              type="text"
              className={`input ${errors.venue ? "border-red-500" : ""}`}
              value={formData.venue}
              name="venue"
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.venue && <p className="form-error">{errors.venue}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Max Participants (Optional)</label>
            <input
              type="number"
              className="input"
              value={formData.maxParticipants}
              name="maxParticipants"
              onChange={handleChange}
              min="0"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex items-center">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEventForm
