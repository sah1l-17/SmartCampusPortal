import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["general", "academic", "event", "placement", "alert"],
    default: "general",
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipients: {
    type: String,
    enum: ["all", "students", "faculty", "department", "student", "admin"], // Added both singular and plural forms
    default: "all",
  },
  department: String,
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  attachments: [
    {
      filename: String,
      data: Buffer,
      contentType: String,
      size: Number,
    },
  ],
  readBy: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Notification", notificationSchema)
