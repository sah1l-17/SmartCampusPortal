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
  Plus,
  Activity,
  Award,
  Target,
  User,
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
      fetchPendingEvents()
      fetchDashboardData()
    } catch (error) {
      toast.error(`Failed to ${status} event`)
    }
  }

  const handleUpdateEventCapacity = async (eventId, newCapacity) => {
    try {
      const response = await axios.patch(`/admin/events/${eventId}/capacity`, {
        maxParticipants: Number(newCapacity),
      })
      toast.success(response.data.message || "Event capacity updated successfully")
      fetchAllEvents()
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update event capacity"
      toast.error(errorMessage)
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
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl p-8 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}! 👋</h1>
            <p className="text-gray-600 text-lg">Here's what's happening in your portal today.</p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center">
              <Target className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} title="Total Students" value={stats?.totalStudents || 0} color="blue" trend="+12%" />
        <StatCard icon={Users} title="Total Faculty" value={stats?.totalFaculty || 0} color="green" trend="+5%" />
        <StatCard icon={Clock} title="Pending Events" value={stats?.pendingEvents || 0} color="yellow" trend="3 new" />
        <StatCard icon={Calendar} title="Total Events" value={stats?.totalEvents || 0} color="purple" trend="+8%" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="card p-6 hover-lift">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Activity className="h-6 w-6 mr-3 text-blue-500" />
              Recent Activity
            </h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(activity.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 hover-lift">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="h-6 w-6 mr-3 text-purple-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <QuickActionButton
              onClick={fetchPendingEvents}
              icon={AlertCircle}
              title="View Pending Events"
              description="Review and approve events"
              color="orange"
            />
            <QuickActionButton
              onClick={fetchAllEvents}
              icon={Edit}
              title="Manage Event Capacity"
              description="Update event limits"
              color="blue"
            />
            <QuickActionButton
              onClick={() => setShowBroadcastForm(true)}
              icon={Plus}
              title="Broadcast Notification"
              description="Send announcements"
              color="green"
            />
            <QuickActionButton
              onClick={() => setShowUserManagement(true)}
              icon={Users}
              title="Manage Users"
              description="User administration"
              color="purple"
            />
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
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 rounded-3xl p-8 border border-green-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Good day, Prof. {user?.name}! 📚</h1>
            <p className="text-gray-600 text-lg">Ready to inspire minds today?</p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-blue-600 rounded-3xl flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={BookOpen} title="My Courses" value={stats?.totalCourses || 0} color="blue" trend="Active" />
        <StatCard icon={Calendar} title="My Events" value={stats?.totalEvents || 0} color="green" trend="Organized" />
        <StatCard
          icon={Clock}
          title="Pending Events"
          value={stats?.pendingEvents || 0}
          color="yellow"
          trend="Awaiting approval"
        />
        <StatCard
          icon={CheckCircle}
          title="Approved Events"
          value={stats?.approvedEvents || 0}
          color="purple"
          trend="Ready to go"
        />
      </div>
    </div>
  )

  const renderStudentDashboard = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl p-8 border border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello, {user?.name}! 🎓</h1>
            <p className="text-gray-600 text-lg">Let's make today productive!</p>
          </div>
          <div className="hidden md:block">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center">
              <Award className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={BookOpen}
          title="Enrolled Courses"
          value={stats?.enrolledCourses || 0}
          color="blue"
          trend="This semester"
        />
        <StatCard
          icon={Calendar}
          title="Upcoming Events"
          value={stats?.upcomingEvents || 0}
          color="green"
          trend="Don't miss out"
        />
        <StatCard
          icon={AlertCircle}
          title="Pending Assignments"
          value={stats?.pendingAssignments || 0}
          color="yellow"
          trend="Due soon"
        />
        <StatCard
          icon={TrendingUp}
          title="Total Assignments"
          value={stats?.totalAssignments || 0}
          color="purple"
          trend="Completed"
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto p-6">
        {user?.role === "admin" && renderAdminDashboard()}
        {user?.role === "faculty" && renderFacultyDashboard()}
        {user?.role === "student" && renderStudentDashboard()}
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, color, trend }) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-600",
    green: "from-green-500 to-green-600 bg-green-50 text-green-600",
    yellow: "from-yellow-500 to-yellow-600 bg-yellow-50 text-yellow-600",
    purple: "from-purple-500 to-purple-600 bg-purple-50 text-purple-600",
    orange: "from-orange-500 to-orange-600 bg-orange-50 text-orange-600",
  }

  return (
    <div className="card p-6 hover-lift animate-slide-in">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color].split(" ")[0]} ${colorClasses[color].split(" ")[1]} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          <p className={`text-xs font-medium ${colorClasses[color].split(" ")[2]}`}>{trend}</p>
        </div>
      </div>
    </div>
  )
}

// Quick Action Button Component
const QuickActionButton = ({ onClick, icon: Icon, title, description, color }) => {
  const colorClasses = {
    blue: "hover:bg-blue-50 text-blue-600 border-blue-200",
    green: "hover:bg-green-50 text-green-600 border-green-200",
    orange: "hover:bg-orange-50 text-orange-600 border-orange-200",
    purple: "hover:bg-purple-50 text-purple-600 border-purple-200",
  }

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 text-left border-2 rounded-2xl transition-all duration-200 hover-lift ${colorClasses[color]}`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-500">{description}</div>
        </div>
      </div>
    </button>
  )
}

// Event Management Modal Component
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
    <div className="modal-backdrop">
      <div className="modal-content max-w-6xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Event Capacity Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div key={event._id} className="card p-6 hover-lift">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                    <div>
                      <strong>Date:</strong> {new Date(event.date).toLocaleDateString()} at {event.time}
                    </div>
                    <div>
                      <strong>Venue:</strong> {event.venue}
                    </div>
                    <div>
                      <strong>Organizer:</strong> {event.organizer?.name}
                    </div>
                    <div>
                      <strong>Capacity:</strong> {event.maxParticipants || "Unlimited"}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4">
                    <span className="badge badge-primary">{event.registeredStudents?.length || 0} registered</span>
                    {event.maxParticipants > 0 && event.registeredStudents?.length >= event.maxParticipants && (
                      <span className="badge badge-danger">Event Full</span>
                    )}
                  </div>
                </div>
                <div className="ml-6">
                  {editingEvent === event._id ? (
                    <div className="flex items-center space-x-3">
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
                      <Edit className="h-4 w-4 mr-2" />
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
  const [departmentFilter, setDepartmentFilter] = useState("all")

  useEffect(() => {
    fetchCourses()
  }, [departmentFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const params = {}
      if (departmentFilter !== "all") {
        params.department = departmentFilter
      }

      const response = await axios.get("/admin/courses", { params })
      setCourses(response.data)
    } catch (error) {
      toast.error("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-6xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Department Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Filter by Department</label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="input max-w-xs"
            >
              <option value="all">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Biomedical">Biomedical</option>
              <option value="Electronics and Communication">Electronics and Communication</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-6">
              {/* Course Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card p-6 text-center hover-lift">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{courses.length}</div>
                  <div className="text-sm text-gray-600">
                    {departmentFilter === "all" ? "Total Courses" : `${departmentFilter} Courses`}
                  </div>
                </div>
                <div className="card p-6 text-center hover-lift">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {courses.reduce((acc, course) => acc + course.enrolledStudents.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Enrollments</div>
                </div>
                <div className="card p-6 text-center hover-lift">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {[...new Set(courses.map((course) => course.faculty._id))].length}
                  </div>
                  <div className="text-sm text-gray-600">Active Faculty</div>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {courses.map((course) => (
                  <div key={course._id} className="card p-6 hover-lift">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="font-bold text-gray-900 text-lg">{course.title}</h3>
                          <span className="badge badge-primary">{course.department}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            {course.code} • Semester {course.semester} • {course.credits} Credits
                          </div>
                          <div>Faculty: {course.faculty.name}</div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="badge badge-success">{course.enrolledStudents.length} Students</span>
                          <span className="badge badge-warning">{course.assignments?.length || 0} Assignments</span>
                          <span className="badge badge-primary">{course.materials?.length || 0} Materials</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCourse(selectedCourse === course._id ? null : course._id)}
                        className="btn btn-outline btn-sm"
                      >
                        {selectedCourse === course._id ? "Hide Students" : "View Students"}
                      </button>
                    </div>

                    {selectedCourse === course._id && (
                      <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in">
                        <h4 className="font-medium text-gray-900 mb-4">Enrolled Students:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {course.enrolledStudents.map((student) => (
                            <div key={student._id} className="p-3 bg-gray-50 rounded-xl">
                              <div className="font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-600">{student.userId}</div>
                              <div className="text-xs text-gray-500">{student.email}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {courses.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                    <p className="text-gray-600">
                      {departmentFilter === "all"
                        ? "No courses have been created yet."
                        : `No courses found for ${departmentFilter} department.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
    <div className="modal-backdrop">
      <div className="modal-content max-w-6xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex space-x-4 mb-6">
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
            <div className="table-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="table-header">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="badge badge-primary capitalize">{user.role}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${user.isActive ? "badge-success" : "badge-danger"}`}>
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
    </div>
  )
}

// Placement Upload Modal Component
export const PlacementUploadModal = ({ onClose }) => {
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

      if (response.data.results.errors.length > 0) {
        console.log("Upload errors:", response.data.results.errors)
      }
    } catch (error) {
      console.error("Upload error:", error)
      const errorMessage = error.response?.data?.message || "Upload failed"
      toast.error(errorMessage)

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
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Upload Placement Data</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Excel Upload Section */}
          <div className="card p-6 hover-lift">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-500" />
              Upload Excel File
            </h3>
            <div className="space-y-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files[0])}
                className="input"
              />
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
                <p className="font-bold text-blue-800 mb-3">📋 Excel Format Requirements:</p>
                <p className="font-semibold text-blue-700 mb-3">
                  Required columns: StudentID, StudentName, CompanyName, Package, YearOfPlacement, Department, JobRole
                </p>
                <div className="text-blue-600 space-y-2">
                  <p className="font-medium">Column Variations Supported:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>• StudentID: StudentID, studentId, student_id, STUDENTID</div>
                    <div>• StudentName: StudentName, studentName, student_name, STUDENTNAME</div>
                    <div>• CompanyName: CompanyName, companyName, company_name, COMPANYNAME, Company</div>
                    <div>• Package: Package, package, PACKAGE, Salary, salary</div>
                    <div>
                      • YearOfPlacement: YearOfPlacement, yearOfPlacement, year_of_placement, YEAROFPLACEMENT, Year,
                      year
                    </div>
                    <div>• Department: Department, department, DEPARTMENT</div>
                    <div>• JobRole: JobRole, jobRole, job_role, JOBROLE, Role, role</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                  <p className="font-medium text-red-800 mb-2">⚠️ Validation Rules:</p>
                  <ul className="text-sm text-red-600 space-y-1">
                    <li>• StudentID must exist in the database</li>
                    <li>• StudentName must match exactly with database</li>
                    <li>• Department must match if provided</li>
                    <li>• Package must be a valid number</li>
                    <li>• Year must be between 2000 and current year + 5</li>
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
              <div className="mt-6 p-6 bg-gray-50 rounded-2xl animate-fade-in">
                <h4 className="font-bold text-gray-900 mb-4">📊 Upload Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-green-100 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">{uploadResults.success}</div>
                    <div className="text-sm text-green-700">New Records</div>
                  </div>
                  <div className="text-center p-4 bg-blue-100 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{uploadResults.updated}</div>
                    <div className="text-sm text-blue-700">Updated Records</div>
                  </div>
                  <div className="text-center p-4 bg-gray-100 rounded-xl">
                    <div className="text-2xl font-bold text-gray-600">{uploadResults.totalProcessed}</div>
                    <div className="text-sm text-gray-700">Total Processed</div>
                  </div>
                </div>

                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="font-medium text-red-800 mb-2">❌ {uploadResults.errors.length} errors found:</p>
                    <div className="max-h-40 overflow-y-auto text-sm text-red-600 space-y-1">
                      {uploadResults.errors.map((error, index) => (
                        <div key={index} className="p-2 bg-red-100 rounded">
                          • {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="card p-6 hover-lift">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-500" />
              Add Single Record
            </h3>
            <div className="space-y-6">
              <div className="flex space-x-3">
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
                <div className="p-4 bg-green-50 rounded-2xl border border-green-200 animate-fade-in">
                  <p className="text-green-800 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <strong>Found:</strong> {studentData.name} - {studentData.department} ({studentData.email})
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <button onClick={handleManualAdd} disabled={loading} className="btn btn-primary">
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
    <div className="modal-backdrop">
      <div className="modal-content max-w-4xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Pending Events</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No pending events</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {events.map((event) => (
                <div key={event._id} className="card p-6 hover-lift">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">{event.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-500">
                        <div>
                          <strong>Date:</strong> {new Date(event.date).toLocaleDateString()} at {event.time}
                        </div>
                        <div>
                          <strong>Venue:</strong> {event.venue}
                        </div>
                        <div>
                          <strong>Organizer:</strong> {event.organizer.name} ({event.organizer.department})
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-6">
                      <button
                        onClick={() => onApprove(event._id, "approved")}
                        className="btn btn-outline btn-sm text-green-600 hover:bg-green-50 border-green-200"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => onApprove(event._id, "rejected")}
                        className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <X className="h-4 w-4 mr-1" />
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
    </div>
  )
}

// Broadcast Form Component
export const BroadcastForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "general",
    recipients: "all",
    priority: "medium",
    department: "",
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
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Broadcast Notification</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200">
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                <option value="placement">Placement</option>
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
              <option value="department">Specific Department</option>
            </select>
          </div>

          {formData.recipients === "department" && (
            <div className="form-group">
              <label className="form-label">Department</label>
              <select
                className="input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
                disabled={loading}
              >
                <option value="">Select Department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Biomedical">Biomedical</option>
              </select>
            </div>
          )}

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
              <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-700 mb-2">{files.length} file(s) selected</p>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center justify-between">
                      <span>• {file.name}</span>
                      <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
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
