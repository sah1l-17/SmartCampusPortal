import jwt from "jsonwebtoken"
import User from "../models/User.js"

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-college-portal-2024"

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization")

    if (!authHeader) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    const token = authHeader.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" })
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = await User.findById(decoded.userId).select("-password")

      if (!user) {
        return res.status(401).json({ message: "Token is not valid" })
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" })
      }

      req.user = user
      next()
    } catch (error) {
      console.error("Token verification error:", error)
      return res.status(401).json({ message: "Token is not valid" })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({ message: "Server error" })
  }
}

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" })
    }

    next()
  }
}
