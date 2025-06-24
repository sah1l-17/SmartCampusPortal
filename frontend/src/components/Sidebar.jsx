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
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">Portal</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/dashboard" && location.pathname.startsWith(item.href))

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    sidebar-link
                    ${isActive ? "sidebar-link-active" : "sidebar-link-inactive"}
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role} • {user?.department}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
