
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      trim: true,
      ref: "Student"
    },

    date: {
      type: String,
      required: [true, "Attendance date is required"],
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        "Date must use YYYY-MM-DD format"
      ]
    },

    status: {
      type: String,
      required: [true, "Attendance status is required"],
      enum: ["Present", "Absent", "Late"]
    },

    time: {
      type: String,
      default: "—"
    }
  },
  {
    timestamps: true
  }
);

// A student can have only one attendance record per date.
attendanceSchema.index(
  { studentId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
