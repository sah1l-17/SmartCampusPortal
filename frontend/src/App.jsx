"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "./contexts/AuthContext"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Courses from "./pages/Courses"
import Events from "./pages/Events"
import Placements from "./pages/Placements"
import Notifications from "./pages/Notifications"
import StudentInsights from "./pages/StudentInsights"
import FacultyInsights from "./pages/FacultyInsights"
import Attendance from "./pages/Attendance"
import StudentAttendance from "./pages/StudentAttendance"
import Profile from "./pages/Profile"
import About from "./pages/About"
import LoadingSpinner from "./components/LoadingSpinner"

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />

        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses/*" element={<Courses />} />
            <Route path="courses/:courseId/attendance" element={<Attendance />} />
            <Route path="events" element={<Events />} />
            <Route path="placements" element={<Placements />} />
            <Route path="notifications" element={<Notifications />} />
            <Route
              path="insights"
              element={
                user.role === "student" ? (
                  <StudentInsights />
                ) : user.role === "faculty" ? (
                  <FacultyInsights />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="profile" element={<Profile />} />
            <Route path="about" element={<About />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  )
}

export default App
