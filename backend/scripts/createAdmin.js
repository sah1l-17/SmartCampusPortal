import mongoose from "mongoose"
import User from "../models/User.js"
import dotenv from "dotenv"

dotenv.config()

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/college-portal")
    console.log("Connected to MongoDB")

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@college.edu" })
    if (existingAdmin) {
      console.log("Admin user already exists")
      process.exit(0)
    }

    // Create admin user
    const adminUser = new User({
      name: "System Administrator",
      email: "admin@college.edu",
      password: "admin123",
      role: "admin",
      userId: "ADM0001",
      isActive: true,
    })

    await adminUser.save()
    console.log("Admin user created successfully")
    console.log("Email: admin@college.edu")
    console.log("Password: admin123")

    process.exit(0)
  } catch (error) {
    console.error("Error creating admin:", error)
    process.exit(1)
  }
}

createAdmin()
