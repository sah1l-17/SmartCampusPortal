"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:5000/api"
axios.defaults.timeout = 10000 // 10 seconds timeout

// Add request interceptor to handle token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem("token")
      delete axios.defaults.headers.common["Authorization"]

      // Only redirect if not already on login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        await fetchUser()
      } catch (error) {
        console.error("Auth initialization error:", error)
        clearAuth()
      }
    }
    setLoading(false)
  }

  const fetchUser = async () => {
    try {
      const response = await axios.get("/auth/me")
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      console.error("Fetch user error:", error)
      clearAuth()
      throw error
    }
  }

  const clearAuth = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await axios.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Login successful!")
      return { success: true, user }
    } catch (error) {
      console.error("Login error:", error)
      let message = "Login failed"

      if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.response?.data?.errors) {
        message = error.response.data.errors.map((err) => err.msg || err.message).join(", ")
      } else if (error.message) {
        message = error.message
      }

      toast.error(message)
      clearAuth()
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)

      // Clean and validate data
      const cleanData = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: userData.role,
        department: userData.department,
      }

      const response = await axios.post("/auth/register", cleanData)
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      toast.success("Registration successful! Welcome to the portal!")
      return { success: true, user }
    } catch (error) {
      console.error("Registration error:", error)
      let message = "Registration failed"

      if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        if (Array.isArray(errors)) {
          message = errors.map((err) => err.msg || err.message || err).join(", ")
        } else {
          message = errors
        }
      } else if (error.message) {
        message = error.message
      }

      toast.error(message)
      clearAuth()
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call logout endpoint if needed
      await axios.post("/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      clearAuth()
      toast.success("Logged out successfully!")
    }
  }

  const refreshUser = async () => {
    try {
      const user = await fetchUser()
      return user
    } catch (error) {
      console.error("Refresh user error:", error)
      return null
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    clearAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
