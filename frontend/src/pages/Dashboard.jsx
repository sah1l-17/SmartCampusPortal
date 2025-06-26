"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Upload,
  Search,
  Edit,
} from "lucide-react"
import axios from "axios"
import LoadingSpinner from "../components/LoadingSpinner"
import toast from "react-hot-toast"

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPendingEvents, setShowPendingEvents] = useState(false)
  const [showBroadcastForm, setShowBroadcastForm] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [showPlacementUpload, setShowPlacementUpload] = useState(false)
  const [showCourseManagement, setShowCourseManagement] = useState(false)
  const [showEventManagement, setShowEventManagement] = useState(false)
  const [pendingEvents, setPendingEvents] = useState([])
  const [allEvents, setAllEvents] = useState([])
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    fetchDashboardData()
    if (user?.role === "admin") {
      fetchRecentActivities()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      if (user?.role === "admin") {
        const response = await axios.get("/admin/dashboard-stats")
        setStats(response.data)
      } else if (user?.role === "faculty") {
        const [coursesResponse, eventsResponse] = await Promise.all([
          axios.get("/faculty/courses"),
          axios.get("/faculty/events"),
        ])
        setStats({
          totalCourses: coursesResponse.data.length,
          totalEvents: eventsResponse.data.length,
          pendingEvents: eventsResponse.data.filter((e) => e.status === "pending").length,
          approvedEvents: eventsResponse.data.filter((e) => e.status === "approved").length,
        })
      } else if (user?.role === "student") {
        const [coursesResponse, eventsResponse] = await Promise.all([
          axios.get("/student/courses"),
          axios.get("/student/events"),
        ])
        setStats({
          enrolledCourses: coursesResponse.data.length,
          upcomingEvents: eventsResponse.data.length,
          totalAssignments: coursesResponse.data.reduce((acc, course) => acc + (course.assignments?.length || 0), 0),
          pendingAssignments: coursesResponse.data.reduce((acc, course) => {
            return (
              acc +
              (course.assignments?.filter((assignment) => {
                return !assignment.submissions?.some((sub) => sub.student === user.id)
              }).length || 0)
            )
          }, 0),
        })
      }
    } catch (error) {
      console.error("Fetch dashboard data error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      const response = await axios.get("/admin/recent-activities")
      setRecentActivities(response.data)
    } catch (error) {
      console.error("Fetch recent activities error:", error)
    }
  }

  const fetchPendingEvents = async () => {
    try {
      const response = await axios.get("/admin/pending-events")
      setPendingEvents(response.data)
      setShowPendingEvents(true)
    } catch (error) {
      console.error("Fetch pending events error:", error)
      toast.error("Failed to fetch pending events")
    }
  }

  const fetchAllEvents = async () => {
    try {
      const response = await axios.get("/events")
      setAllEvents(response.data)
      setShowEventManagement(true)
    } catch (error) {
      console.error("Fetch all events error:", error)
      toast.error("Failed to fetch events")
    }
  }

  const handleApproveEvent = async (eventId, status) => {
    try {
      await axios.patch(`/admin/events/${eventId}/status`, { status })
      toast.success(`Event ${status} successfully`)
      fetchPendingEvents() // Refresh the list
      fetchDashboardData() // Refresh stats
    } catch (error) {
      toast.error(`Failed to ${status} event`)
    }
  }

  const handleUpdateEventCapacity = async (eventId, newCapacity) => {
    try {
      const response = await axios.patch(`/admin/events/${eventId}/capacity`, {
        maxParticipants: Number(newCapacity), // Ensure it's sent as number
      })
      toast.success(response.data.message || "Event capacity updated successfully")
      fetchAllEvents()
    } catch (error) {
      // Show the backend error message if available, otherwise generic message
      const errorMessage = error.response?.data?.message || "Failed to update event capacity"
      toast.error(errorMessage)

      // For debugging - log the full error
      console.error("Capacity update error:", {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      })
    }
  }
  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Faculty</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalFaculty || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingEvents || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="flex-1">{activity.description}</span>
                  <span className="text-gray-500">{new Date(activity.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No recent activities</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button onClick={fetchPendingEvents} className="w-full btn btn-primary text-left">
              View Pending Events
            </button>
            <button onClick={fetchAllEvents} className="w-full btn btn-outline text-left">
              Manage Event Capacity
            </button>
            <button onClick={() => setShowBroadcastForm(true)} className="w-full btn btn-outline text-left">
              Broadcast Notification
            </button>
            <button onClick={() => setShowUserManagement(true)} className="w-full btn btn-outline text-left">
              Manage Users
            </button>
            <button onClick={() => setShowCourseManagement(true)} className="w-full btn btn-outline text-left">
              View Courses
            </button>
            <button onClick={() => setShowPlacementUpload(true)} className="w-full btn btn-outline text-left">
              Upload Placements
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPendingEvents && (
        <PendingEventsModal
          events={pendingEvents}
          onClose={() => setShowPendingEvents(false)}
          onApprove={handleApproveEvent}
        />
      )}

      {showEventManagement && (
        <EventManagementModal
          events={allEvents}
          onClose={() => setShowEventManagement(false)}
          onUpdateCapacity={handleUpdateEventCapacity}
        />
      )}

      {showBroadcastForm && <BroadcastForm onClose={() => setShowBroadcastForm(false)} />}

      {showUserManagement && (
        <UserManagementModal onClose={() => setShowUserManagement(false)} onUpdate={fetchDashboardData} />
      )}

      {showCourseManagement && <CourseManagementModal onClose={() => setShowCourseManagement(false)} />}

      {showPlacementUpload && <PlacementUploadModal onClose={() => setShowPlacementUpload(false)} />}
    </div>
  )

  const renderFacultyDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">My Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalEvents || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingEvents || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.approvedEvents || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.enrolledCourses || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.upcomingEvents || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingAssignments || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalAssignments || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-600">Here's what's happening in your portal today.</p>
        </div>
      </div>

      {user?.role === "admin" && renderAdminDashboard()}
      {user?.role === "faculty" && renderFacultyDashboard()}
      {user?.role === "student" && renderStudentDashboard()}
    </div>
  )
}

// Event Management Modal Component - NEW
const EventManagementModal = ({ events, onClose, onUpdateCapacity }) => {
  const [editingEvent, setEditingEvent] = useState(null)
  const [newCapacity, setNewCapacity] = useState("")

  const handleUpdateCapacity = (eventId) => {
    if (!newCapacity || newCapacity < 0) {
      toast.error("Please enter a valid capacity")
      return
    }
    onUpdateCapacity(eventId, newCapacity)
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
                      <strong>Organizer:</strong> {event.organizer?.name}
                    </p>
                    <p>
                      <strong>Current Capacity:</strong> {event.maxParticipants || "Unlimited"}
                    </p>
                    <p>
                      <strong>Registered:</strong> {event.registeredStudents?.length || 0}
                    </p>
                    {event.maxParticipants > 0 && event.registeredStudents?.length >= event.maxParticipants && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 mt-1">
                        Event Full
                      </span>
                    )}
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

// Course Management Modal Component
const CourseManagementModal = ({ onClose }) => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/admin/courses")
      setCourses(response.data)
    } catch (error) {
      toast.error("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Course Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course._id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600">
                      {course.code} - {course.department}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Faculty: {course.faculty.name}</p>
                    <p className="text-sm text-gray-500">
                      Students: {course.enrolledStudents.length} | Semester: {course.semester} | Credits:{" "}
                      {course.credits}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCourse(selectedCourse === course._id ? null : course._id)}
                    className="btn btn-outline btn-sm"
                  >
                    {selectedCourse === course._id ? "Hide Students" : "View Students"}
                  </button>
                </div>

                {selectedCourse === course._id && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Enrolled Students:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {course.enrolledStudents.map((student) => (
                        <div key={student._id} className="text-sm p-2 bg-gray-50 rounded">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-gray-600">{student.userId}</div>
                          <div className="text-gray-500">{student.email}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// User Management Modal Component
const UserManagementModal = ({ onClose, onUpdate }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ role: "all", department: "all" })

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/admin/users", { params: filter })
      setUsers(response.data)
    } catch (error) {
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      await axios.patch(`/admin/users/${userId}/toggle-status`)
      toast.success("User status updated")
      fetchUsers()
      onUpdate()
    } catch (error) {
      toast.error("Failed to update user status")
    }
  }

  const deleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`/admin/users/${userId}`)
        toast.success("User deleted successfully")
        fetchUsers()
        onUpdate()
      } catch (error) {
        toast.error("Failed to delete user")
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">User Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex space-x-4 mb-4">
          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            className="input"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
          </select>
          <select
            value={filter.department}
            onChange={(e) => setFilter({ ...filter, department: e.target.value })}
            className="input"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Biomedical">Biomedical</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">{user.userId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`capitalize text-sm text-gray-900 ${user.role}`}>{user.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => toggleUserStatus(user._id)}
                        className={`btn btn-sm ${user.isActive ? "btn-outline text-red-600" : "btn-outline text-green-600"}`}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                      {user.role !== "admin" && (
                        <button onClick={() => deleteUser(user._id)} className="btn btn-sm btn-outline text-red-600">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Placement Upload Modal Component - COMPLETELY REWRITTEN WITH BETTER ERROR HANDLING
const PlacementUploadModal = ({ onClose }) => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const [fetchingStudent, setFetchingStudent] = useState(false)
  const [uploadResults, setUploadResults] = useState(null)
  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    companyName: "",
    package: "",
    yearOfPlacement: new Date().getFullYear(),
    department: "",
    jobRole: "",
    placementType: "campus",
  })

  const fetchStudentData = async () => {
    if (!formData.studentId.trim()) {
      toast.error("Please enter a student ID")
      return
    }

    setFetchingStudent(true)
    try {
      const response = await axios.get(`/admin/students/${formData.studentId}`)
      setStudentData(response.data)
      setFormData({
        ...formData,
        studentName: response.data.name,
        department: response.data.department,
        yearOfPlacement: response.data.yearOfPlacement || new Date().getFullYear(),
      })
      toast.success("Student data fetched successfully")
    } catch (error) {
      toast.error(error.response?.data?.message || "Student not found")
      setStudentData(null)
    } finally {
      setFetchingStudent(false)
    }
  }

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("Please select a file")
      return
    }

    setLoading(true)
    const uploadData = new FormData()
    uploadData.append("file", file)

    try {
      const response = await axios.post("/admin/placements/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setUploadResults(response.data.results)
      toast.success(response.data.message)

      // Show detailed results
      if (response.data.results.errors.length > 0) {
        console.log("Upload errors:", response.data.results.errors)
      }
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error.response?.data?.message || "Upload failed"
      toast.error(errorMessage)

      // If there are validation errors, show them
      if (error.response?.data?.results) {
        setUploadResults(error.response.data.results)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleManualAdd = async () => {
    if (!formData.studentId || !formData.studentName || !formData.companyName || !formData.package) {
      toast.error("Please fill all required fields")
      return
    }

    setLoading(true)
    try {
      await axios.post("/admin/placements", formData)
      toast.success("Placement record updated successfully")
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add placement")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Upload Placement Data</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Excel Upload Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Upload Excel File</h3>
            <div className="space-y-3">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="input"
              />
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                <p className="font-medium mb-2 text-blue-800">Excel Format Requirements:</p>
                <p className="font-semibold text-blue-700">
                  Required columns: StudentID, StudentName, CompanyName, Package, YearOfPlacement, Department, JobRole
                </p>
                <div className="mt-2 text-blue-600">
                  <p>
                    <strong>Column Variations Supported:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    <li>StudentID: StudentID, studentId, student_id, STUDENTID</li>
                    <li>StudentName: StudentName, studentName, student_name, STUDENTNAME</li>
                    <li>CompanyName: CompanyName, companyName, company_name, COMPANYNAME, Company</li>
                    <li>Package: Package, package, PACKAGE, Salary, salary</li>
                    <li>
                      YearOfPlacement: YearOfPlacement, yearOfPlacement, year_of_placement, YEAROFPLACEMENT, Year, year
                    </li>
                    <li>Department: Department, department, DEPARTMENT</li>
                    <li>JobRole: JobRole, jobRole, job_role, JOBROLE, Role, role</li>
                  </ul>
                </div>
                <div className="mt-2 text-red-600">
                  <p>
                    <strong>Validation Rules:</strong>
                  </p>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    <li>StudentID must exist in the database</li>
                    <li>StudentName must match exactly with database</li>
                    <li>Department must match if provided</li>
                    <li>Package must be a valid number</li>
                    <li>Year must be between 2000 and current year + 5</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleFileUpload}
                disabled={loading || !file}
                className="btn btn-primary flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Uploading..." : "Upload Excel"}
              </button>
            </div>

            {/* Upload Results */}
            {uploadResults && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h4 className="font-medium text-gray-900 mb-2">Upload Results:</h4>
                <div className="space-y-2">
                  <p className="text-green-600">✓ {uploadResults.success} new records added</p>
                  <p className="text-blue-600">✓ {uploadResults.updated} records updated</p>
                  <p className="text-gray-600">📊 {uploadResults.totalProcessed} total rows processed</p>

                  {uploadResults.errors && uploadResults.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-red-600 font-medium">❌ {uploadResults.errors.length} errors found:</p>
                      <div className="max-h-40 overflow-y-auto text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                        {uploadResults.errors.map((error, index) => (
                          <p key={index} className="mb-1">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Add Single Record</h3>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Student ID (e.g., STU0001)"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  className="input flex-1"
                />
                <button
                  onClick={fetchStudentData}
                  disabled={fetchingStudent}
                  className="btn btn-outline flex items-center"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {fetchingStudent ? "Fetching..." : "Fetch"}
                </button>
              </div>

              {studentData && (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Found:</strong> {studentData.name} - {studentData.department} ({studentData.email})
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Student Name"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="input"
                  readOnly={!!studentData}
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Package (LPA)"
                  value={formData.package}
                  onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                  className="input"
                />
                <input
                  type="number"
                  placeholder="Year"
                  value={formData.yearOfPlacement}
                  onChange={(e) => setFormData({ ...formData, yearOfPlacement: Number.parseInt(e.target.value) })}
                  className="input"
                />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input"
                  disabled={!!studentData}
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Biomedical">Biomedical</option>
                </select>
                <input
                  type="text"
                  placeholder="Job Role"
                  value={formData.jobRole}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  className="input"
                />
                <select
                  value={formData.placementType}
                  onChange={(e) => setFormData({ ...formData, placementType: e.target.value })}
                  className="input"
                >
                  <option value="campus">Campus</option>
                  <option value="off-campus">Off-Campus</option>
                </select>
              </div>
              <button onClick={handleManualAdd} disabled={loading} className="btn btn-primary mt-4">
                {loading ? "Adding..." : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pending Events Modal Component
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

// Broadcast Form Component
const BroadcastForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    recipients: "all",
    priority: "medium",
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()
      Object.keys(formData).forEach((key) => {
        formDataToSend.append(key, formData[key])
      })

      files.forEach((file) => {
        formDataToSend.append("attachments", file)
      })

      await axios.post("/admin/broadcast", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      toast.success("Notification broadcasted successfully")
      onClose()
    } catch (error) {
      console.error("Broadcast error:", error)
      toast.error("Failed to broadcast notification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Broadcast Notification</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="input"
              rows="4"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                disabled={loading}
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="event">Event</option>
                <option value="alert">Alert</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="input"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Recipients</label>
            <select
              className="input"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              disabled={loading}
            >
              <option value="all">All Users</option>
              <option value="students">Students Only</option>
              <option value="faculty">Faculty Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Attachments (Optional, Max 50MB each)</label>
            <input
              type="file"
              className="input"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files))}
              disabled={loading}
            />
            {files.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">{files.length} file(s) selected</p>
                <div className="text-xs text-gray-500">
                  {files.map((file, index) => (
                    <div key={index}>
                      • {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Broadcasting..." : "Broadcast"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Dashboard
