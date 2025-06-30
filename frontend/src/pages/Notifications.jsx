"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Bell, AlertCircle, Info, Calendar, TrendingUp, Download, Paperclip, X, Eye, Check, Plus } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import LoadingSpinner from "../components/LoadingSpinner"
import { BroadcastForm } from "./Dashboard"
import { triggerNotificationUpdate } from "../utils/notifications"

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showBroadcastForm, setShowBroadcastForm] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  // Create axios instance with default headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') // Adjust this based on how you store the token
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/notifications", getAuthHeaders())
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
      await axios.patch(`/notifications/${notificationId}/read`, {}, getAuthHeaders())
      setNotifications(
        notifications.map((notif) => (notif._id === notificationId ? { ...notif, isRead: true } : notif)),
      )
      // Trigger unread count update in header
      triggerNotificationUpdate()
    } catch (error) {
      console.error("Mark as read error:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setIsMarkingAll(true)
      await axios.patch("/notifications/mark-all-read", {}, getAuthHeaders())
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })))
      // Trigger unread count update in header
      triggerNotificationUpdate()
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Mark all as read error:", error)
      toast.error("Failed to mark all as read")
    } finally {
      setIsMarkingAll(false)
    }
  }

  const openNotificationModal = async (notification) => {
    setSelectedNotification(notification)
    setShowModal(true)
    if (!notification.isRead) {
      // Optimistically update the UI
      setNotifications(notifications.map((notif) => 
        notif._id === notification._id ? { ...notif, isRead: true } : notif
      ))
      // Trigger unread count update in header immediately
      triggerNotificationUpdate()
      
      // Then make the API call
      try {
        await axios.patch(`/notifications/${notification._id}/read`, {}, getAuthHeaders())
      } catch (error) {
        console.error("Mark as read error:", error)
        // Revert the optimistic update if the API call fails
        setNotifications(notifications.map((notif) => 
          notif._id === notification._id ? { ...notif, isRead: false } : notif
        ))
        triggerNotificationUpdate()
      }
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedNotification(null)
  }

  const downloadAttachment = async (notificationId, attachmentId, filename) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/notifications/${notificationId}/attachments/${attachmentId}/download`, {
        responseType: "blob",
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading notifications..." />
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">Stay updated with latest announcements</p>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={isMarkingAll}
              className="btn btn-outline flex items-center space-x-2"
            >
              <Check className="h-4 w-4" />
              <span>{isMarkingAll ? "Marking..." : "Mark all as read"}</span>
            </button>
          )}
          {user?.role === "admin" && (
            <button
              onClick={() => setShowBroadcastForm(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Broadcast</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
        </div>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`card p-4 border-l-4 cursor-pointer transition-all hover:shadow-md ${getPriorityColor(
              notification.priority,
            )} ${!notification.isRead ? "shadow-md ring-1 ring-blue-200" : "opacity-75"}`}
            onClick={() => openNotificationModal(notification)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </span>
                    </div>
                    <p className={`text-sm line-clamp-2 ${!notification.isRead ? "text-gray-700" : "text-gray-600"}`}>
                      {notification.message}
                    </p>
                  </div>

                  <div className="flex flex-col items-end space-y-1 ml-4">
                    <button 
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={(e) => {
                        e.stopPropagation()
                        openNotificationModal(notification)
                      }}
                    >
                      <Eye className="h-4 w-4 text-gray-400" />
                    </button>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                  <span className="capitalize">{notification.type}</span>
                  <span>By {notification.sender?.name}</span>
                  {notification.department && <span>{notification.department} Dept.</span>}
                  {notification.attachments && notification.attachments.length > 0 && (
                    <span className="flex items-center">
                      <Paperclip className="h-3 w-3 mr-1" />
                      {notification.attachments.length} attachment{notification.attachments.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
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

      {/* Notification Detail Modal */}
      {showModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getNotificationIcon(selectedNotification.type)}
                <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeColor(selectedNotification.priority)}`}
                >
                  {selectedNotification.priority}
                </span>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <span className="capitalize">{selectedNotification.type}</span>
                  <span>By {selectedNotification.sender?.name}</span>
                  <span>{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                  {selectedNotification.department && <span>{selectedNotification.department} Dept.</span>}
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedNotification.message}</div>
              </div>

              {/* Attachments */}
              {selectedNotification.attachments && selectedNotification.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attachments ({selectedNotification.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedNotification.attachments.map((attachment) => (
                      <div key={attachment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                            <p className="text-xs text-gray-500">{(attachment.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadAttachment(selectedNotification._id, attachment._id, attachment.filename)
                          }}
                          className="btn btn-outline btn-sm flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end">
              <button onClick={closeModal} className="btn btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Form Modal */}
      {showBroadcastForm && (
        <BroadcastForm 
          onClose={() => {
            setShowBroadcastForm(false)
            fetchNotifications() // Refresh notifications after broadcasting
          }} 
        />
      )}
    </div>
  )
}

export default Notifications