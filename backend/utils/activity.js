import Activity from "../models/Activity.js"

export const logActivity = async (type, description, userId, relatedModel = null, relatedId = null, metadata = {}) => {
  try {
    const activity = new Activity({
      type,
      description,
      user: userId,
      relatedModel,
      relatedId,
      metadata,
    })
    await activity.save()
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}

export const getRecentActivities = async (limit = 10) => {
  try {
    const activities = await Activity.find().populate("user", "name role").sort({ createdAt: -1 }).limit(limit)
    return activities
  } catch (error) {
    console.error("Error fetching activities:", error)
    return []
  }
}
