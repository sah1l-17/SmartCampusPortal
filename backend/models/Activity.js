import mongoose from "mongoose"

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "user_registered",
      "course_created",
      "event_created",
      "event_approved",
      "notification_sent",
      "user_login",
      "user_deleted",
      "user_status_updated",
      "event_status_updated",
      "placement_added",
      "placements_uploaded",
      "notification_broadcast",
      "event_deleted",
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  relatedModel: {
    type: String,
    enum: ["User", "Course", "Event", "Notification", "Placement"],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Index for better query performance
activitySchema.index({ createdAt: -1 })
activitySchema.index({ type: 1 })

export default mongoose.model("Activity", activitySchema)
