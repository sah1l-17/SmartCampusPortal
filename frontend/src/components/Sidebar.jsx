"use client"

import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  TrendingUp,
  Bell,
  BarChart3,
  User,
  Info,
  X,
  UserCheck,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const location = useLocation()

  const getNavigationItems = () => {
    const commonItems = [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Courses", href: "/courses", icon: BookOpen },
      { name: "Events", href: "/events", icon: Calendar },
      { name: "Notifications", href: "/notifications", icon: Bell },
      { name: "Profile", href: "/profile", icon: User },
      { name: "About", href: "/about", icon: Info },
    ]

    if (user?.role === "admin") {
      return [
        ...commonItems.slice(0, 3),
        { name: "Placements", href: "/placements", icon: TrendingUp },
        ...commonItems.slice(3),
      ]
    }

    if (user?.role === "faculty") {
      return [
        ...commonItems.slice(0, 3),
        { name: "Placements", href: "/placements", icon: TrendingUp },
        { name: "Insights", href: "/insights", icon: BarChart3 },
        ...commonItems.slice(3),
      ]
    }

    if (user?.role === "student") {
      return [
        ...commonItems.slice(0, 3),
        { name: "Placements", href: "/placements", icon: TrendingUp },
        { name: "Insights", href: "/insights", icon: BarChart3 },
        { name: "Attendance", href: "/attendance", icon: UserCheck },
        ...commonItems.slice(3),
      ]
    }

    return commonItems
  }

  const navigationItems = getNavigationItems()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-lg shadow-2xl transform transition-all duration-300 ease-in-out border-r border-gray-100
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Portal</h2>
              <p className="text-xs text-gray-500">Smart Campus</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden transition-all duration-200 focus-ring"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive =
              location.pathname === item.href || (item.href !== "/dashboard" && location.pathname.startsWith(item.href))

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`
                  sidebar-link group
                  ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}
                `}
              >
                <item.icon className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                <span className="font-medium">{item.name}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
              </NavLink>
            )
          })}
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">
                {user?.role} • {user?.department}
              </p>
            </div>
            <div className="status-dot status-online" />
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
