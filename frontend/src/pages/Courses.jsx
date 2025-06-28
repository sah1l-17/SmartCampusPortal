"use client"

import { useState, useEffect } from "react"
import { Routes, Route, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Loader2,
  UserCheck,
  Clock,
  Download,
  FileText,
  Video,
  LinkIcon,
} from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"
import SubmissionForm from "./SubmissionForm"

const CoursesList = () => {
  const { user } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState("all")

  useEffect(() => {
    fetchCourses()
  }, [departmentFilter])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      let endpoint = "/courses"
      const params = {}
      
      // Add department filter for admin
      if (user?.role === "admin" && departmentFilter !== "all") {
        endpoint = "/admin/courses"
        params.department = departmentFilter
      } else if (user?.role === "admin") {
        endpoint = "/admin/courses"
      }
      
      const response = await axios.get(endpoint, { params })
      setCourses(response.data)
    } catch (error) {
      console.error("Fetch courses error:", error)
      toast.error("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading courses..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600">
            {user?.role === "faculty" 
              ? "Manage your courses" 
              : user?.role === "admin"
              ? "View and manage all courses"
              : "Your enrolled courses"
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Department Filter for Admin */}
          {user?.role === "admin" && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Department:</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="input min-w-[200px]"
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
          )}
          
          {user?.role === "faculty" && (
            <button onClick={() => setShowCreateForm(true)} className="btn btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </button>
          )}
        </div>
      </div>

      {/* Course Statistics for Admin */}
      {user?.role === "admin" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
              <p className="text-sm text-gray-600">
                {departmentFilter === "all" ? "Total Courses" : `${departmentFilter} Courses`}
              </p>
            </div>
          </div>
          <div className="card p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {courses.reduce((acc, course) => acc + (course.enrolledStudents?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Enrollments</p>
            </div>
          </div>
          <div className="card p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {[...new Set(courses.map(course => course.faculty?._id).filter(Boolean))].length}
              </p>
              <p className="text-sm text-gray-600">Active Faculty</p>
            </div>
          </div>
          <div className="card p-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {courses.reduce((acc, course) => acc + (course.assignments?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Assignments</p>
            </div>
          </div>
        </div>
      )}

      {showCreateForm && <CreateCourseForm onClose={() => setShowCreateForm(false)} onSuccess={fetchCourses} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course._id} course={course} />
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600">
            {user?.role === "faculty" 
              ? "Create your first course to get started" 
              : user?.role === "admin"
              ? departmentFilter === "all" 
                ? "No courses have been created yet."
                : `No courses found for ${departmentFilter} department.`
              : "No courses available yet"
            }
          </p>
        </div>
      )}
    </div>
  )
}

const CourseCard = ({ course }) => {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div
      className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/courses/${course._id}`)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
            {user?.role === "admin" && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {course.department}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{course.code}</p>
          <p className="text-sm text-gray-700 line-clamp-2">{course.description}</p>
          {user?.role === "admin" && (
            <p className="text-sm text-gray-600 mt-2">
              Faculty: {course.faculty?.name || "Not assigned"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-1" />
          <span>{course.enrolledStudents?.length || 0} students</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Sem {course.semester}</span>
        </div>
      </div>
    </div>
  )
}

const CreateCourseForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    semester: 1,
    credits: 3,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "semester" || name === "credits" ? Number.parseInt(value) : value,
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
      newErrors.title = "Course title is required"
    }

    if (!formData.code.trim()) {
      newErrors.code = "Course code is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Course description is required"
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
      await axios.post("/faculty/courses", formData)
      toast.success("Course created successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Create course error:", error)
      const message = error.response?.data?.message || "Failed to create course"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Create New Course</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Course Title</label>
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
            <label className="form-label">Course Code</label>
            <input
              type="text"
              className={`input ${errors.code ? "border-red-500" : ""}`}
              value={formData.code}
              name="code"
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.code && <p className="form-error">{errors.code}</p>}
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
              <label className="form-label">Semester</label>
              <select
                className="input"
                value={formData.semester}
                name="semester"
                onChange={handleChange}
                disabled={loading}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Credits</label>
              <input
                type="number"
                className="input"
                min="1"
                max="6"
                value={formData.credits}
                name="credits"
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
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
                "Create Course"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const CourseDetail = () => {
  const { courseId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [students, setStudents] = useState([])
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [showAssignmentForm, setShowAssignmentForm] = useState(false)

  useEffect(() => {
    fetchCourseDetail()
    if (user?.role === "faculty" || user?.role === "admin") {
      fetchStudents()
    }
  }, [courseId])

  const fetchCourseDetail = async () => {
    try {
      let endpoint = `/courses/${courseId}`
      if (user?.role === "admin") {
        endpoint = `/admin/courses/${courseId}`
      }

      const response = await axios.get(endpoint)
      setCourse(response.data)
    } catch (error) {
      console.error("Fetch course detail error:", error)
      toast.error("Failed to fetch course details")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      let endpoint = `/faculty/courses/${courseId}/students`
      if (user?.role === "admin") {
        endpoint = `/admin/courses/${courseId}/students`
      }

      const response = await axios.get(endpoint)
      setStudents(response.data.students)
    } catch (error) {
      console.error("Fetch students error:", error)
    }
  }

  const handleAttendanceClick = () => {
    navigate(`/courses/${courseId}/attendance`)
  }

  const downloadMaterial = async (materialId, filename) => {
    try {
      // Determine the endpoint based on user role
      let endpoint
      if (user?.role === "faculty") {
        endpoint = `/faculty/courses/${courseId}/materials/${materialId}/download`
      } else if (user?.role === "admin") {
        endpoint = `/admin/courses/${courseId}/materials/${materialId}/download`
      } else {
        endpoint = `/student/courses/${courseId}/materials/${materialId}/download`
      }

      const response = await axios.get(endpoint, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Ensure auth token is sent
        },
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Material downloaded successfully")
    } catch (error) {
      console.error("Download material error:", error)
      toast.error(error.response?.data?.message || "Failed to download material")
    }
  }

  const downloadAssignmentAttachment = async (assignmentId, attachmentId, filename) => {
    try {
      let endpoint
      if (user?.role === "faculty") {
        endpoint = `/faculty/courses/${courseId}/assignments/${assignmentId}/attachments/${attachmentId}/download`
      } else if (user?.role === "admin") {
        endpoint = `/admin/courses/${courseId}/assignments/${assignmentId}/attachments/${attachmentId}/download`
      } else {
        endpoint = `/student/courses/${courseId}/assignments/${assignmentId}/attachments/${attachmentId}/download`
      }

      const response = await axios.get(endpoint, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Attachment downloaded successfully")
    } catch (error) {
      console.error("Download attachment error:", error)
      toast.error("Failed to download attachment")
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading course details..." />
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
        <p className="text-gray-600">The course you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        <p className="text-gray-600">
          {course.code} • {course.credits} Credits • Semester {course.semester}
        </p>
        <p className="text-gray-700 mt-2">{course.description}</p>

        <div className="mt-4 flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-1" />
          <span>{course.enrolledStudents?.length || 0} enrolled students</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "materials"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Materials
            </button>
            <button
              onClick={() => setActiveTab("assignments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "assignments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Assignments
            </button>
            {(user?.role === "faculty" || user?.role === "admin") && (
              <button
                onClick={() => setActiveTab("students")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "students"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Students
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Course Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Department:</span> {course.department}
                    </p>
                    <p>
                      <span className="font-medium">Faculty:</span> {course.faculty?.name}
                    </p>
                    <p>
                      <span className="font-medium">Semester:</span> {course.semester}
                    </p>
                    <p>
                      <span className="font-medium">Credits:</span> {course.credits}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Enrolled Students:</span> {course.enrolledStudents?.length || 0}
                    </p>
                    <p>
                      <span className="font-medium">Assignments:</span> {course.assignments?.length || 0}
                    </p>
                    <p>
                      <span className="font-medium">Materials:</span> {course.materials?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
              {user?.role === "faculty" && (
                <div className="mt-6">
                  <button onClick={handleAttendanceClick} className="btn btn-primary flex items-center">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Manage Attendance
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "materials" && (
            <MaterialsTab
              course={course}
              showForm={showMaterialForm}
              setShowForm={setShowMaterialForm}
              onUpdate={fetchCourseDetail}
              onDownload={downloadMaterial}
            />
          )}

          {activeTab === "assignments" && (
            <AssignmentsTab
              course={course}
              showForm={showAssignmentForm}
              setShowForm={setShowAssignmentForm}
              onUpdate={fetchCourseDetail}
              onDownloadAttachment={downloadAssignmentAttachment}
            />
          )}

          {activeTab === "students" && (user?.role === "faculty" || user?.role === "admin") && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Enrolled Students</h3>
                <span className="text-sm text-gray-600">{students.length} students</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.userId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.department}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Materials Tab Component
const MaterialsTab = ({ course, showForm, setShowForm, onUpdate, onDownload }) => {
  const { user } = useAuth()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Course Materials</h3>
        {user?.role === "faculty" && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </button>
        )}
      </div>

      {showForm && (
        <AddMaterialForm
          courseId={course._id}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            onUpdate()
          }}
        />
      )}

      <div className="space-y-4">
        {course.materials?.map((material, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {material.type === "document" && <FileText className="h-5 w-5 text-blue-500" />}
                  {material.type === "video" && <Video className="h-5 w-5 text-red-500" />}
                  {material.type === "link" && <LinkIcon className="h-5 w-5 text-green-500" />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{material.title}</h4>
                  {material.description && <p className="text-sm text-gray-600 mt-1">{material.description}</p>}
                  <p className="text-xs text-gray-500 mt-2">
                    Added on {new Date(material.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div>
                {material.type === "link" ? (
                  <a href={material.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                    Open Link
                  </a>
                ) : material.file ? (
                  <button
                    onClick={() => onDownload(material._id, material.file.filename)}
                    className="btn btn-outline btn-sm flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {(!course.materials || course.materials.length === 0) && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No materials available</p>
        </div>
      )}
    </div>
  )
}

// Assignments Tab Component
const AssignmentsTab = ({ course, showForm, setShowForm, onUpdate, onDownloadAttachment }) => {
  const { user } = useAuth()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Assignments</h3>
        {user?.role === "faculty" && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </button>
        )}
      </div>

      {showForm && (
        <AddAssignmentForm
          courseId={course._id}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            onUpdate()
          }}
        />
      )}

      <div className="space-y-4">
        {course.assignments?.map((assignment, index) => (
          <AssignmentCard
            key={assignment._id || index}
            assignment={assignment}
            courseId={course._id}
            onUpdate={onUpdate}
            onDownloadAttachment={onDownloadAttachment}
          />
        ))}
      </div>

      {(!course.assignments || course.assignments.length === 0) && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No assignments available</p>
        </div>
      )}
    </div>
  )
}

// Assignment Card Component
const AssignmentCard = ({ assignment, courseId, onUpdate, onDownloadAttachment }) => {
  const { user } = useAuth()
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)

  const userSubmission = assignment.submissions?.find(
    (sub) => sub.student === user?.id || sub.student?._id === user?.id,
  )

  const isOverdue = new Date(assignment.dueDate) < new Date()

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
            <span>Max Marks: {assignment.maxMarks}</span>
            {isOverdue && <span className="text-red-500">Overdue</span>}
          </div>
        </div>

        {user?.role === "student" && (
          <div>
            {userSubmission ? (
              <div className="text-right">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Submitted
                </span>
                {userSubmission.isGraded && (
                  <div className="mt-1 text-sm">
                    <span className="font-medium">
                      Score: {userSubmission.marks}/{assignment.maxMarks}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSubmissionForm(true)}
                disabled={isOverdue}
                className={`btn btn-sm ${isOverdue ? "btn-outline opacity-50 cursor-not-allowed" : "btn-primary"}`}
              >
                Submit
              </button>
            )}
          </div>
        )}
      </div>

      {assignment.attachments && assignment.attachments.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
          <div className="space-y-1">
            {assignment.attachments.map((file, index) => (
              <button
                key={index}
                onClick={() => onDownloadAttachment(assignment._id, file._id, file.filename)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                <Download className="h-3 w-3 mr-1" />
                {file.filename}
              </button>
            ))}
          </div>
        </div>
      )}

      {userSubmission?.feedback && (
        <div className="mt-3 p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium text-gray-700">Feedback:</p>
          <p className="text-sm text-gray-600 mt-1">{userSubmission.feedback}</p>
        </div>
      )}

      {showSubmissionForm && (
        <SubmissionForm
          courseId={courseId}
          assignmentId={assignment._id}
          onClose={() => setShowSubmissionForm(false)}
          onSuccess={() => {
            setShowSubmissionForm(false)
            onUpdate()
          }}
        />
      )}
    </div>
  )
}

// Add Material Form Component
const AddMaterialForm = ({ courseId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "document",
    url: "",
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = new FormData()
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key])
      })

      if (file) {
        submitData.append("file", file)
      }

      await axios.post(`/faculty/courses/${courseId}/materials`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Material added successfully")
      onSuccess()
    } catch (error) {
      toast.error("Failed to add material")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Add Course Material</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="link">Link</option>
            </select>
          </div>

          {formData.type === "link" ? (
            <div className="form-group">
              <label className="form-label">URL</label>
              <input
                type="url"
                className="input"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">File (Max 50MB)</label>
              <input type="file" className="input" onChange={(e) => setFile(e.target.files[0])} required />
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Adding..." : "Add Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Assignment Form Component
const AddAssignmentForm = ({ courseId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    maxMarks: 100,
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = new FormData()
      Object.keys(formData).forEach((key) => {
        submitData.append(key, formData[key])
      })

      files.forEach((file) => {
        submitData.append("attachments", file)
      })

      await axios.post(`/faculty/courses/${courseId}/assignments`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Assignment added successfully")
      onSuccess()
    } catch (error) {
      toast.error("Failed to add assignment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Add Assignment</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="input"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Max Marks</label>
            <input
              type="number"
              className="input"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: Number.parseInt(e.target.value) })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attachments (Max 50MB each)</label>
            <input type="file" className="input" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Adding..." : "Add Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const Courses = () => {
  return (
    <Routes>
      <Route index element={<CoursesList />} />
      <Route path=":courseId" element={<CourseDetail />} />
    </Routes>
  )
}

export default Courses
