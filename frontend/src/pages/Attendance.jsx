"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useParams, useNavigate } from "react-router-dom"
import { Calendar, Users, UserCheck, Download, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"

const Attendance = () => {
  const { user } = useAuth()
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMarkForm, setShowMarkForm] = useState(false)

  useEffect(() => {
    if (user?.role === "faculty") {
      fetchCourseData()
    } else {
      navigate("/courses")
    }
  }, [courseId, user, navigate])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const [courseResponse, studentsResponse, attendanceResponse] = await Promise.all([
        axios.get(`/courses/${courseId}`),
        axios.get(`/faculty/courses/${courseId}/students`),
        axios.get(`/faculty/courses/${courseId}/attendance`),
      ])

      setCourse(courseResponse.data)
      setStudents(studentsResponse.data.students)
      setAttendance(attendanceResponse.data.attendance)
    } catch (error) {
      console.error("Fetch course data error:", error)
      toast.error("Failed to fetch course data")
    } finally {
      setLoading(false)
    }
  }

  const downloadAttendance = async () => {
    try {
      const response = await axios.get(`/faculty/courses/${courseId}/attendance/download`, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${course.code}_attendance.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Attendance downloaded successfully")
    } catch (error) {
      console.error("Download attendance error:", error)
      toast.error("Failed to download attendance")
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading attendance data..." />
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(`/courses/${courseId}`)} className="btn btn-outline btn-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600">
              {course.title} ({course.code})
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowMarkForm(true)} className="btn btn-primary flex items-center">
            <UserCheck className="h-4 w-4 mr-2" />
            Mark Attendance
          </button>
          <button onClick={downloadAttendance} className="btn btn-outline flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Classes Conducted</p>
              <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">
                {attendance.length > 0
                  ? Math.round(
                      (attendance.reduce((sum, record) => {
                        const presentCount = record.students.filter(
                          (s) => s.status === "present" || s.status === "late",
                        ).length
                        return sum + (presentCount / students.length) * 100
                      }, 0) /
                        attendance.length) *
                        100,
                    ) / 100
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Records */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance Records</h3>
        </div>
        <div className="overflow-x-auto">
          {attendance.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => {
                  const presentCount = record.students.filter((s) => s.status === "present").length
                  const lateCount = record.students.filter((s) => s.status === "late").length
                  const absentCount = record.students.filter((s) => s.status === "absent").length
                  const percentage = ((presentCount + lateCount) / students.length) * 100

                  return (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.topic || "No topic"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{presentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">{lateCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{absentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {percentage.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records</h3>
              <p className="text-gray-600">Start marking attendance to see records here</p>
            </div>
          )}
        </div>
      </div>

      {showMarkForm && (
        <MarkAttendanceForm
          courseId={courseId}
          students={students}
          onClose={() => setShowMarkForm(false)}
          onSuccess={() => {
            setShowMarkForm(false)
            fetchCourseData()
          }}
        />
      )}
    </div>
  )
}

const MarkAttendanceForm = ({ courseId, students, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    topic: "",
  })
  const [attendance, setAttendance] = useState(
    students.map((student) => ({
      studentId: student._id,
      status: "present",
    })),
  )
  const [loading, setLoading] = useState(false)

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => prev.map((att) => (att.studentId === studentId ? { ...att, status } : att)))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post(`/faculty/courses/${courseId}/attendance`, {
        ...formData,
        attendance,
      })

      toast.success("Attendance marked successfully")
      onSuccess()
    } catch (error) {
      console.error("Mark attendance error:", error)
      const message = error.response?.data?.message || "Failed to mark attendance"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "late":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "absent":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Topic (Optional)</label>
              <input
                type="text"
                className="input"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Class topic"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Student Attendance</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {students.map((student) => {
                const studentAttendance = attendance.find((att) => att.studentId === student._id)
                return (
                  <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(studentAttendance?.status)}
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.userId}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleAttendanceChange(student._id, "present")}
                        className={`btn btn-sm ${
                          studentAttendance?.status === "present" ? "btn-primary" : "btn-outline"
                        }`}
                        disabled={loading}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttendanceChange(student._id, "late")}
                        className={`btn btn-sm ${studentAttendance?.status === "late" ? "btn-primary" : "btn-outline"}`}
                        disabled={loading}
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAttendanceChange(student._id, "absent")}
                        className={`btn btn-sm ${
                          studentAttendance?.status === "absent" ? "btn-primary" : "btn-outline"
                        }`}
                        disabled={loading}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? "Marking..." : "Mark Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Attendance
