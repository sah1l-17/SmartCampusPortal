"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import {
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"

const StudentInsights = () => {
  const { user } = useAuth()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === "student") {
      fetchInsights()
    }
  }, [user])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/student/insights")
      setInsights(response.data)
    } catch (error) {
      console.error("Fetch insights error:", error)
      toast.error("Failed to fetch student insights")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading insights..." />
  }

  if (user?.role !== "student") {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">This page is only accessible to students</p>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">Unable to load your academic insights</p>
      </div>
    )
  }

  const { academicPerformance, attendanceOverview, courseWisePerformance } = insights

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Insights</h1>
          <p className="text-gray-600">Track your academic performance and attendance</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{academicPerformance.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{academicPerformance.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceOverview.attendancePercentage}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {academicPerformance.submittedAssignments}/{academicPerformance.totalAssignments}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Academic Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Assignments</span>
              <span className="font-medium">{academicPerformance.totalAssignments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Submitted</span>
              <span className="font-medium text-green-600">{academicPerformance.submittedAssignments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Graded</span>
              <span className="font-medium text-blue-600">{academicPerformance.gradedAssignments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Marks</span>
              <span className="font-medium">
                {academicPerformance.obtainedMarks}/{academicPerformance.totalMarks}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Average Score</span>
                <span className="text-lg font-bold text-blue-600">{academicPerformance.averageScore}%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${academicPerformance.averageScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2" />
            Attendance Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Classes</span>
              <span className="font-medium">{attendanceOverview.totalClasses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Attended</span>
              <span className="font-medium text-green-600">{attendanceOverview.attendedClasses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Missed</span>
              <span className="font-medium text-red-600">
                {attendanceOverview.totalClasses - attendanceOverview.attendedClasses}
              </span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Attendance Rate</span>
                <span className="text-lg font-bold text-green-600">{attendanceOverview.attendancePercentage}%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${attendanceOverview.attendancePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course-wise Performance */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Course-wise Performance
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courseWisePerformance.map((course) => (
                <tr key={course.courseId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.courseTitle}</div>
                      <div className="text-sm text-gray-500">{course.courseCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{course.faculty}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">
                        {course.assignments.submitted}/{course.assignments.total}
                      </span>
                      {course.assignments.submitted === course.assignments.total ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{course.assignments.averageScore}%</span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${course.assignments.averageScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {course.attendance.attendancePercentage}%
                      </span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${course.attendance.attendancePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {courseWisePerformance.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No course data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentInsights
