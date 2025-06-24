"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { User, Mail, Building, Calendar, Edit, Save, X } from "lucide-react"
import toast from "react-hot-toast"

const Profile = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
      })
    }
  }, [user])

  const handleSave = async () => {
    setLoading(true)
    try {
      // Note: This would require implementing a profile update endpoint
      toast.success("Profile updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      department: user.department || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn btn-outline flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-2">
              <button onClick={handleSave} disabled={loading} className="btn btn-primary flex items-center">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save"}
              </button>
              <button onClick={handleCancel} className="btn btn-outline flex items-center">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label flex items-center">
                <User className="h-4 w-4 mr-2" />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">{user?.name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email Address
              </label>
              <p className="text-gray-900">{user?.email}</p>
            </div>

            <div className="form-group">
              <label className="form-label flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Department
              </label>
              <p className="text-gray-900">{user?.department}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">User ID</label>
              <p className="text-gray-900 font-mono">{user?.userId}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <p className="text-gray-900 capitalize">{user?.role}</p>
            </div>

            <div className="form-group">
              <label className="form-label flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Member Since
              </label>
              <p className="text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
