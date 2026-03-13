import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStaff, getHours } from "../api/staffApi";

export default function PayrollPage() {
  const { isManager } = useAuth();
  const [staff, setStaff] = useState([]);
  const [totalsByStaff, setTotalsByStaff] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isManager) return;
    const load = async () => {
      try {
        const [staffRes, hoursRes] = await Promise.all([
          getStaff(),
          getHours({ status: "approved" }),
        ]);
        const list = Array.isArray(staffRes.data) ? staffRes.data : [];
        setStaff(list);
        const hoursList = Array.isArray(hoursRes.data) ? hoursRes.data : [];
        const byStaff = {};
        hoursList.forEach((h) => {
          const id = h.staffId;
          if (!byStaff[id]) byStaff[id] = 0;
          byStaff[id] += Number(h.hours) || 0;
        });
        setTotalsByStaff(byStaff);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load payroll data");
      }
    };
    load();
  }, [isManager]);

  if (!isManager) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Payroll</h1>
        <p style={{ color: "#666" }}>
          Contact your manager or HR for pay stubs and pay-related questions.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Payroll overview</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Approved hours by staff (for reference). Salary is annual.
      </p>
      {error && <p style={{ color: "crimson", marginBottom: 8 }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: 8 }}>Name</th>
            <th style={{ textAlign: "left", padding: 8 }}>Role</th>
            <th style={{ textAlign: "right", padding: 8 }}>Approved hours</th>
            <th style={{ textAlign: "right", padding: 8 }}>Salary (annual)</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{s.name}</td>
              <td style={{ padding: 8 }}>{s.role}</td>
              <td style={{ padding: 8, textAlign: "right" }}>
                {(totalsByStaff[s.id] ?? 0).toFixed(1)}
              </td>
              <td style={{ padding: 8, textAlign: "right" }}>
                {s.salary != null ? `$${Number(s.salary).toLocaleString()}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
