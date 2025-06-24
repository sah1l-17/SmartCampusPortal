"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Bell, AlertCircle, Info, Calendar, TrendingUp, Download, Paperclip } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/notifications")
      setNotifications(response.data)
    } catch (error) {
      console.error("Fetch notifications error:", error)
      toast.error("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`/notifications/${notificationId}/read`)
      setNotifications(
        notifications.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true } : notif)),
      )
    } catch (error) {
      console.error("Mark as read error:", error)
    }
  }

  const downloadAttachment = async (notificationId, attachmentId, filename) => {
    try {
      const response = await axios.get(`/notifications/${notificationId}/attachments/${attachmentId}/download`, {
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "event":
        return <Calendar className="h-5 w-5 text-blue-500" />
      case "placement":
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case "academic":
        return <Info className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500 bg-red-50"
      case "high":
        return "border-l-orange-500 bg-orange-50"
      case "medium":
        return "border-l-blue-500 bg-blue-50"
      default:
        return "border-l-gray-500 bg-gray-50"
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading notifications..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with latest announcements</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`card p-4 border-l-4 cursor-pointer transition-all ${getPriorityColor(
              notification.priority,
            )} ${!notification.isRead ? "shadow-md" : "opacity-75"}`}
            onClick={() => !notification.isRead && markAsRead(notification._id)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                      {notification.title}
                    </h3>
                    <p className={`mt-1 text-sm ${!notification.isRead ? "text-gray-700" : "text-gray-600"}`}>
                      {notification.message}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span className="capitalize">{notification.type}</span>
                  <span className="capitalize">{notification.priority} priority</span>
                  <span>By {notification.sender?.name}</span>
                  {notification.department && <span>{notification.department} Dept.</span>}
                </div>

                {/* Attachments */}
                {notification.attachments && notification.attachments.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attachments:
                    </h4>
                    <div className="space-y-1">
                      {notification.attachments.map((attachment) => (
                        <button
                          key={attachment._id}
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadAttachment(notification._id, attachment._id, attachment.filename)
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {attachment.filename}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      )}
    </div>
  )
}

export default Notifications
