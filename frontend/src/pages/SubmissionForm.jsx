"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

const SubmissionForm = ({ courseId, assignmentId, onClose, onSuccess }) => {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      toast.error("Please select a file to submit")
      return
    }

    setLoading(true)

    try {
      const submitData = new FormData()
      submitData.append("file", file)

      await axios.post(`/student/courses/${courseId}/assignments/${assignmentId}/submit`, submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Assignment submitted successfully")
      onSuccess()
    } catch (error) {
      console.error("Submit assignment error:", error)
      const message = error.response?.data?.message || "Failed to submit assignment"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Submit Assignment</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">File (Max 50MB)</label>
            <input
              type="file"
              className="input"
              onChange={(e) => setFile(e.target.files[0])}
              required
              disabled={loading}
            />
            {file && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !file} className="btn btn-primary flex items-center">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SubmissionForm
