"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Calendar, MapPin, Users, Plus, Search, Filter, Edit, Check, X, AlertCircle } from "lucide-react"
import axios from "axios"
import LoadingSpinner from "../components/LoadingSpinner"
import toast from "react-hot-toast"

const Events = () => {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [showCapacityModal, setShowCapacityModal] = useState(false)
  const [pendingEvents, setPendingEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registeringEvents, setRegisteringEvents] = useState(new Set())
  const [registeredEvents, setRegisteredEvents] = useState(new Set()) // Track successfully registered events

  useEffect(() => {
    fetchEvents()
    if (user?.role === "admin") {
      fetchPendingEvents()
    }
  }, [user])

  const fetchEvents = async () => {
    try {
      const response = await axios.get("/events")
      setEvents(response.data)

      // Update registered events set based on server data
      if (user?.role === "student") {
        const userRegisteredEvents = new Set()
        response.data.forEach((event) => {
          const isUserRegistered = event.registeredStudents?.some(
            (reg) => reg.student?._id === user._id || reg.student?.toString() === user._id,
          )
          if (isUserRegistered) {
            userRegisteredEvents.add(event._id)
          }
        })
        setRegisteredEvents(userRegisteredEvents)
      }
    } catch (error) {
      console.error("Fetch events error:", error)
      toast.error("Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingEvents = async () => {
    try {
      const response = await axios.get("/admin/pending-events")
      setPendingEvents(response.data)
    } catch (error) {
      console.error("Fetch pending events error:", error)
    }
  }

  const handleApproveEvent = async (eventId, status) => {
    try {
      await axios.patch(`/admin/events/${eventId}/status`, { status })
      toast.success(`Event ${status} successfully`)
      fetchPendingEvents()
      fetchEvents()
    } catch (error) {
      toast.error(`Failed to ${status} event`)
    }
  }

  const handleUpdateCapacity = async (eventId, newCapacity) => {
    try {
      await axios.patch(`/admin/events/${eventId}/capacity`, {
        maxParticipants: Number(newCapacity),
      })
      toast.success("Event capacity updated successfully")
      fetchEvents()
    } catch (error) {
      toast.error("Failed to update event capacity")
    }
  }

  const registerForEvent = async (eventId) => {
    // Add to registering set
    setRegisteringEvents((prev) => new Set([...prev, eventId]))

    try {
      await axios.post(`/events/${eventId}/register`)

      // Add to registered events set immediately
      setRegisteredEvents((prev) => new Set([...prev, eventId]))

      // Update the events data to reflect registration
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event._id === eventId
            ? {
                ...event,
                registeredStudents: [
                  ...(event.registeredStudents || []),
                  {
                    student: {
                      _id: user._id,
                      name: user.name,
                      email: user.email,
                      userId: user.userId,
                    },
                    registeredAt: new Date(),
                  },
                ],
              }
            : event,
        ),
      )

      toast.success("Successfully registered for event")
    } catch (error) {
      console.error("Registration error:", error)
      const errorMessage = error.response?.data?.message || "Failed to register for event"
      toast.error(errorMessage)

      // Remove from registered events set on error
      setRegisteredEvents((prev) => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
    } finally {
      // Remove from registering set
      setRegisteringEvents((prev) => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
    }
  }

  const unregisterFromEvent = async (eventId) => {
    try {
      await axios.delete(`/events/${eventId}/unregister`)

      // Remove from registered events set
      setRegisteredEvents((prev) => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })

      // Update the events data to reflect unregistration
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event._id === eventId
            ? {
                ...event,
                registeredStudents:
                  event.registeredStudents?.filter(
                    (reg) => reg.student?._id !== user._id && reg.student?.toString() !== user._id,
                  ) || [],
              }
            : event,
        ),
      )

      toast.success("Successfully unregistered from event")
    } catch (error) {
      console.error("Unregistration error:", error)
      const errorMessage = error.response?.data?.message || "Failed to unregister from event"
      toast.error(errorMessage)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return <LoadingSpinner text="Loading events..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Discover and participate in campus events</p>
        </div>
        <div className="flex space-x-3">
          {user?.role === "admin" && (
            <>
              <button onClick={() => setShowPendingModal(true)} className="btn btn-outline flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Pending Events ({pendingEvents.length})
              </button>
              <button onClick={() => setShowCapacityModal(true)} className="btn btn-outline flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Manage Capacity
              </button>
            </>
          )}
          {user?.role === "faculty" && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input min-w-[120px]"
          >
            <option value="all">All Events</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onRegister={registerForEvent}
            onUnregister={unregisterFromEvent}
            user={user}
            isRegistering={registeringEvents.has(event._id)}
            isRegistered={registeredEvents.has(event._id)}
          />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No events have been created yet"}
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateEventModal onClose={() => setShowCreateModal(false)} onSuccess={fetchEvents} />}

      {showPendingModal && (
        <PendingEventsModal
          events={pendingEvents}
          onClose={() => setShowPendingModal(false)}
          onApprove={handleApproveEvent}
        />
      )}

      {showCapacityModal && (
        <CapacityManagementModal
          events={events}
          onClose={() => setShowCapacityModal(false)}
          onUpdate={handleUpdateCapacity}
        />
      )}
    </div>
  )
}

// Event Card Component
const EventCard = ({ event, onRegister, onUnregister, user, isRegistering, isRegistered }) => {
  const isFull = event.maxParticipants > 0 && event.registeredStudents?.length >= event.maxParticipants
  const isPastEvent = new Date(event.date) < new Date()

  return (
    <div className={`card p-6 hover:shadow-lg transition-shadow ${isPastEvent ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
        <div className="flex items-center space-x-2">
          {isPastEvent && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Past Event</span>
          )}
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              event.status === "approved"
                ? "bg-green-100 text-green-800"
                : event.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {event.status}
          </span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{event.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-2" />
          {new Date(event.date).toLocaleDateString()} at {event.time}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-2" />
          {event.venue}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Users className="h-4 w-4 mr-2" />
          {event.registeredStudents?.length || 0}
          {event.maxParticipants > 0 && ` / ${event.maxParticipants}`} registered
        </div>
      </div>

      {user?.role === "student" && event.status === "approved" && !isPastEvent && (
        <div className="mt-4 space-y-2">
          {isRegistered ? (
            <>
              <button disabled className="btn w-full bg-green-600 hover:bg-green-600 text-white cursor-default">
                <Check className="h-4 w-4 mr-2" />
                Registered
              </button>
              <button
                onClick={() => onUnregister(event._id)}
                className="btn btn-outline w-full text-red-600 hover:bg-red-50 border-red-300"
              >
                Unregister
              </button>
            </>
          ) : isFull ? (
            <button disabled className="btn btn-outline w-full opacity-50 cursor-not-allowed">
              Event Full
            </button>
          ) : (
            <button onClick={() => onRegister(event._id)} disabled={isRegistering} className="btn btn-primary w-full">
              {isRegistering ? "Registering..." : "Register"}
            </button>
          )}
        </div>
      )}

      {user?.role === "student" && isPastEvent && isRegistered && (
        <div className="mt-4">
          <button disabled className="btn w-full bg-green-600 text-white cursor-not-allowed">
            <Check className="h-4 w-4 mr-2" />
            Attended
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Organized by: {event.organizer?.name} ({event.organizer?.department})
      </div>
    </div>
  )
}

// Create Event Modal
const CreateEventModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    maxParticipants: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post("/faculty/events", formData)
      toast.success("Event created successfully and sent for approval")
      onSuccess()
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Create New Event</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              className="input"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Time *</label>
              <input
                type="time"
                className="input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Venue *</label>
            <input
              type="text"
              className="input"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Maximum Participants (Optional)</label>
            <input
              type="number"
              className="input"
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              placeholder="Leave empty for unlimited"
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

// Pending Events Modal
const PendingEventsModal = ({ events, onClose, onApprove }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Pending Events</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No pending events</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event._id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                      <p>
                        <strong>Date:</strong> {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                      <p>
                        <strong>Venue:</strong> {event.venue}
                      </p>
                      <p>
                        <strong>Organizer:</strong> {event.organizer.name} ({event.organizer.department})
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => onApprove(event._id, "approved")}
                      className="btn btn-outline btn-sm text-green-600 hover:bg-green-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => onApprove(event._id, "rejected")}
                      className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Capacity Management Modal
const CapacityManagementModal = ({ events, onClose, onUpdate }) => {
  const [editingEvent, setEditingEvent] = useState(null)
  const [newCapacity, setNewCapacity] = useState("")

  const handleUpdateCapacity = (eventId) => {
    if (!newCapacity || newCapacity < 0) {
      toast.error("Please enter a valid capacity")
      return
    }
    onUpdate(eventId, newCapacity)
    setEditingEvent(null)
    setNewCapacity("")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Event Capacity Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {events.map((event) => (
            <div key={event._id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>
                      <strong>Date:</strong> {new Date(event.date).toLocaleDateString()} at {event.time}
                    </p>
                    <p>
                      <strong>Venue:</strong> {event.venue}
                    </p>
                    <p>
                      <strong>Current Capacity:</strong> {event.maxParticipants || "Unlimited"}
                    </p>
                    <p>
                      <strong>Registered:</strong> {event.registeredStudents?.length || 0}
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  {editingEvent === event._id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(e.target.value)}
                        placeholder="New capacity"
                        className="input w-32"
                      />
                      <button onClick={() => handleUpdateCapacity(event._id)} className="btn btn-primary btn-sm">
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingEvent(null)
                          setNewCapacity("")
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingEvent(event._id)
                        setNewCapacity(event.maxParticipants || "")
                      }}
                      className="btn btn-outline btn-sm flex items-center"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Capacity
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Events
