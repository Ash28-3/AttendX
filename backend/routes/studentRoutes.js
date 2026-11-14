
const express = require("express");
const router = express.Router();

const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

// GET: Retrieve all students
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve students",
      error: error.message
    });
  }
});

// GET: Retrieve one student by student ID
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({ id: req.params.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve student",
      error: error.message
    });
  }
});

// POST: Add a new student
router.post("/", async (req, res) => {
  try {
    const { id, name, course, email, status, time, initials, color } = req.body;

    if (!id || !name || !course) {
      return res.status(400).json({
        success: false,
        message: "Student ID, name and course are required"
      });
    }

    const existingStudent = await Student.findOne({ id });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "A student with this ID already exists"
      });
    }

    const student = await Student.create({
      id,
      name,
      course,
      email,
      status,
      time,
      initials,
      color
    });

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add student",
      error: error.message
    });
  }
});

// PUT: Update an existing student
router.put("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update student",
      error: error.message
    });
  }
});

// DELETE: Delete a student and their attendance records
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({
      id: req.params.id
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    await Attendance.deleteMany({
      studentId: req.params.id
    });

    res.status(200).json({
      success: true,
      message: "Student and associated attendance records deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message
    });
  }
});

module.exports = router;
