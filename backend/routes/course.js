import express from "express"
import Course from "../models/Course.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get courses based on user role
router.get("/", authenticate, async (req, res) => {
  try {
    let courses

    if (req.user.role === "admin") {
      courses = await Course.find()
        .populate("faculty", "name email userId")
        .populate("enrolledStudents", "name email userId")
        .sort({ createdAt: -1 })
    } else if (req.user.role === "faculty") {
      courses = await Course.find({ faculty: req.user._id })
        .populate("enrolledStudents", "name email userId")
        .sort({ createdAt: -1 })
    } else if (req.user.role === "student") {
      courses = await Course.find({ enrolledStudents: req.user._id })
        .populate("faculty", "name email")
        .select("-attendance")
        .sort({ createdAt: -1 })
    }

    res.json(courses)
  } catch (error) {
    console.error("Get courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get course by ID
router.get("/:courseId", authenticate, async (req, res) => {
  try {
    const { courseId } = req.params
    let course

    if (req.user.role === "admin") {
      course = await Course.findById(courseId)
        .populate("faculty", "name email userId")
        .populate("enrolledStudents", "name email userId")
    } else if (req.user.role === "faculty") {
      course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      }).populate("enrolledStudents", "name email userId")
    } else if (req.user.role === "student") {
      course = await Course.findOne({
        _id: courseId,
        enrolledStudents: req.user._id,
      })
        .populate("faculty", "name email")
        .select("-attendance")
    }

    if (!course) {
      return res.status(404).json({ message: "Course not found" })
    }

    res.json(course)
  } catch (error) {
    console.error("Get course error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
