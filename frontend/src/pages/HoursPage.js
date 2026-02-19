import { useEffect, useState } from "react";
import { getStaff, getHours, addHours, patchHours } from "../api/staffApi";

export default function HoursPage() {
  const [staff, setStaff] = useState([]);
  const [hoursLog, setHoursLog] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [filterStaffId, setFilterStaffId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    loadHours();
  }, [filterStaffId, filterFrom, filterTo]);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const res = await getHours({ status: "pending" });
        setPendingCount(res.data.length);
      } catch {
        setPendingCount(0);
      }
    };
    loadPending();
  }, [hoursLog]);

  const loadStaff = async () => {
    try {
      const res = await getStaff();
      setStaff(res.data);
      if (res.data.length && !staffId) setStaffId(String(res.data[0].id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load staff");
    }
  };

  const loadHours = async () => {
    try {
      setError("");
      const params = {};
      if (filterStaffId) params.staffId = filterStaffId;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const res = await getHours(params);
      setHoursLog(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.status === 401 ? "Please log in again" : err.response?.status === 403 ? "Manager access required" : err.message || "Failed to load hours. Is the backend running on port 5000?";
      setError(msg);
    }
  };

  const handleSetStatus = async (entryId, status) => {
    try {
      await patchHours(entryId, status);
      loadHours();
      const res = await getHours({ status: "pending" });
      setPendingCount(res.data.length);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!staffId || !date || hours === "" || Number(hours) < 0) {
      setError("Select staff, date and enter hours");
      return;
    }
    try {
      await addHours({
        staffId: Number(staffId),
        date,
        hours: Number(hours),
        notes,
      });
      loadHours();
      setHours("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to log hours");
    }
  };

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

  return (
    <div style={{ padding: 20 }}>
      <h1>Hours Tracking (Management)</h1>

      {pendingCount > 0 && (
        <div style={{ padding: "12px 16px", marginBottom: 20, background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 6 }}>
          <strong>{pendingCount} hour{pendingCount !== 1 ? "s" : ""} pending approval</strong> — review and approve or disapprove below.
        </div>
      )}

      <h2>Log hours</h2>
      {error && <p style={{ color: "crimson", marginBottom: 8 }}>{error}</p>}
      <form onSubmit={handleAdd} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end", marginBottom: 24 }}>
        <label>
          Staff
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={{ marginLeft: 8, padding: 8 }}>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ marginLeft: 8, padding: 8 }} />
        </label>
        <label>
          Hours
          <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} style={{ marginLeft: 8, padding: 8, width: 70 }} />
        </label>
        <input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: 8, width: 120 }} />
        <button type="submit">Add</button>
      </form>

      <h2>Hours log</h2>
      <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select value={filterStaffId} onChange={(e) => setFilterStaffId(e.target.value)} style={{ padding: 6 }}>
          <option value="">All staff</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input type="date" placeholder="From" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} style={{ padding: 6 }} />
        <input type="date" placeholder="To" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} style={{ padding: 6 }} />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: 8 }}>Date</th>
            <th style={{ textAlign: "left", padding: 8 }}>Staff</th>
            <th style={{ textAlign: "right", padding: 8 }}>Hours</th>
            <th style={{ textAlign: "left", padding: 8 }}>Notes</th>
            <th style={{ textAlign: "left", padding: 8 }}>Status</th>
            <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {hoursLog.map((h) => (
            <tr key={h.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{h.date}</td>
              <td style={{ padding: 8 }}>{staffById[h.staffId]?.name ?? h.staffId}</td>
              <td style={{ padding: 8, textAlign: "right" }}>{h.hours}</td>
              <td style={{ padding: 8 }}>{h.notes || "—"}</td>
              <td style={{ padding: 8 }}>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: h.status === "approved" ? "#d4edda" : h.status === "disapproved" ? "#f8d7da" : "#e2e3e5",
                  color: h.status === "approved" ? "#155724" : h.status === "disapproved" ? "#721c24" : "#383d41",
                }}>
                  {h.status || "pending"}
                </span>
              </td>
              <td style={{ padding: 8 }}>
                {(h.status || "pending") === "pending" && (
                  <>
                    <button type="button" onClick={() => handleSetStatus(h.id, "approved")} style={{ marginRight: 8 }}>Approve</button>
                    <button type="button" onClick={() => handleSetStatus(h.id, "disapproved")}>Disapprove</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hoursLog.length === 0 && <p style={{ color: "#666" }}>No hours logged yet.</p>}
    </div>
  );
}
