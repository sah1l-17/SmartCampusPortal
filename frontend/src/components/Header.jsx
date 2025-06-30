"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, User } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import axios from "axios"

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    fetchUnreadCount()
    // Refresh unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get("/notifications/unread-count")
      setUnreadCount(response.data.unreadCount)
    } catch (error) {
      console.error("Fetch unread count error:", error)
    }
  }

  // Listen for storage events to refresh unread count when notifications are marked as read
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'notifications_updated') {
        fetchUnreadCount()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events from the same tab
    const handleCustomEvent = () => {
      fetchUnreadCount()
    }
    
    window.addEventListener('notifications_updated', handleCustomEvent)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('notifications_updated', handleCustomEvent)
    }
  }, [])

  const handleNotificationClick = () => {
    navigate("/notifications")
    // Refresh unread count after navigating to notifications
    setTimeout(fetchUnreadCount, 1000)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <h1 className="ml-4 text-xl font-semibold text-gray-900 lg:ml-0">College Smart Portal</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationClick}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
            >
              <User className="h-6 w-6" />
              <span className="hidden md:block text-sm font-medium">{user?.name}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 text-sm text-gray-700 border-b">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-gray-500">{user?.email}</div>
                  <div className="text-xs text-gray-400 capitalize">
                    {user?.role} - {user?.userId}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    navigate("/profile")
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile Settings
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    logout()
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
