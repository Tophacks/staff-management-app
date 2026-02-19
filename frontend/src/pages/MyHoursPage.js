import { useEffect, useState } from "react";
import { getHoursMe, addHoursMe } from "../api/staffApi";

export default function MyHoursPage() {
  const [hoursLog, setHoursLog] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [error, setError] = useState("");

  const loadHours = async () => {
    try {
      setError("");
      const params = {};
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const res = await getHoursMe(params);
      setHoursLog(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.status === 401 ? "Please log in again" : err.response?.status === 403 ? "Access denied" : err.message || "Failed to load hours. Is the backend running on port 5000?";
      setError(msg);
    }
  };

  useEffect(() => {
    loadHours();
  }, [filterFrom, filterTo]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!date || hours === "" || Number(hours) < 0) {
      setError("Enter date and hours");
      return;
    }
    try {
      await addHoursMe({ date, hours: Number(hours), notes });
      loadHours();
      setHours("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to log hours");
    }
  };

  const pendingCount = hoursLog.filter((h) => (h.status || "pending") === "pending").length;
  const approvedCount = hoursLog.filter((h) => h.status === "approved").length;
  const disapprovedCount = hoursLog.filter((h) => h.status === "disapproved").length;

  return (
    <div style={{ padding: 20 }}>
      <h1>My Hours</h1>

      <p style={{ marginBottom: 20, color: "#555" }}>
        Your logged hours are approved or disapproved by your manager. See status in the table below.
      </p>

      {(approvedCount > 0 || disapprovedCount > 0 || pendingCount > 0) && (
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          {pendingCount > 0 && <span style={{ padding: "6px 12px", background: "#e2e3e5", borderRadius: 6 }}>Pending: {pendingCount}</span>}
          {approvedCount > 0 && <span style={{ padding: "6px 12px", background: "#d4edda", color: "#155724", borderRadius: 6 }}>Approved: {approvedCount}</span>}
          {disapprovedCount > 0 && <span style={{ padding: "6px 12px", background: "#f8d7da", color: "#721c24", borderRadius: 6 }}>Disapproved: {disapprovedCount}</span>}
        </div>
      )}

      <h2>Log hours</h2>
      {error && <p style={{ color: "crimson", marginBottom: 8 }}>{error}</p>}
      <form onSubmit={handleAdd} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 24 }}>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ marginLeft: 8, padding: 8 }} />
        </label>
        <label>
          Hours
          <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} style={{ marginLeft: 8, padding: 8, width: 70 }} />
        </label>
        <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: 8, width: 140 }} />
        <button type="submit">Add</button>
      </form>

      <h2>My hours log</h2>
      <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <input type="date" placeholder="From" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={{ padding: 6 }} />
        <input type="date" placeholder="To" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={{ padding: 6 }} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: 8 }}>Date</th>
            <th style={{ textAlign: "right", padding: 8 }}>Hours</th>
            <th style={{ textAlign: "left", padding: 8 }}>Notes</th>
            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {hoursLog.map((h) => (
            <tr key={h.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{h.date}</td>
              <td style={{ padding: 8, textAlign: "right" }}>{h.hours}</td>
              <td style={{ padding: 8 }}>{h.notes || "—"}</td>
              <td style={{ padding: 8 }}>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontWeight: 500,
                  background: (h.status || "pending") === "approved" ? "#d4edda" : (h.status || "pending") === "disapproved" ? "#f8d7da" : "#e2e3e5",
                  color: (h.status || "pending") === "approved" ? "#155724" : (h.status || "pending") === "disapproved" ? "#721c24" : "#383d41",
                }}>
                  {(h.status || "pending") === "approved" ? "Approved" : (h.status || "pending") === "disapproved" ? "Disapproved" : "Pending"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hoursLog.length === 0 && <p style={{ color: "#666" }}>No hours logged yet.</p>}
    </div>
  );
}
