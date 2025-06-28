"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"

const SubmissionForm = ({ courseId, assignmentId, onClose, onSuccess }) => {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!files || files.length === 0) {
      toast.error("Please select at least one file to submit")
      return
    }

    setLoading(true)

    try {
      const submitData = new FormData()
      files.forEach((file) => {
        submitData.append("files", file)
      })

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
            <label className="form-label">Files (Max 5 files, 50MB each)</label>
            <input
              type="file"
              className="input"
              onChange={(e) => setFiles(Array.from(e.target.files))}
              required
              disabled={loading}
              multiple
            />
            {files && files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !files || files.length === 0} className="btn btn-primary flex items-center">
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
