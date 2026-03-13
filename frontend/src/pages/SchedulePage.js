import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getShifts, addShift, deleteShift, getStaff } from "../api/staffApi";
import ShiftCard from "../components/ShiftCard";

function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, n) {
  const out = new Date(date);
  out.setDate(out.getDate() + n);
  return out;
}

export default function SchedulePage() {
  const { isManager } = useAuth();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [title, setTitle] = useState("");

  const weekEnd = addDays(weekStart, 6);
  const from = formatDateKey(weekStart);
  const to = formatDateKey(weekEnd);

  useEffect(() => {
    const load = async () => {
      setError("");
      try {
        const res = await getShifts({ from, to });
        setShifts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load shifts");
      }
    };
    load();
  }, [from, to]);

  useEffect(() => {
    if (!isManager) return;
    getStaff()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setStaff(list);
        if (list.length && !staffId) setStaffId(String(list[0].id));
      })
      .catch(() => {});
  }, [isManager, staffId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!staffId || !date) {
      setError("Staff and date required");
      return;
    }
    setError("");
    try {
      await addShift({ staffId, date, startTime, endTime, title });
      const res = await getShifts({ from, to });
      setShifts(Array.isArray(res.data) ? res.data : []);
      setDate("");
      setTitle("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add shift");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this shift?")) return;
    setError("");
    try {
      await deleteShift(id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete shift");
    }
  };

  const shiftsByDate = {};
  shifts.forEach((s) => {
    if (!shiftsByDate[s.date]) shiftsByDate[s.date] = [];
    shiftsByDate[s.date].push(s);
  });

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Schedule</h1>
      <p style={{ color: "#666", marginBottom: 16 }}>
        {isManager ? "View and manage shifts for the week." : "View your shifts for the week."}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setWeekStart((prev) => addDays(prev, -7))}
          style={{ padding: "6px 12px" }}
        >
          ← Previous week
        </button>
        <span style={{ fontWeight: "bold", minWidth: 220 }}>
          {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <button
          type="button"
          onClick={() => setWeekStart((prev) => addDays(prev, 7))}
          style={{ padding: "6px 12px" }}
        >
          Next week →
        </button>
      </div>

      {error && <p style={{ color: "crimson", marginBottom: 8 }}>{error}</p>}

      {isManager && (
        <form onSubmit={handleAdd} style={{ marginBottom: 24, padding: 16, border: "1px solid #eee", borderRadius: 8, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <h3 style={{ width: "100%", margin: "0 0 8px" }}>Add shift</h3>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            style={{ padding: 8 }}
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            type="text"
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 8, width: 140 }}
          />
          <button type="submit">Add</button>
        </form>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
        {weekDays.map((day) => {
          const key = formatDateKey(day);
          const dayShifts = shiftsByDate[key] || [];
          return (
            <div
              key={key}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                minHeight: 120,
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 8, fontSize: 14 }}>
                {day.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" })}
              </div>
              {dayShifts.map((shift) => (
                <div key={shift.id} style={{ marginBottom: 8 }}>
                  <ShiftCard
                    date={shift.date}
                    startTime={shift.startTime}
                    endTime={shift.endTime}
                    role={isManager ? shift.staffName : null}
                    title={shift.title || "Shift"}
                  />
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => handleDelete(shift.id)}
                      style={{ marginTop: 4, padding: "2px 8px", fontSize: 12, color: "#c00", border: "1px solid #c00", background: "#fff" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
