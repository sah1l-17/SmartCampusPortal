import mongoose from "mongoose"

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  maxMarks: {
    type: Number,
    required: true,
  },
  attachments: [
    {
      filename: String,
      data: Buffer,
      contentType: String,
      size: Number,
    },
  ],
  submissions: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      files: [
        {
          filename: String,
          data: Buffer,
          contentType: String,
          size: Number,
        },
      ],
      marks: {
        type: Number,
        default: 0,
      },
      feedback: String,
      isGraded: {
        type: Boolean,
        default: false,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  type: {
    type: String,
    enum: ["document", "video", "link"],
    required: true,
  },
  file: {
    filename: String,
    data: Buffer,
    contentType: String,
    size: Number,
  },
  url: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  topic: String,
  students: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["present", "absent", "late"],
        default: "absent",
      },
      markedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  semester: {
    type: Number,
    required: true,
  },
  credits: {
    type: Number,
    required: true,
  },
  enrolledStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  materials: [materialSchema],
  assignments: [assignmentSchema],
  attendance: [attendanceSchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Course", courseSchema)
