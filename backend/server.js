import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

// Import routes
import authRoutes from "./routes/auth.js"
import adminRoutes from "./routes/admin.js"
import facultyRoutes from "./routes/faculty.js"
import studentRoutes from "./routes/student.js"
import courseRoutes from "./routes/course.js"
import eventRoutes from "./routes/event.js"
import notificationRoutes from "./routes/notification.js"
import placementRoutes from "./routes/placement.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Create upload directories if they don't exist
const uploadDirs = [
  path.join(__dirname, "uploads"),
  path.join(__dirname, "uploads", "assignments"),
  path.join(__dirname, "uploads", "events"),
  path.join(__dirname, "uploads", "notifications"),
  path.join(__dirname, "uploads", "placements"),
  path.join(__dirname, "uploads", "materials"),
  path.join(__dirname, "uploads", "submissions"),
]

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`Created directory: ${dir}`)
  }
})

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    optionsSuccessStatus: 200,
  }),
)

// Handle preflight requests
app.options("*", cors())

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    jwtSecret: process.env.JWT_SECRET ? "Set" : "Not Set",
  })
})

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/faculty", facultyRoutes)
app.use("/api/student", studentRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/placements", placementRoutes)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack)

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    })
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID format" })
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: "Duplicate entry" })
  }

  if (err.name === "MulterError") {
    return res.status(400).json({ message: "File upload error: " + err.message })
  }

  res.status(500).json({
    message: "Something went wrong!",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  })
})

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/college-portal", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  console.log("❌ MongoDB disconnected")
})

mongoose.connection.on("reconnected", () => {
  console.log("✅ MongoDB reconnected")
})

// Connect to database
connectDB()

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌐 API URL: http://localhost:${PORT}`)
  console.log(`📱 Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}`)
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? "✅ Set" : "❌ Using Default"}`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
    mongoose.connection.close()
  })
})

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully")
  server.close(() => {
    console.log("Process terminated")
    mongoose.connection.close()
  })
})
