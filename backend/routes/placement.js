import express from "express"
import Placement from "../models/Placement.js"
import { authenticate } from "../middleware/auth.js"

const router = express.Router()

// Get placement statistics
router.get("/stats", authenticate, async (req, res) => {
  try {
    const { year, department } = req.query

    const matchFilter = {}
    if (year) matchFilter.yearOfPlacement = Number.parseInt(year)
    if (department && department !== "all") matchFilter.department = department

    const stats = await Placement.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$yearOfPlacement",
          totalPlacements: { $sum: 1 },
          averagePackage: { $avg: "$package" },
          highestPackage: { $max: "$package" },
          lowestPackage: { $min: "$package" },
          companies: { $addToSet: "$companyName" },
        },
      },
      { $sort: { _id: -1 } },
    ])

    // Get department-wise stats
    const departmentStats = await Placement.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$department",
          totalPlacements: { $sum: 1 },
          averagePackage: { $avg: "$package" },
        },
      },
      { $sort: { totalPlacements: -1 } },
    ])

    res.json({
      yearlyStats: stats,
      departmentStats,
    })
  } catch (error) {
    console.error("Get placement stats error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get all placements
router.get("/", authenticate, async (req, res) => {
  try {
    const { year, department, page = 1, limit = 20 } = req.query

    const filter = {}
    if (year) filter.yearOfPlacement = Number.parseInt(year)
    if (department && department !== "all") filter.department = department

    const placements = await Placement.find(filter)
      .sort({ yearOfPlacement: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Placement.countDocuments(filter)

    res.json({
      placements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get placements error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
