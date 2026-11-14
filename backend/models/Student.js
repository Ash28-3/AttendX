
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: [true, "Student name is required"],
      trim: true
    },

    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    status: {
      type: String,
      default: "Not Marked",
      enum: ["Present", "Absent", "Late", "Not Marked"]
    },

    time: {
      type: String,
      default: "—"
    },

    initials: {
      type: String,
      default: ""
    },

    color: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Student", studentSchema);
