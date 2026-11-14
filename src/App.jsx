import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Users, ClipboardCheck, CalendarDays,
  ChartNoAxesCombined, Settings, Bell, Search, ChevronDown,
  ArrowUpRight, ArrowDownRight, MoreHorizontal, Clock3,
  UserCheck, UserX, GraduationCap, Menu, Plus, UserPlus,
  Pencil, Trash2, X, Download
} from "lucide-react";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

import "./App.css";

// --------------------------------------------------
// API CONFIGURATION
// --------------------------------------------------

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const text = await response.text();
  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
      result.error ||
      `Request failed with status ${response.status}`
    );
  }

  return result;
}

function getArrayFromResponse(result, possibleKeys = []) {
  if (Array.isArray(result)) return result;

  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.students)) return result.students;
  if (Array.isArray(result?.records)) return result.records;
  if (Array.isArray(result?.attendance)) return result.attendance;

  for (const key of possibleKeys) {
    if (Array.isArray(result?.[key])) return result[key];
  }

  return [];
}

function getObjectFromResponse(result) {
  if (result?.data && !Array.isArray(result.data)) {
    return result.data;
  }

  if (result?.student) return result.student;
  if (result?.record) return result.record;

  return result;
}

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function getAttendanceTime(status) {
  if (status === "Absent") return "—";

  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeStudent(student) {
  return {
    ...student,
    id: student.id,
    name: student.name || "",
    course: student.course || "",
    email: student.email || "",
    initials: student.initials || getInitials(student.name),
    color: student.color || "blue"
  };
}

function normalizeAttendance(record) {
  return {
    ...record,
    studentId: record.studentId,
    date: record.date,
    status: record.status,
    time: record.time || "—"
  };
}

function exportCSV(rows, filename) {
  const csv = rows.map(row =>
    row.map(value =>
      `"${String(value ?? "").replace(/"/g, '""')}"`
    ).join(",")
  ).join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Students", icon: Users },
  { name: "Attendance", icon: ClipboardCheck },
  { name: "Records", icon: CalendarDays },
  { name: "Analytics", icon: ChartNoAxesCombined }
];

const controlStyle = {
  padding: "10px 12px",
  border: "1px solid #e5e9f0",
  borderRadius: "8px",
  background: "#fff",
  color: "#475569",
  fontSize: "13px",
  outline: "none"
};

// --------------------------------------------------
// SIDEBAR
// --------------------------------------------------

function Sidebar({ active, setActive, mobileOpen, setMobileOpen }) {
  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <GraduationCap size={25} />
          </div>
          <div>
            <h2>Attend<span>X</span></h2>
            <p>SMART ATTENDANCE</p>
          </div>
        </div>

        <div className="nav-label">MAIN MENU</div>

        <nav className="navigation">
          {navigation.map(item => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${active === item.name ? "active" : ""}`}
                onClick={() => {
                  setActive(item.name);
                  setMobileOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
                {active === item.name && <div className="active-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="nav-label settings-label">PREFERENCES</div>

        <button
          className={`nav-item ${active === "Settings" ? "active" : ""}`}
          onClick={() => {
            setActive("Settings");
            setMobileOpen(false);
          }}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <GraduationCap size={20} />
            </div>
            <h4>Need assistance?</h4>
            <p>Manage your classroom with ease.</p>
            <button onClick={() => alert("AttendX support information")}>
              Get support →
            </button>
          </div>

          <div className="profile">
            <div className="avatar admin-avatar">AD</div>
            <div className="profile-info">
              <strong>Admin User</strong>
              <span>Administrator</span>
            </div>
            <MoreHorizontal size={20} />
          </div>
        </div>
      </aside>
    </>
  );
}

// --------------------------------------------------
// COMMON COMPONENTS
// --------------------------------------------------

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${item.color}`}>
          <Icon size={21} />
        </div>
        <button className="more-button">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="stat-title">{item.title}</p>
      <h2>{item.value}</h2>

      <div className="stat-footer">
        <span className={`change ${item.positive ? "positive" : "negative"}`}>
          {item.positive
            ? <ArrowUpRight size={15} />
            : <ArrowDownRight size={15} />}
          {item.change}
        </span>
        <span>{item.description}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`status ${status.toLowerCase().replace(" ", "-")}`}>
      <span className="status-dot" />
      {status}
    </span>
  );
}

function StudentCell({ student }) {
  return (
    <div className="student-cell">
      <div className={`avatar ${student.color || "blue"}`}>
        {student.initials || getInitials(student.name)}
      </div>
      <div>
        <strong>{student.name}</strong>
        <span>{student.id}</span>
      </div>
    </div>
  );
}

function PageIntro({ title, description, children }) {
  return (
    <div className="page-intro">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function SummaryCards({ items }) {
  return (
    <section className="stats-grid" style={{ marginBottom: "24px" }}>
      {items.map(item => {
        const Icon = item.icon;

        return (
          <div className="stat-card" key={item.title}>
            <div className="stat-top">
              <div className={`stat-icon ${item.color}`}>
                <Icon size={21} />
              </div>
            </div>
            <p className="stat-title">{item.title}</p>
            <h2>{item.value}</h2>
          </div>
        );
      })}
    </section>
  );
}

function EmptyMessage({ children }) {
  return (
    <tr>
      <td colSpan="8" className="empty-state">
        {children}
      </td>
    </tr>
  );
}

// --------------------------------------------------
// STUDENT MANAGEMENT
// --------------------------------------------------

function StudentManagement({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent
}) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: "",
    id: "",
    course: "",
    email: ""
  };

  const [form, setForm] = useState(emptyForm);

  const filteredStudents = students.filter(student =>
    `${student.name} ${student.id} ${student.course} ${student.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openAddForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function openEditForm(student) {
    setForm({
      name: student.name,
      id: student.id,
      course: student.course,
      email: student.email || ""
    });
    setEditingId(student.id);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const id = form.id.trim().toUpperCase();
    const course = form.course.trim();
    const email = form.email.trim();

    if (!name || !id || !course) {
      setError("Please fill in all required fields.");
      return;
    }

    const duplicate = students.some(student =>
      student.id.toLowerCase() === id.toLowerCase() &&
      student.id !== editingId
    );

    if (duplicate) {
      setError("This roll number already exists.");
      return;
    }

    const studentData = {
      name,
      id,
      course,
      email,
      initials: getInitials(name),
      color: "blue"
    };

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await onUpdateStudent(editingId, studentData);
      } else {
        await onAddStudent(studentData);
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (err) {
      setError(err.message || "Unable to save student.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStudent(id) {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }

    try {
      await onDeleteStudent(id);
    } catch (err) {
      alert(err.message || "Unable to delete student.");
    }
  }

  return (
    <>
      <PageIntro
        title="Student Management"
        description="Add, update and manage student information."
      >
        <button className="primary-button" onClick={openAddForm}>
          <UserPlus size={17} /> Add Student
        </button>
      </PageIntro>

      <div className="table-card student-management-card">
        <div className="section-heading table-heading">
          <div>
            <h3>All Students</h3>
            <p>{students.length} students registered</p>
          </div>

          <div className="table-search student-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search name, roll number or course..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ROLL NUMBER</th>
                <th>COURSE</th>
                <th>EMAIL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td><StudentCell student={student} /></td>
                  <td>{student.id}</td>
                  <td>{student.course}</td>
                  <td>{student.email || "—"}</td>
                  <td>
                    <div className="student-actions">
                      <button
                        className="action-icon edit-action"
                        title="Edit student"
                        onClick={() => openEditForm(student)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="action-icon delete-action"
                        title="Delete student"
                        onClick={() => deleteStudent(student.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <EmptyMessage>No students found.</EmptyMessage>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div
          className="student-modal-overlay"
          onClick={event => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div className="student-modal">
            <div className="student-modal-header">
              <div>
                <h3>{editingId ? "Edit Student" : "Add New Student"}</h3>
                <p>Enter the student's information below.</p>
              </div>
              <button
                className="action-icon"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Student Name *</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={form.name}
                onChange={event =>
                  setForm({ ...form, name: event.target.value })
                }
              />

              <label>Roll Number *</label>
              <input
                type="text"
                placeholder="e.g. STU006"
                value={form.id}
                onChange={event =>
                  setForm({ ...form, id: event.target.value })
                }
              />

              <label>Course *</label>
              <input
                type="text"
                placeholder="e.g. B.Tech IT"
                value={form.course}
                onChange={event =>
                  setForm({ ...form, course: event.target.value })
                }
              />

              <label>Email Address</label>
              <input
                type="email"
                placeholder="student@example.com"
                value={form.email}
                onChange={event =>
                  setForm({ ...form, email: event.target.value })
                }
              />

              {error && <p className="student-form-error">{error}</p>}

              <div className="student-modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId ? "Save Changes" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// --------------------------------------------------
// ATTENDANCE MANAGEMENT
// --------------------------------------------------

function AttendanceManagement({
  students,
  attendanceRecords,
  onMarkStudent,
  onMarkAll
}) {
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [saving, setSaving] = useState(false);

  const recordsForDate = attendanceRecords.filter(
    record => record.date === selectedDate
  );

  function getRecord(studentId) {
    return recordsForDate.find(record => record.studentId === studentId);
  }

  const counts = students.reduce((total, student) => {
    const status = getRecord(student.id)?.status;

    if (status === "Present") total.present++;
    else if (status === "Absent") total.absent++;
    else if (status === "Late") total.late++;
    else total.unmarked++;

    return total;
  }, { present: 0, absent: 0, late: 0, unmarked: 0 });

  const attendanceRate = students.length
    ? Math.round(((counts.present + counts.late) / students.length) * 100)
    : 0;

  const filteredStudents = students.filter(student => {
    const searchText =
      `${student.name} ${student.id} ${student.course}`.toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());
    const status = getRecord(student.id)?.status || "Not Marked";
    const matchesFilter = filter === "All" || status === filter;

    return matchesSearch && matchesFilter;
  });

  async function markStudent(studentId, status) {
    setSaving(true);

    try {
      await onMarkStudent({
        studentId,
        date: selectedDate,
        status,
        time: getAttendanceTime(status)
      });
    } catch (err) {
      alert(err.message || "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  async function markAll(status) {
    if (!students.length) {
      alert("Add students before marking attendance.");
      return;
    }

    if (!window.confirm(
      `Are you sure you want to mark all ${students.length} students as ${status}?`
    )) {
      return;
    }

    setSaving(true);

    try {
      await onMarkAll(students, selectedDate, status);
    } catch (err) {
      alert(err.message || "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  function exportAttendance() {
    const rows = [
      ["Date", "Roll Number", "Student Name", "Course", "Status", "Time"],
      ...students.map(student => {
        const record = getRecord(student.id);

        return [
          selectedDate,
          student.id,
          student.name,
          student.course,
          record?.status || "Not Marked",
          record?.time || "—"
        ];
      })
    ];

    exportCSV(rows, `attendx-attendance-${selectedDate}.csv`);
  }

  const summaryCards = [
    { title: "Present", value: counts.present, color: "green", icon: UserCheck },
    { title: "Absent", value: counts.absent, color: "red", icon: UserX },
    { title: "Late", value: counts.late, color: "orange", icon: Clock3 },
    { title: "Not Marked", value: counts.unmarked, color: "blue", icon: Users }
  ];

  const actionStyle = {
    width: "32px",
    height: "32px",
    borderRadius: "7px",
    fontWeight: "700",
    cursor: saving ? "not-allowed" : "pointer",
    border: "1px solid #e2e8f0",
    background: "#fff"
  };

  return (
    <>
      <PageIntro
        title="Attendance Management"
        description="Mark and manage daily student attendance."
      >
        <button className="primary-button" onClick={exportAttendance}>
          <Download size={17} /> Export CSV
        </button>
      </PageIntro>

      <SummaryCards items={summaryCards} />

      <div className="table-card">
        <div className="section-heading table-heading">
          <div>
            <h3>Daily Attendance</h3>
            <p>
              {students.length} enrolled students · {attendanceRate}%
              attendance rate
            </p>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            flexWrap: "wrap"
          }}>
            <CalendarDays size={17} color="#64748b" />
            <input
              type="date"
              value={selectedDate}
              onChange={event => setSelectedDate(event.target.value)}
              style={controlStyle}
            />
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "18px 22px",
          borderTop: "1px solid #edf0f5",
          flexWrap: "wrap"
        }}>
          <div className="table-search" style={{ flex: "1", minWidth: "180px" }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <select
            value={filter}
            onChange={event => setFilter(event.target.value)}
            style={controlStyle}
          >
            <option value="All">All statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Not Marked">Not marked</option>
          </select>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          padding: "0 22px 18px"
        }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Quick actions:
          </span>

          <button
            disabled={saving}
            onClick={() => markAll("Present")}
            style={{
              ...controlStyle,
              background: "#ecfdf3",
              color: "#16834a",
              borderColor: "#c5f0d5",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Mark all present
          </button>

          <button
            disabled={saving}
            onClick={() => markAll("Absent")}
            style={{
              ...controlStyle,
              background: "#fff1f1",
              color: "#d14343",
              borderColor: "#ffd5d5",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Mark all absent
          </button>

          {saving && <span style={{ fontSize: "12px" }}>Saving...</span>}
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ROLL NUMBER</th>
                <th>COURSE</th>
                <th>TIME</th>
                <th>STATUS</th>
                <th>MARK ATTENDANCE</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.map(student => {
                const record = getRecord(student.id);
                const status = record?.status || "Not Marked";

                return (
                  <tr key={student.id}>
                    <td><StudentCell student={student} /></td>
                    <td>{student.id}</td>
                    <td>{student.course}</td>
                    <td>{record?.time || "—"}</td>
                    <td><StatusBadge status={status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "7px" }}>
                        {["Present", "Absent", "Late"].map(value => {
                          const letter = value === "Present"
                            ? "P"
                            : value === "Absent" ? "A" : "L";

                          const color = value === "Present"
                            ? "#16834a"
                            : value === "Absent" ? "#d14343" : "#c17a17";

                          const selected = status === value;

                          return (
                            <button
                              key={value}
                              title={`Mark ${value}`}
                              disabled={saving}
                              onClick={() => markStudent(student.id, value)}
                              style={{
                                ...actionStyle,
                                color: selected ? "#fff" : color,
                                ...(selected ? {
                                  background: color,
                                  borderColor: color
                                } : {})
                              }}
                            >
                              {letter}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredStudents.length === 0 && (
                <EmptyMessage>
                  No students match your search or filter.
                </EmptyMessage>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          padding: "15px 22px",
          borderTop: "1px solid #edf0f5",
          color: "#8490a2",
          fontSize: "12px"
        }}>
          <span>
            Showing {filteredStudents.length} of {students.length} students
          </span>
          <span>
            {counts.unmarked === 0 && students.length > 0
              ? "Attendance completed for this date"
              : `${counts.unmarked} student(s) still need attendance`}
          </span>
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------
// RECENT ATTENDANCE
// --------------------------------------------------

function RecentAttendance({ students, attendanceRecords, onViewAll }) {
  const [search, setSearch] = useState("");
  const today = getLocalDateKey();

  const filteredStudents = students.filter(student =>
    `${student.name} ${student.id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function getTodayRecord(studentId) {
    return attendanceRecords.find(record =>
      record.studentId === studentId && record.date === today
    );
  }

  return (
    <div className="table-card">
      <div className="section-heading table-heading">
        <div>
          <h3>Recent Attendance</h3>
          <p>Today's student attendance records</p>
        </div>
        <button className="view-all-button" onClick={onViewAll}>
          View all →
        </button>
      </div>

      <div className="table-toolbar">
        <div className="table-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
        <button className="filter-button">
          <CalendarDays size={15} /> Today
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>STUDENT</th>
              <th>COURSE</th>
              <th>TIME</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map(student => {
              const record = getTodayRecord(student.id);
              const status = record?.status || "Not Marked";

              return (
                <tr key={student.id}>
                  <td><StudentCell student={student} /></td>
                  <td>{student.course}</td>
                  <td>{record?.time || "—"}</td>
                  <td><StatusBadge status={status} /></td>
                  <td>
                    <button className="more-button">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredStudents.length === 0 && (
              <EmptyMessage>No students found.</EmptyMessage>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --------------------------------------------------
// ATTENDANCE RECORDS
// --------------------------------------------------

function AttendanceRecords({ students, attendanceRecords }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [studentFilter, setStudentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");

  const studentById = useMemo(
    () => new Map(students.map(student => [student.id, student])),
    [students]
  );

  const filteredRecords = attendanceRecords
    .filter(record => {
      const student = studentById.get(record.studentId);
      const searchText =
        `${student?.name || "Deleted student"} ${record.studentId} ${student?.course || ""}`
          .toLowerCase();

      return (
        searchText.includes(search.toLowerCase()) &&
        (studentFilter === "All" || record.studentId === studentFilter) &&
        (statusFilter === "All" || record.status === statusFilter) &&
        (!fromDate || record.date >= fromDate) &&
        (!toDate || record.date <= toDate)
      );
    })
    .sort((a, b) =>
      a.date !== b.date
        ? b.date.localeCompare(a.date)
        : a.studentId.localeCompare(b.studentId)
    );

  const totalMarked = filteredRecords.length;
  const presentCount = filteredRecords.filter(
    record => record.status === "Present"
  ).length;
  const lateCount = filteredRecords.filter(
    record => record.status === "Late"
  ).length;
  const absentCount = filteredRecords.filter(
    record => record.status === "Absent"
  ).length;

  const attendanceRate = totalMarked
    ? Math.round(((presentCount + lateCount) / totalMarked) * 100)
    : 0;

  const studentSummaries = students
    .filter(student =>
      studentFilter === "All" || student.id === studentFilter
    )
    .filter(student =>
      `${student.name} ${student.id} ${student.course}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .map(student => {
      const records = attendanceRecords.filter(record =>
        record.studentId === student.id &&
        (!fromDate || record.date >= fromDate) &&
        (!toDate || record.date <= toDate)
      );

      const markedDays = records.length;
      const attendedDays = records.filter(record =>
        record.status === "Present" || record.status === "Late"
      ).length;
      const absentDays = records.filter(
        record => record.status === "Absent"
      ).length;
      const lateDays = records.filter(
        record => record.status === "Late"
      ).length;

      return {
        ...student,
        markedDays,
        attendedDays,
        absentDays,
        lateDays,
        rate: markedDays
          ? Math.round((attendedDays / markedDays) * 100)
          : null
      };
    })
    .sort((a, b) => {
      if (a.rate === null) return 1;
      if (b.rate === null) return -1;
      return a.rate - b.rate;
    });

  function exportRecords() {
    const rows = [
      ["Date", "Roll Number", "Student Name", "Course", "Status", "Time"],
      ...filteredRecords.map(record => {
        const student = studentById.get(record.studentId);

        return [
          record.date,
          record.studentId,
          student?.name || "Deleted student",
          student?.course || "—",
          record.status,
          record.time || "—"
        ];
      })
    ];

    exportCSV(rows, "attendx-attendance-records.csv");
  }

  const summaryCards = [
    { title: "Total Records", value: totalMarked, color: "blue", icon: ClipboardCheck },
    { title: "Present", value: presentCount, color: "green", icon: UserCheck },
    { title: "Absent", value: absentCount, color: "red", icon: UserX },
    { title: "Attendance Rate", value: `${attendanceRate}%`, color: "purple", icon: ChartNoAxesCombined }
  ];

  return (
    <>
      <PageIntro
        title="Attendance Records"
        description="Review historical attendance and student-wise performance."
      >
        <button className="primary-button" onClick={exportRecords}>
          <Download size={17} /> Export Records
        </button>
      </PageIntro>

      <SummaryCards items={summaryCards} />

      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="section-heading table-heading">
          <div>
            <h3>Attendance History</h3>
            <p>{filteredRecords.length} matching records</p>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          padding: "18px 22px",
          borderTop: "1px solid #edf0f5"
        }}>
          <div className="table-search" style={{ flex: "1 1 220px", minWidth: "190px" }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search name, roll number or course..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <label style={{ fontSize: "12px", color: "#64748b" }}>From</label>
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={event => setFromDate(event.target.value)}
            style={controlStyle}
          />

          <label style={{ fontSize: "12px", color: "#64748b" }}>To</label>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={event => setToDate(event.target.value)}
            style={controlStyle}
          />

          <select
            value={studentFilter}
            onChange={event => setStudentFilter(event.target.value)}
            style={controlStyle}
          >
            <option value="All">All students</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.id})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            style={controlStyle}
          >
            <option value="All">All statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
          </select>

          <button
            className="cancel-button"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setStudentFilter("All");
              setStatusFilter("All");
              setSearch("");
            }}
          >
            Clear filters
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>DATE</th>
                <th>STUDENT</th>
                <th>ROLL NUMBER</th>
                <th>COURSE</th>
                <th>TIME</th>
                <th>STATUS</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record, index) => {
                const student = studentById.get(record.studentId);

                return (
                  <tr key={`${record.date}-${record.studentId}-${index}`}>
                    <td>{formatDate(record.date)}</td>
                    <td>
                      <div className="student-cell">
                        <div className={`avatar ${student?.color || "blue"}`}>
                          {student?.initials || "—"}
                        </div>
                        <strong>{student?.name || "Deleted student"}</strong>
                      </div>
                    </td>
                    <td>{record.studentId}</td>
                    <td>{student?.course || "—"}</td>
                    <td>{record.time || "—"}</td>
                    <td><StatusBadge status={record.status} /></td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <EmptyMessage>
                  No attendance records match the selected filters.
                </EmptyMessage>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: "14px 22px",
          borderTop: "1px solid #edf0f5",
          color: "#8490a2",
          fontSize: "12px"
        }}>
          Attendance rate counts Present and Late as attended. It is calculated
          only from records that have been marked.
        </div>
      </div>

      <div className="table-card">
        <div className="section-heading table-heading">
          <div>
            <h3>Student Attendance Summary</h3>
            <p>Student-wise attendance percentage for the selected date range.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ROLL NUMBER</th>
                <th>MARKED DAYS</th>
                <th>PRESENT + LATE</th>
                <th>LATE DAYS</th>
                <th>ABSENT DAYS</th>
                <th>ATTENDANCE</th>
              </tr>
            </thead>

            <tbody>
              {studentSummaries.map(student => (
                <tr key={student.id}>
                  <td><StudentCell student={student} /></td>
                  <td>{student.id}</td>
                  <td>{student.markedDays}</td>
                  <td>{student.attendedDays}</td>
                  <td>{student.lateDays}</td>
                  <td>{student.absentDays}</td>
                  <td>
                    <strong>
                      {student.rate === null ? "No data" : `${student.rate}%`}
                    </strong>
                  </td>
                </tr>
              ))}

              {studentSummaries.length === 0 && (
                <EmptyMessage>No students match your search.</EmptyMessage>
              )}
            </tbody>
          </table>
        </div>

        <div style={{
          padding: "14px 22px",
          borderTop: "1px solid #edf0f5",
          color: "#8490a2",
          fontSize: "12px"
        }}>
          Per-student percentage = (Present days + Late days) ÷ marked days.
          Unmarked days are excluded.
        </div>
      </div>
    </>
  );
}

// --------------------------------------------------
// ANALYTICS
// --------------------------------------------------

function Analytics({ students, attendanceRecords }) {
  const [period, setPeriod] = useState("7");

  const todayKey = getLocalDateKey();
  const cutoff = new Date();

  if (period !== "all") {
    cutoff.setDate(cutoff.getDate() - (Number(period) - 1));
  }

  const cutoffKey = getLocalDateKey(cutoff);

  const periodRecords = attendanceRecords.filter(record =>
    period === "all" || record.date >= cutoffKey
  );

  const presentCount = periodRecords.filter(
    record => record.status === "Present"
  ).length;

  const lateCount = periodRecords.filter(
    record => record.status === "Late"
  ).length;

  const absentCount = periodRecords.filter(
    record => record.status === "Absent"
  ).length;

  const markedCount = presentCount + lateCount + absentCount;
  const attendedCount = presentCount + lateCount;

  const overallRate = markedCount
    ? Math.round((attendedCount / markedCount) * 100)
    : 0;

  const dates = [
    ...new Set(periodRecords.map(record => record.date))
  ].sort();

  const trendData = dates.map(date => {
    const dailyRecords = periodRecords.filter(
      record => record.date === date
    );

    const dailyAttended = dailyRecords.filter(
      record => record.status === "Present" || record.status === "Late"
    ).length;

    const dailyMarked = dailyRecords.filter(
      record =>
        record.status === "Present" ||
        record.status === "Late" ||
        record.status === "Absent"
    ).length;

    return {
      date: date.slice(5),
      fullDate: formatDate(date),
      rate: dailyMarked
        ? Math.round((dailyAttended / dailyMarked) * 100)
        : 0
    };
  });

  const studentSummaries = students
    .map(student => {
      const records = periodRecords.filter(
        record => record.studentId === student.id
      );

      const present = records.filter(
        record => record.status === "Present"
      ).length;

      const late = records.filter(
        record => record.status === "Late"
      ).length;

      const absent = records.filter(
        record => record.status === "Absent"
      ).length;

      const marked = present + late + absent;
      const attended = present + late;

      return {
        ...student,
        present,
        late,
        absent,
        marked,
        attended,
        rate: marked ? Math.round((attended / marked) * 100) : null
      };
    })
    .filter(student => student.marked > 0);

  const rankedStudents = [...studentSummaries].sort(
    (a, b) => b.rate - a.rate || b.marked - a.marked
  );

  const lowAttendance = studentSummaries
    .filter(student => student.rate < 75)
    .sort((a, b) => a.rate - b.rate);

  const distribution = [
    { label: "Present", value: presentCount, color: "#16a36a" },
    { label: "Late", value: lateCount, color: "#d99127" },
    { label: "Absent", value: absentCount, color: "#dc5555" }
  ];

  const maxDistribution = Math.max(
    presentCount,
    lateCount,
    absentCount,
    1
  );

  const summaryCards = [
    { title: "Overall Attendance", value: `${overallRate}%`, color: "purple", icon: ChartNoAxesCombined },
    { title: "Present", value: presentCount, color: "green", icon: UserCheck },
    { title: "Late", value: lateCount, color: "orange", icon: Clock3 },
    { title: "Absent", value: absentCount, color: "red", icon: UserX }
  ];

  return (
    <>
      <PageIntro
        title="Attendance Analytics"
        description="Analyse attendance trends and identify students who need attention."
      >
        <select
          value={period}
          onChange={event => setPeriod(event.target.value)}
          style={{ ...controlStyle, minWidth: "150px", cursor: "pointer" }}
          aria-label="Analytics date range"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="all">All available records</option>
        </select>
      </PageIntro>

      <SummaryCards items={summaryCards} />

      <section
        className="dashboard-middle"
        style={{ alignItems: "stretch", marginBottom: "24px" }}
      >
        <div className="chart-card">
          <div className="section-heading">
            <div>
              <h3>Attendance Trend</h3>
              <p>Daily attendance percentage based on marked records</p>
            </div>
          </div>

          {trendData.length > 0 ? (
            <div className="chart-container" style={{ height: "280px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 12, right: 12, left: -18, bottom: 4 }}
                >
                  <defs>
                    <linearGradient
                      id="analyticsAttendanceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#4169e1" stopOpacity={0.24} />
                      <stop offset="100%" stopColor="#4169e1" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="#edf0f5"
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8993a4", fontSize: 11 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8993a4", fontSize: 11 }}
                    tickFormatter={value => `${value}%`}
                  />

                  <Tooltip
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullDate || ""
                    }
                    formatter={value => [`${value}%`, "Attendance"]}
                  />

                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4169e1"
                    strokeWidth={3}
                    fill="url(#analyticsAttendanceGradient)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "70px 20px" }}>
              No attendance data is available for this period.
            </div>
          )}
        </div>

        <div className="overview-card">
          <div className="section-heading">
            <div>
              <h3>Attendance Distribution</h3>
              <p>{markedCount} marked attendance records</p>
            </div>
          </div>

          <div style={{ padding: "18px 4px" }}>
            {distribution.map(item => (
              <div key={item.label} style={{ marginBottom: "22px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  marginBottom: "8px",
                  fontSize: "13px",
                  color: "#64748b"
                }}>
                  <span>{item.label}</span>
                  <strong style={{ color: "#263247" }}>{item.value}</strong>
                </div>

                <div style={{
                  height: "9px",
                  background: "#edf0f5",
                  borderRadius: "20px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${(item.value / maxDistribution) * 100}%`,
                    background: item.color,
                    borderRadius: "20px"
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div className="summary-total">
            <span>Attendance rate</span>
            <strong>{overallRate}%</strong>
          </div>
        </div>
      </section>

      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="section-heading table-heading">
          <div>
            <h3>Student Performance Ranking</h3>
            <p>Students ranked by attendance percentage for the selected period.</p>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>RANK</th>
                <th>STUDENT</th>
                <th>ROLL NUMBER</th>
                <th>PRESENT + LATE</th>
                <th>ABSENT</th>
                <th>MARKED DAYS</th>
                <th>ATTENDANCE</th>
              </tr>
            </thead>

            <tbody>
              {rankedStudents.map((student, index) => (
                <tr key={student.id}>
                  <td><strong>#{index + 1}</strong></td>
                  <td><StudentCell student={student} /></td>
                  <td>{student.id}</td>
                  <td>{student.attended}</td>
                  <td>{student.absent}</td>
                  <td>{student.marked}</td>
                  <td>
                    <strong style={{
                      color: student.rate >= 75 ? "#16834a" : "#d14343"
                    }}>
                      {student.rate}%
                    </strong>
                  </td>
                </tr>
              ))}

              {rankedStudents.length === 0 && (
                <EmptyMessage>
                  Attendance records are required before student rankings can be calculated.
                </EmptyMessage>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-card" style={{ marginBottom: "24px" }}>
        <div className="section-heading table-heading">
          <div>
            <h3>Students Below 75% Attendance</h3>
            <p>Students who may require attendance follow-up.</p>
          </div>

          <strong style={{
            color: lowAttendance.length ? "#d14343" : "#16834a"
          }}>
            {lowAttendance.length} student(s)
          </strong>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>STUDENT</th>
                <th>ROLL NUMBER</th>
                <th>COURSE</th>
                <th>ATTENDED</th>
                <th>ABSENT</th>
                <th>ATTENDANCE</th>
              </tr>
            </thead>

            <tbody>
              {lowAttendance.map(student => (
                <tr key={student.id}>
                  <td><StudentCell student={student} /></td>
                  <td>{student.id}</td>
                  <td>{student.course}</td>
                  <td>{student.attended}</td>
                  <td>{student.absent}</td>
                  <td>
                    <strong style={{ color: "#d14343" }}>
                      {student.rate}%
                    </strong>
                  </td>
                </tr>
              ))}

              {lowAttendance.length === 0 && (
                <EmptyMessage>
                  {studentSummaries.length === 0
                    ? "No attendance records are available for this period."
                    : "No students are currently below the 75% threshold."}
                </EmptyMessage>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        padding: "14px 18px",
        background: "#f8fafc",
        border: "1px solid #e8edf4",
        borderRadius: "9px",
        color: "#64748b",
        fontSize: "12px",
        lineHeight: 1.6
      }}>
        Calculation: attendance percentage = (Present + Late) ÷ marked
        attendance records × 100. Unmarked dates are excluded. The 75%
        threshold is an attendance warning indicator, not an automatic
        institutional eligibility decision.
        {period === "all"
          ? " Showing all available attendance records."
          : ` Showing records from ${formatDate(cutoffKey)} to ${formatDate(todayKey)}.`}
      </div>
    </>
  );
}

// --------------------------------------------------
// DASHBOARD CHART
// --------------------------------------------------

function DashboardChart({ attendanceRecords }) {
  const today = new Date();
  const lastSevenDays = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dateKey = getLocalDateKey(date);
    const records = attendanceRecords.filter(
      record => record.date === dateKey
    );

    const marked = records.filter(record =>
      ["Present", "Absent", "Late"].includes(record.status)
    ).length;

    const attended = records.filter(record =>
      ["Present", "Late"].includes(record.status)
    ).length;

    lastSevenDays.push({
      day: date.toLocaleDateString("en-IN", { weekday: "short" }),
      attendance: marked ? Math.round((attended / marked) * 100) : 0,
      hasData: marked > 0
    });
  }

  const todayRecords = attendanceRecords.filter(
    record => record.date === getLocalDateKey()
  );

  const todayMarked = todayRecords.filter(record =>
    ["Present", "Absent", "Late"].includes(record.status)
  ).length;

  const todayAttended = todayRecords.filter(record =>
    ["Present", "Late"].includes(record.status)
  ).length;

  const todayRate = todayMarked
    ? Math.round((todayAttended / todayMarked) * 100)
    : 0;

  const chartData = lastSevenDays.filter(item => item.hasData);

  return (
    <div className="chart-card">
      <div className="section-heading">
        <div>
          <h3>Attendance Overview</h3>
          <p>Daily attendance performance for the last seven days</p>
        </div>
        <span className="filter-button">Last 7 days</span>
      </div>

      <div className="chart-summary">
        <h2>{todayRate}%</h2>
        <span className="chart-muted">today's attendance rate</span>
      </div>

      <div className="chart-container">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="attendanceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#4169e1" stopOpacity={0.23} />
                  <stop offset="100%" stopColor="#4169e1" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#edf0f5"
              />

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8993a4", fontSize: 12 }}
                dy={10}
              />

              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8993a4", fontSize: 12 }}
                tickFormatter={value => `${value}%`}
              />

              <Tooltip formatter={value => [`${value}%`, "Attendance"]} />

              <Area
                type="monotone"
                dataKey="attendance"
                stroke="#4169e1"
                strokeWidth={3}
                fill="url(#attendanceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ padding: "60px 20px" }}>
            No attendance data is available for the last seven days.
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------
// MAIN APPLICATION
// --------------------------------------------------

function App() {
  const [active, setActive] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Load students and attendance records from MongoDB.
  async function loadApplicationData(showLoader = true) {
    if (showLoader) setLoading(true);

    setPageError("");

    try {
      const [studentResult, attendanceResult] = await Promise.all([
        apiRequest("/students"),
        apiRequest("/attendance")
      ]);

      const studentList = getArrayFromResponse(studentResult, ["students"]);
      const attendanceList = getArrayFromResponse(
        attendanceResult,
        ["attendance", "records"]
      );

      setStudents(studentList.map(normalizeStudent));
      setAttendanceRecords(attendanceList.map(normalizeAttendance));
    } catch (err) {
      setPageError(
        `${err.message}. Check that the backend is running and the API URL is correct.`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadApplicationData();
  }, []);

  // Add a student to MongoDB.
  async function handleAddStudent(studentData) {
    await apiRequest("/students", {
      method: "POST",
      body: JSON.stringify(studentData)
    });

    await loadApplicationData(false);
  }

  // Update a student in MongoDB.
  async function handleUpdateStudent(oldId, studentData) {
    await apiRequest(`/students/${encodeURIComponent(oldId)}`, {
      method: "PUT",
      body: JSON.stringify(studentData)
    });

    await loadApplicationData(false);
  }

  // Delete a student from MongoDB.
  async function handleDeleteStudent(id) {
    await apiRequest(`/students/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    await loadApplicationData(false);
  }

  // Save one attendance record. The backend upserts by student and date.
  async function handleMarkStudent(record) {
    await apiRequest("/attendance", {
      method: "POST",
      body: JSON.stringify(record)
    });

    await loadApplicationData(false);
  }

  // Save attendance for all students for the selected date.
  async function handleMarkAll(studentList, date, status) {
    const time = getAttendanceTime(status);

    await Promise.all(
      studentList.map(student =>
        apiRequest("/attendance", {
          method: "POST",
          body: JSON.stringify({
            studentId: student.id,
            date,
            status,
            time
          })
        })
      )
    );

    await loadApplicationData(false);
  }

  const todayKey = getLocalDateKey();

  const todayRecords = attendanceRecords.filter(
    record => record.date === todayKey
  );

  const presentToday = todayRecords.filter(
    record => record.status === "Present"
  ).length;

  const absentToday = todayRecords.filter(
    record => record.status === "Absent"
  ).length;

  const lateToday = todayRecords.filter(
    record => record.status === "Late"
  ).length;

  const markedToday = presentToday + absentToday + lateToday;

  const attendanceRate = markedToday
    ? Math.round(((presentToday + lateToday) / markedToday) * 100)
    : 0;

  const dashboardStats = [
    {
      title: "Total Students",
      value: students.length.toLocaleString("en-IN"),
      change: "",
      positive: true,
      description: "registered students",
      icon: Users,
      color: "blue"
    },
    {
      title: "Present Today",
      value: presentToday.toLocaleString("en-IN"),
      change: "",
      positive: true,
      description: "marked present",
      icon: UserCheck,
      color: "green"
    },
    {
      title: "Absent Today",
      value: absentToday.toLocaleString("en-IN"),
      change: "",
      positive: false,
      description: "marked absent",
      icon: UserX,
      color: "red"
    },
    {
      title: "Attendance Rate",
      value: `${attendanceRate}%`,
      change: "",
      positive: true,
      description: "of marked records",
      icon: ChartNoAxesCombined,
      color: "purple"
    }
  ];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="app-layout">
      <Sidebar
        active={active}
        setActive={setActive}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <h1>{active}</h1>
              <p>Welcome back! Here's what's happening today.</p>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="date-display">
              <CalendarDays size={17} />
              <span>{today}</span>
            </div>

            <button className="notification-button">
              <Bell size={19} />
              <span />
            </button>

            <div className="topbar-avatar">AD</div>
          </div>
        </header>

        <div className="dashboard-content">
          {loading ? (
            <div className="table-card" style={{ padding: "35px" }}>
              <h3>Connecting to AttendX database...</h3>
              <p>Loading students and attendance records.</p>
            </div>
          ) : pageError ? (
            <div className="table-card" style={{ padding: "25px" }}>
              <h3>Unable to load dashboard data</h3>
              <p style={{ color: "#d14343", margin: "12px 0" }}>
                {pageError}
              </p>
              <button
                className="primary-button"
                onClick={() => loadApplicationData()}
              >
                Retry connection
              </button>
            </div>
          ) : (
            <>
              {active === "Students" ? (
                <StudentManagement
                  students={students}
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                />
              ) : active === "Attendance" ? (
                <AttendanceManagement
                  students={students}
                  attendanceRecords={attendanceRecords}
                  onMarkStudent={handleMarkStudent}
                  onMarkAll={handleMarkAll}
                />
              ) : active === "Records" ? (
                <AttendanceRecords
                  students={students}
                  attendanceRecords={attendanceRecords}
                />
              ) : active === "Analytics" ? (
                <Analytics
                  students={students}
                  attendanceRecords={attendanceRecords}
                />
              ) : active === "Dashboard" ? (
                <>
                  <PageIntro
                    title="Dashboard Overview"
                    description="Here's your classroom attendance summary."
                  >
                    <button
                      className="primary-button"
                      onClick={() => setActive("Attendance")}
                    >
                      <Plus size={17} />
                      Mark Attendance
                    </button>
                  </PageIntro>

                  <section className="stats-grid">
                    {dashboardStats.map(item => (
                      <StatCard key={item.title} item={item} />
                    ))}
                  </section>

                  <section className="dashboard-middle">
                    <DashboardChart attendanceRecords={attendanceRecords} />

                    <div className="overview-card">
                      <div className="section-heading">
                        <div>
                          <h3>Today's Summary</h3>
                          <p>Attendance breakdown</p>
                        </div>
                        <MoreHorizontal size={20} />
                      </div>

                      <div
                        className="attendance-ring"
                        style={{
                          background: `conic-gradient(#4169e1 ${attendanceRate}%, #edf0f5 0)`
                        }}
                      >
                        <div className="ring-inner">
                          <h2>{attendanceRate}%</h2>
                          <span>Attended</span>
                        </div>
                      </div>

                      <div className="summary-list">
                        <div>
                          <span className="legend-dot present-dot" />
                          Present
                          <strong>{presentToday}</strong>
                        </div>
                        <div>
                          <span className="legend-dot absent-dot" />
                          Absent
                          <strong>{absentToday}</strong>
                        </div>
                        <div>
                          <span className="legend-dot late-dot" />
                          Late
                          <strong>{lateToday}</strong>
                        </div>
                      </div>

                      <div className="summary-total">
                        <span>Total enrolled students</span>
                        <strong>{students.length}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="bottom-grid">
                    <RecentAttendance
                      students={students}
                      attendanceRecords={attendanceRecords}
                      onViewAll={() => setActive("Records")}
                    />

                    <div className="insight-card">
                      <div className="section-heading">
                        <div>
                          <h3>Quick Insights</h3>
                          <p>Classroom highlights</p>
                        </div>
                        <ChartNoAxesCombined size={20} color="#4169e1" />
                      </div>

                      <div className="insight-item">
                        <div className="insight-icon green">
                          <UserCheck size={19} />
                        </div>
                        <div>
                          <strong>Present students</strong>
                          <p>{presentToday} students marked present today.</p>
                        </div>
                      </div>

                      <div className="insight-item">
                        <div className="insight-icon orange">
                          <Clock3 size={19} />
                        </div>
                        <div>
                          <strong>Late arrivals</strong>
                          <p>{lateToday} students marked late today.</p>
                        </div>
                      </div>

                      <div className="insight-item">
                        <div className="insight-icon purple">
                          <Users size={19} />
                        </div>
                        <div>
                          <strong>Attendance pending</strong>
                          <p>
                            {Math.max(students.length - markedToday, 0)}
                            {" "}students still need attendance marking.
                          </p>
                        </div>
                      </div>

                      <button
                        className="insight-link"
                        onClick={() => setActive("Analytics")}
                      >
                        View detailed analytics →
                      </button>
                    </div>
                  </section>
                </>
              ) : (
                <div className="table-card placeholder-page">
                  <h2>{active}</h2>
                  <p>
                    This section is not connected to a feature yet.
                  </p>
                </div>
              )}
            </>
          )}

          <footer className="footer">
            <span>
              © 2026 AttendX. Student Attendance Management System.
            </span>
            <span>Made for smarter classrooms.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;