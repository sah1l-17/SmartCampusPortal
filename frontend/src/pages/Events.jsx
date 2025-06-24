"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Calendar, MapPin, Users, Clock, Plus, CheckCircle, XCircle, AlertCircle, Download, Trash2 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"

const Events = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      let endpoint = "/events"
      if (user?.role === "faculty") {
        endpoint = "/faculty/events"
      } else if (user?.role === "student") {
        endpoint = "/student/events"
      }

      const response = await axios.get(endpoint)
      setEvents(response.data)
    } catch (error) {
      console.error("Fetch events error:", error)
      toast.error("Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      await axios.post(`/student/events/${eventId}/register`)
      toast.success("Successfully registered for event")
      fetchEvents()
    } catch (error) {
      const message = error.response?.data?.message || "Failed to register for event"
      toast.error(message)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await axios.delete(`/faculty/events/${eventId}`)
        toast.success("Event deleted successfully")
        fetchEvents()
      } catch (error) {
        const message = error.response?.data?.message || "Failed to delete event"
        toast.error(message)
      }
    }
  }

  const handleDownloadRegistrations = async (eventId, eventTitle) => {
    try {
      const response = await axios.get(`/faculty/events/${eventId}/registrations/download`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${eventTitle}_registrations.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Registration list downloaded successfully")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download registration list")
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading events..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">
            {user?.role === "faculty"
              ? "Manage your events"
              : user?.role === "admin"
                ? "All events in the system"
                : "Discover and register for events"}
          </p>
        </div>
        {user?.role === "faculty" && (
          <button onClick={() => setShowCreateForm(true)} className="btn btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </button>
        )}
      </div>

      {showCreateForm && <CreateEventForm onClose={() => setShowCreateForm(false)} onSuccess={fetchEvents} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onRegister={handleRegister}
            onDownloadRegistrations={handleDownloadRegistrations}
            onDeleteEvent={handleDeleteEvent}
          />
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            {user?.role === "faculty" ? "Create your first event to get started" : "No events available at the moment"}
          </p>
        </div>
      )}
    </div>
  )
}

const EventCard = ({ event, onRegister, onDownloadRegistrations, onDeleteEvent }) => {
  const { user } = useAuth()

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        )
      case "pending":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        )
      case "rejected":
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  const isRegistered = event.registeredStudents?.some(
    (reg) => reg.student === user?.id || reg.student?._id === user?.id,
  )

  const isPastEvent = new Date(event.date) < new Date()
  const isFull = event.maxParticipants > 0 && event.registeredStudents?.length >= event.maxParticipants
  const isOwnEvent = user?.role === "faculty" && event.organizer?._id === user?.id

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {(user?.role === "faculty" || user?.role === "admin") && getStatusBadge(event.status)}
          {isOwnEvent && (
            <button
              onClick={() => onDeleteEvent(event._id)}
              className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {new Date(event.date).toLocaleDateString()} at {event.time}
          </span>
        </div>
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{event.venue}</span>
        </div>
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          <span>
            {event.registeredStudents?.length || 0}
            {event.maxParticipants > 0 && ` / ${event.maxParticipants}`} registered
          </span>
        </div>
        {event.organizer && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            <span>Organized by {event.organizer.name}</span>
          </div>
        )}
      </div>

      {/* Show registered students for faculty's own events */}
      {isOwnEvent && event.registeredStudents && event.registeredStudents.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Registered Students:</h4>
          <div className="space-y-1">
            {event.registeredStudents.slice(0, 3).map((reg) => (
              <div key={reg._id} className="text-xs text-gray-600">
                {reg.student.name} ({reg.student.userId})
              </div>
            ))}
            {event.registeredStudents.length > 3 && (
              <div className="text-xs text-gray-500">+{event.registeredStudents.length - 3} more students</div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {user?.role === "student" && event.status === "approved" && (
          <div className="flex-1">
            {isRegistered ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Registered</span>
              </div>
            ) : isPastEvent ? (
              <div className="flex items-center text-gray-500">
                <XCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Event has ended</span>
              </div>
            ) : isFull ? (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Event is full</span>
              </div>
            ) : (
              <button onClick={() => onRegister(event._id)} className="btn btn-primary btn-sm">
                Register
              </button>
            )}
          </div>
        )}

        {isOwnEvent && event.registeredStudents && event.registeredStudents.length > 0 && (
          <button
            onClick={() => onDownloadRegistrations(event._id, event.title)}
            className="btn btn-outline btn-sm flex items-center ml-2"
          >
            <Download className="h-4 w-4 mr-1" />
            Download List
          </button>
        )}
      </div>
    </div>
  )
}

const CreateEventForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    maxParticipants: "",
  })
  const [image, setImage] = useState(null)
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
      const submitData = new FormData()
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          submitData.append(key, formData[key])
        }
      })

      if (image) {
        submitData.append("image", image)
      }

      await axios.post("/faculty/events", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

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

          <div className="form-group">
            <label className="form-label">Event Image (Optional, Max 50MB)</label>
            <input
              type="file"
              className="input"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              disabled={loading}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Events
