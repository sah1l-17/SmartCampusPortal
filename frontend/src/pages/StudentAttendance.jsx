"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Calendar, BookOpen, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"

const StudentAttendance = () => {
  const { user } = useAuth()
  const [attendanceData, setAttendanceData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState("all")

  useEffect(() => {
    if (user?.role === "student") {
      fetchAttendanceData()
    }
  }, [user])

  const fetchAttendanceData = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/student/attendance")
      setAttendanceData(response.data)
    } catch (error) {
      console.error("Fetch attendance data error:", error)
      toast.error("Failed to fetch attendance data")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "absent":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "present":
        return "text-green-600 bg-green-50"
      case "late":
        return "text-yellow-600 bg-yellow-50"
      case "absent":
        return "text-red-600 bg-red-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const filteredData =
    selectedCourse === "all" ? attendanceData : attendanceData.filter((course) => course.courseId === selectedCourse)

  const overallStats = attendanceData.reduce(
    (acc, course) => {
      acc.totalClasses += course.summary.totalClasses
      acc.totalPresent += course.summary.presentCount + course.summary.lateCount
      acc.totalAbsent += course.summary.absentCount
      return acc
    },
    { totalClasses: 0, totalPresent: 0, totalAbsent: 0 },
  )

  const overallPercentage =
    overallStats.totalClasses > 0 ? ((overallStats.totalPresent / overallStats.totalClasses) * 100).toFixed(1) : 0

  if (loading) {
    return <LoadingSpinner text="Loading attendance data..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600">Track your attendance across all courses</p>
        </div>
        <div className="flex items-center space-x-4">
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input">
            <option value="all">All Courses</option>
            {attendanceData.map((course) => (
              <option key={course.courseId} value={course.courseId}>
                {course.courseCode} - {course.courseTitle}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attended</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalPresent}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Missed</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalAbsent}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall %</p>
              <p className="text-2xl font-bold text-gray-900">{overallPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course-wise Attendance */}
      <div className="space-y-6">
        {filteredData.map((course) => (
          <div key={course.courseId} className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {course.courseTitle} ({course.courseCode})
                    </h3>
                    <p className="text-sm text-gray-600">Faculty: {course.faculty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{course.summary.attendancePercentage}%</p>
                  <p className="text-sm text-gray-600">
                    {course.summary.presentCount + course.summary.lateCount} / {course.summary.totalClasses}
                  </p>
                </div>
              </div>

              {/* Course Statistics */}
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-lg font-semibold text-gray-900">{course.summary.totalClasses}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Present</p>
                  <p className="text-lg font-semibold text-green-600">{course.summary.presentCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Late</p>
                  <p className="text-lg font-semibold text-yellow-600">{course.summary.lateCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Absent</p>
                  <p className="text-lg font-semibold text-red-600">{course.summary.absentCount}</p>
                </div>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Recent Attendance Records</h4>
              {course.records.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {course.records.slice(0, 10).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(record.status)}
                        <div>
                          <p className="font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">{record.topic || "No topic specified"}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </div>
                  ))}
                  {course.records.length > 10 && (
                    <p className="text-sm text-gray-500 text-center mt-2">
                      Showing 10 of {course.records.length} records
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No attendance records found</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {attendanceData.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance data</h3>
          <p className="text-gray-600">You don't have any attendance records yet</p>
        </div>
      )}
    </div>
  )
}

export default StudentAttendance
