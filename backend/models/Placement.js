import mongoose from "mongoose"

const placementSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  package: {
    type: Number,
    required: true,
  },
  yearOfPlacement: {
    type: Number,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  jobRole: String,
  placementType: {
    type: String,
    enum: ["campus", "off-campus"],
    default: "campus",
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Placement", placementSchema)
