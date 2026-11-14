
const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

// Validate date format and actual calendar date (YYYY-MM-DD)
const isValidDate = (date) => {
  if (typeof date !== "string") {
    return false;
  }

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
};

// GET: Retrieve attendance records
// Optional query: ?date=2026-11-04
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    const filter = {};

    if (date) {
      if (!isValidDate(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date. Use YYYY-MM-DD format"
        });
      }

      filter.date = date;
    }

    const records = await Attendance.find(filter).sort({
      date: -1,
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve attendance records",
      error: error.message
    });
  }
});

// GET: Retrieve one student's attendance history
router.get("/student/:studentId", async (req, res) => {
  try {
    const records = await Attendance.find({
      studentId: req.params.studentId
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student attendance history",
      error: error.message
    });
  }
});

// POST: Mark attendance or update an existing record
router.post("/", async (req, res) => {
  try {
    const { studentId, date, status, time } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "Student ID, date and status are required"
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format"
      });
    }

    if (!["Present", "Absent", "Late"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Present, Absent or Late"
      });
    }

    const student = await Student.findOne({ id: studentId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { studentId, date },
      {
        studentId,
        date,
        status,
        time: time || "—"
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(200).json({
      success: true,
      message: "Attendance saved successfully",
      record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save attendance",
      error: error.message
    });
  }
});

// PUT: Update an existing attendance record
router.put("/:studentId/:date", async (req, res) => {
  try {
    const { studentId, date } = req.params;
    const { status, time } = req.body;

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format"
      });
    }

    if (!["Present", "Absent", "Late"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Present, Absent or Late"
      });
    }

    const record = await Attendance.findOneAndUpdate(
      { studentId, date },
      { status, time: time || "—" },
      {
        new: true,
        runValidators: true
      }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      record
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update attendance",
      error: error.message
    });
  }
});

// DELETE: Delete an attendance record
router.delete("/:studentId/:date", async (req, res) => {
  try {
    const { studentId, date } = req.params;

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD format"
      });
    }

    const record = await Attendance.findOneAndDelete({
      studentId,
      date
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete attendance record",
      error: error.message
    });
  }
});

module.exports = router;
