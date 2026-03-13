import { useEffect, useState } from "react";
import { getStaff, addStaff } from "../api/staffApi";
import { useAuth } from "../context/AuthContext";

export default function StaffPage() {
  const { isManager } = useAuth();
  const [staff, setStaff] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salary, setSalary] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const res = await getStaff();
      setStaff(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load staff");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password) {
      setError("Name, email and password required");
      return;
    }
    try {
      await addStaff({
        name,
        role,
        email,
        password,
        salary: salary ? Number(salary) : 0,
      });
      loadStaff();
      setName("");
      setRole("Employee");
      setEmail("");
      setPassword("");
      setSalary("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add staff");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{isManager ? "Staff &amp; Salary" : "Staff directory"}</h1>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            <th style={{ textAlign: "left", padding: 8 }}>Name</th>
            <th style={{ textAlign: "left", padding: 8 }}>Role</th>
            <th style={{ textAlign: "left", padding: 8 }}>Email</th>
            {isManager && (
              <th style={{ textAlign: "right", padding: 8 }}>Salary</th>
            )}
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: 8 }}>{s.name}</td>
              <td style={{ padding: 8 }}>{s.role}</td>
              <td style={{ padding: 8 }}>{s.email}</td>
              {isManager && (
                <td style={{ padding: 8, textAlign: "right" }}>
                  {s.salary != null ? `$${Number(s.salary).toLocaleString()}` : "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {isManager && (
        <>
          <h2>Add Staff</h2>
          {error && <p style={{ color: "crimson", marginBottom: 8 }}>{error}</p>}
          <form onSubmit={handleAdd} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-end" }}>
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: 8 }}
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: 8 }}>
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
            </select>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 8 }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 8 }}
            />
            <input
              type="number"
              placeholder="Salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              min="0"
              step="1000"
              style={{ padding: 8, width: 100 }}
            />
            <button type="submit">Add</button>
          </form>
        </>
      )}
    </div>
  );
}
