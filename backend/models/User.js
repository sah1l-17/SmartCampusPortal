import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "faculty", "student"],
    required: true,
  },
  department: {
    type: String,
    required: function () {
      return this.role === "faculty" || this.role === "student"
    },
  },
  userId: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  profileImage: {
    type: String,
    default: "",
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Generate user ID based on role BEFORE validation
userSchema.pre("validate", async function (next) {
  if (this.isNew && !this.userId) {
    try {
      const prefix = this.role === "admin" ? "ADM" : this.role === "faculty" ? "FAC" : "STU"

      // Get count of users with the same role
      let count = 0
      let userId = ""
      let isUnique = false

      // Keep trying until we get a unique userId
      while (!isUnique) {
        count = await this.constructor.countDocuments({ role: this.role })
        userId = `${prefix}${String(count + 1).padStart(4, "0")}`

        // Check if this userId already exists
        const existingUser = await this.constructor.findOne({ userId })
        if (!existingUser) {
          isUnique = true
        } else {
          // If it exists, increment count and try again
          count++
        }
      }

      this.userId = userId
      next()
    } catch (error) {
      next(error)
    }
  } else {
    next()
  }
})

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Clean up method to remove user data
userSchema.methods.cleanupUserData = async function () {
  try {
    // Import models here to avoid circular dependency
    const Course = mongoose.model("Course")
    const Event = mongoose.model("Event")
    const Notification = mongoose.model("Notification")
    const Placement = mongoose.model("Placement")

    // Remove user from enrolled courses
    await Course.updateMany({ enrolledStudents: this._id }, { $pull: { enrolledStudents: this._id } })

    // Remove user's courses if faculty
    if (this.role === "faculty") {
      await Course.deleteMany({ faculty: this._id })
    }

    // Remove user's events
    await Event.deleteMany({ organizer: this._id })

    // Remove user from event registrations
    await Event.updateMany(
      { "registeredStudents.student": this._id },
      { $pull: { registeredStudents: { student: this._id } } },
    )

    // Remove user's notifications
    await Notification.deleteMany({ sender: this._id })

    // Remove user from notification read status
    await Notification.updateMany({ "readBy.user": this._id }, { $pull: { readBy: { user: this._id } } })

    // Remove placement records added by this user
    if (this.role === "admin") {
      await Placement.deleteMany({ addedBy: this._id })
    }
  } catch (error) {
    console.error("Error cleaning up user data:", error)
  }
}

// Pre-remove middleware to cleanup related data
userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  await this.cleanupUserData()
  next()
})

userSchema.pre("findOneAndDelete", async function (next) {
  const user = await this.model.findOne(this.getQuery())
  if (user) {
    await user.cleanupUserData()
  }
  next()
})

export default mongoose.model("User", userSchema)
