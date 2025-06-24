import express from "express"
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator"
import User from "../models/User.js"
import Course from "../models/Course.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-college-portal-2024"

// Register
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["faculty", "student"]).withMessage("Invalid role"),
    body("department").notEmpty().withMessage("Department is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, email, password, role, department } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" })
      }

      // Create new user
      const user = new User({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        role,
        department,
      })

      // Save user (this will trigger the pre-validate middleware to generate userId)
      await user.save()

      // Auto-enroll student in existing courses of their department
      if (role === "student") {
        await Course.updateMany(
          { department: department, isActive: true },
          { $addToSet: { enrolledStudents: user._id } },
        )
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      )

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          userId: user.userId,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)

      // Handle duplicate key error
      if (error.code === 11000) {
        if (error.keyPattern?.email) {
          return res.status(400).json({ message: "Email already exists" })
        }
        if (error.keyPattern?.userId) {
          return res.status(400).json({ message: "User ID generation failed. Please try again." })
        }
      }

      // Handle validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map((err) => err.message)
        return res.status(400).json({
          message: "Validation failed",
          errors: validationErrors,
        })
      }

      res.status(500).json({ message: "Server error during registration" })
    }
  },
)

// Login
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() })
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" })
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(400).json({ message: "Account is deactivated. Please contact administrator." })
      }

      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" })
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      )

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          userId: user.userId,
          createdAt: user.createdAt,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Server error during login" })
    }
  },
)

// Get current user
router.get("/me", authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        userId: req.user.userId,
        createdAt: req.user.createdAt,
        isActive: req.user.isActive,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Logout (optional - mainly for clearing server-side sessions if needed)
router.post("/logout", authenticate, async (req, res) => {
  try {
    // In a JWT setup, logout is mainly handled client-side
    // But we can add server-side logic here if needed (like blacklisting tokens)
    res.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
