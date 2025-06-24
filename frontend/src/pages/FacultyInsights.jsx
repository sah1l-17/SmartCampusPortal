"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Users, CheckCircle, Clock, Award, FileText } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"

const FacultyInsights = () => {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState("all")

  useEffect(() => {
    if (user?.role === "faculty") {
      fetchAssignments()
    }
  }, [user])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/faculty/assignments")
      setAssignments(response.data)
    } catch (error) {
      console.error("Fetch assignments error:", error)
      toast.error("Failed to fetch assignments")
    } finally {
      setLoading(false)
    }
  }

  const handleGradeSubmission = async (courseId, assignmentId, submissionId, marks, feedback) => {
    try {
      await axios.patch(`/faculty/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
        marks,
        feedback,
      })
      toast.success("Assignment graded successfully")
      fetchAssignments()
    } catch (error) {
      console.error("Grade assignment error:", error)
      toast.error("Failed to grade assignment")
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading assignments..." />
  }

  if (user?.role !== "faculty") {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">This page is only accessible to faculty</p>
      </div>
    )
  }

  const filteredAssignments =
    selectedCourse === "all" ? assignments : assignments.filter((assignment) => assignment.courseId === selectedCourse)

  const stats = {
    totalAssignments: assignments.length,
    totalSubmissions: assignments.reduce((acc, assignment) => acc + assignment.totalSubmissions, 0),
    ungradedSubmissions: assignments.reduce((acc, assignment) => acc + assignment.ungradedCount, 0),
    gradedSubmissions: assignments.reduce((acc, assignment) => acc + assignment.gradedCount, 0),
  }

  const uniqueCourses = [
    ...new Set(assignments.map((a) => ({ id: a.courseId, title: a.courseTitle, code: a.courseCode }))),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignment Grading</h1>
          <p className="text-gray-600">Review and grade student submissions</p>
        </div>
        <div className="flex items-center space-x-4">
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input">
            <option value="all">All Courses</option>
            {uniqueCourses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAssignments}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Grading</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ungradedSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Graded</p>
              <p className="text-2xl font-bold text-gray-900">{stats.gradedSubmissions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-6">
        {filteredAssignments.map((assignment) => (
          <AssignmentCard
            key={`${assignment.courseId}-${assignment.assignmentId}`}
            assignment={assignment}
            onGrade={handleGradeSubmission}
          />
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600">
            {selectedCourse === "all"
              ? "You haven't created any assignments yet"
              : "No assignments found for the selected course"}
          </p>
        </div>
      )}
    </div>
  )
}

const AssignmentCard = ({ assignment, onGrade }) => {
  const [showSubmissions, setShowSubmissions] = useState(false)

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{assignment.assignmentTitle}</h3>
            <p className="text-sm text-gray-600">
              {assignment.courseCode} - {assignment.courseTitle}
            </p>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              <span>Max Marks: {assignment.maxMarks}</span>
              <span>Submissions: {assignment.totalSubmissions}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex space-x-2 mb-2">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                {assignment.ungradedCount} Pending
              </span>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {assignment.gradedCount} Graded
              </span>
            </div>
            <button onClick={() => setShowSubmissions(!showSubmissions)} className="btn btn-outline btn-sm">
              {showSubmissions ? "Hide" : "View"} Submissions
            </button>
          </div>
        </div>
      </div>

      {showSubmissions && (
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Student Submissions</h4>
          {assignment.submissions.length > 0 ? (
            <div className="space-y-4">
              {assignment.submissions.map((submission) => (
                <SubmissionCard
                  key={submission._id}
                  submission={submission}
                  assignment={assignment}
                  onGrade={onGrade}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No submissions yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const SubmissionCard = ({ submission, assignment, onGrade }) => {
  const [showGradeForm, setShowGradeForm] = useState(false)
  const [marks, setMarks] = useState(submission.marks || 0)
  const [feedback, setFeedback] = useState(submission.feedback || "")

  const handleGrade = () => {
    if (marks < 0 || marks > assignment.maxMarks) {
      toast.error(`Marks should be between 0 and ${assignment.maxMarks}`)
      return
    }

    onGrade(assignment.courseId, assignment.assignmentId, submission._id, marks, feedback)
    setShowGradeForm(false)
  }

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div>
              <h5 className="font-medium text-gray-900">{submission.student.name}</h5>
              <p className="text-sm text-gray-600">{submission.student.userId}</p>
            </div>
            {submission.isGraded ? (
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">
                  {submission.marks}/{assignment.maxMarks}
                </span>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Pending
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
          </p>
          {submission.feedback && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p className="text-sm font-medium text-gray-700">Feedback:</p>
              <p className="text-sm text-gray-600 mt-1">{submission.feedback}</p>
            </div>
          )}
        </div>
        <div className="ml-4">
          {submission.isGraded ? (
            <button onClick={() => setShowGradeForm(true)} className="btn btn-outline btn-sm">
              Update Grade
            </button>
          ) : (
            <button onClick={() => setShowGradeForm(true)} className="btn btn-primary btn-sm">
              Grade
            </button>
          )}
        </div>
      </div>

      {showGradeForm && (
        <div className="mt-4 p-4 border-t border-gray-200">
          <h6 className="font-medium text-gray-900 mb-3">Grade Submission</h6>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Marks (out of {assignment.maxMarks})</label>
              <input
                type="number"
                className="input"
                min="0"
                max={assignment.maxMarks}
                value={marks}
                onChange={(e) => setMarks(Number.parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Feedback</label>
              <textarea
                className="input"
                rows="3"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowGradeForm(false)} className="btn btn-outline btn-sm">
                Cancel
              </button>
              <button onClick={handleGrade} className="btn btn-primary btn-sm">
                Save Grade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyInsights
