import express from "express"
import Course from "../models/Course.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get all courses (for students and general access)
router.get("/", authenticate, async (req, res) => {
  try {
    let courses

    if (req.user.role === "student") {
      // Students see only their enrolled courses
      courses = await Course.find({
        enrolledStudents: req.user._id,
      })
        .populate("faculty", "name email")
        .populate("enrolledStudents", "name email userId")
        .sort({ createdAt: -1 })
    } else if (req.user.role === "faculty") {
      // Faculty see their own courses
      courses = await Course.find({ faculty: req.user._id })
        .populate("faculty", "name email")
        .populate("enrolledStudents", "name email userId")
        .sort({ createdAt: -1 })
    } else if (req.user.role === "admin") {
      // Admin sees all courses
      courses = await Course.find()
        .populate("faculty", "name email")
        .populate("enrolledStudents", "name email userId")
        .sort({ createdAt: -1 })
    } else {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(courses)
  } catch (error) {
    console.error("Get courses error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get single course
router.get("/:courseId", authenticate, async (req, res) => {
  try {
    const { courseId } = req.params

    let course

    if (req.user.role === "student") {
      // Students can only access courses they're enrolled in
      course = await Course.findOne({
        _id: courseId,
        enrolledStudents: req.user._id,
      })
        .populate("faculty", "name email")
        .populate("enrolledStudents", "name email userId")
        .populate("assignments.submissions.student", "name email userId")
    } else if (req.user.role === "faculty") {
      // Faculty can access their own courses
      course = await Course.findOne({
        _id: courseId,
        faculty: req.user._id,
      })
        .populate("faculty", "name email")
        .populate("enrolledStudents", "name email userId")
        .populate("assignments.submissions.student", "name email userId")
    } else if (req.user.role === "admin") {
      // Admin can access any course
      course = await Course.findById(courseId)
        .populate("faculty", "name email")
        .populate("enrolledStudents", "name email userId")
        .populate("assignments.submissions.student", "name email userId")
    } else {
      return res.status(403).json({ message: "Access denied" })
    }

    if (!course) {
      return res.status(404).json({ message: "Course not found or access denied" })
    }

    res.json(course)
  } catch (error) {
    console.error("Get course error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
