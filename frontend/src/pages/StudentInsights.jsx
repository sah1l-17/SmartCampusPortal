"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { BarChart3, Calendar, CheckCircle, Clock, TrendingUp, BookOpen, Award } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"

const StudentInsights = () => {
  const { user } = useAuth()
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === "student") {
      fetchStudentInsights()
    }
  }, [user])

  const fetchStudentInsights = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/student/performance")
      console.log("Performance data:", response.data) // Debug log
      setPerformance(response.data)
    } catch (error) {
      console.error("Fetch student insights error:", error)
      toast.error("Failed to fetch insights")
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

  const overallStats = {
    totalCourses: performance.length,
    averagePerformance:
      performance.length > 0
        ? (performance.reduce((acc, course) => acc + course.percentage, 0) / performance.length).toFixed(1)
        : 0,
    totalAssignments: performance.reduce((acc, course) => acc + course.assignments.length, 0),
    completedAssignments: performance.reduce(
      (acc, course) => acc + course.assignments.filter((a) => a.isSubmitted).length,
      0,
    ),
    gradedAssignments: performance.reduce(
      (acc, course) => acc + course.assignments.filter((a) => a.isGraded).length,
      0,
    ),
    averageAttendance:
      performance.length > 0
        ? (performance.reduce((acc, course) => acc + course.attendancePercentage, 0) / performance.length).toFixed(1)
        : 0,
  }

  // Prepare chart data
  const performanceChartData = performance.map((course) => ({
    name: course.courseCode,
    performance: course.percentage,
    attendance: course.attendancePercentage,
  }))

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Academic Insights</h1>
        <p className="text-gray-600">Track your academic progress and performance</p>
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
              <p className="text-2xl font-bold text-gray-900">{overallStats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.averagePerformance}%</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-bold text-gray-900">
                {overallStats.completedAssignments}/{overallStats.totalAssignments}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.averageAttendance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance & Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="performance" fill="#3b82f6" name="Performance %" />
              <Bar dataKey="attendance" fill="#10b981" name="Attendance %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Completed", value: overallStats.completedAssignments },
                  { name: "Pending", value: overallStats.totalAssignments - overallStats.completedAssignments },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: "Completed", value: overallStats.completedAssignments },
                  { name: "Pending", value: overallStats.totalAssignments - overallStats.completedAssignments },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course-wise Performance */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Course-wise Performance</h3>
        </div>
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
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performance.map((course) => (
                <tr key={course.courseId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.courseTitle}</div>
                      <div className="text-sm text-gray-500">{course.courseCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.faculty}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>
                        Submitted: {course.assignments.filter((a) => a.isSubmitted).length}/{course.assignments.length}
                      </div>
                      <div>
                        Graded: {course.assignments.filter((a) => a.isGraded).length}/{course.assignments.length}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{course.percentage}%</div>
                        <div className="text-sm text-gray-500">
                          {course.obtainedMarks}/{course.totalMarks} marks
                        </div>
                      </div>
                      <div className="ml-4">
                        {course.percentage >= 80 ? (
                          <Award className="h-5 w-5 text-yellow-500" />
                        ) : course.percentage >= 60 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{course.attendancePercentage}%</div>
                    <div className="text-sm text-gray-500">
                      {course.attendedClasses}/{course.totalClasses} classes
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Details */}
      <div className="space-y-6">
        {performance.map((course) => (
          <div key={course.courseId} className="card">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {course.courseTitle} ({course.courseCode}) - Assignments
              </h3>
            </div>
            <div className="p-6">
              {course.assignments.length > 0 ? (
                <div className="space-y-4">
                  {course.assignments.map((assignment) => (
                    <div key={assignment.assignmentId} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            <span>Max Marks: {assignment.maxMarks}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {assignment.isSubmitted ? (
                            assignment.isGraded ? (
                              <div>
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Graded
                                </span>
                                <div className="mt-1 text-sm font-medium">
                                  Score: {assignment.marks}/{assignment.maxMarks}
                                </div>
                              </div>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Submitted
                              </span>
                            )
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Not Submitted
                            </span>
                          )}
                        </div>
                      </div>
                      {assignment.feedback && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-sm font-medium text-gray-700">Feedback:</p>
                          <p className="text-sm text-gray-600 mt-1">{assignment.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No assignments available</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {performance.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data</h3>
          <p className="text-gray-600">You don't have any course performance data yet</p>
        </div>
      )}
    </div>
  )
}

export default StudentInsights
