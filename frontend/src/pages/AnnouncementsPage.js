import { useEffect, useMemo, useState } from "react";
import { createAnnouncement, getAnnouncements } from "../api/staffApi";
import { useAuth } from "../context/AuthContext";

export default function AnnouncementsPage() {
  const { isManager } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("company");
  const [departmentsText, setDepartmentsText] = useState("");
  const [error, setError] = useState("");

  const departmentOptions = useMemo(
    () => ["Operations", "Sales", "Support", "HR", "Finance"],
    []
  );

  const loadAnnouncements = async () => {
    try {
      const res = await getAnnouncements();
      setAnnouncements(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load announcements");
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const departments = audience === "department"
        ? departmentsText.split(",").map((item) => item.trim()).filter(Boolean)
        : [];
      await createAnnouncement({ title, message, audience, departments });
      setTitle("");
      setMessage("");
      setAudience("company");
      setDepartmentsText("");
      loadAnnouncements();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create announcement");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h1>Announcements</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Company and team updates for staff.
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {isManager && (
        <form onSubmit={handleSubmit} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h2 style={{ marginTop: 0 }}>Post announcement</h2>
          <div style={{ display: "grid", gap: 10 }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" style={{ padding: 8 }} />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={5} style={{ padding: 8 }} />
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ padding: 8, maxWidth: 220 }}>
              <option value="company">Company-wide</option>
              <option value="department">Team / department</option>
            </select>
            {audience === "department" && (
              <>
                <input
                  value={departmentsText}
                  onChange={(e) => setDepartmentsText(e.target.value)}
                  placeholder={`Departments (comma-separated), e.g. ${departmentOptions.join(", ")}`}
                  style={{ padding: 8 }}
                />
                <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
                  Example departments: {departmentOptions.join(", ")}
                </p>
              </>
            )}
            <button type="submit" style={{ width: 180 }}>Post Announcement</button>
          </div>
        </form>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {announcements.length === 0 ? (
          <p style={{ color: "#666" }}>No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{announcement.title}</strong>
                <span style={{ color: "#666", fontSize: 14 }}>
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ marginBottom: 8 }}>{announcement.message}</p>
              <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
                {announcement.audience === "company"
                  ? "Company-wide"
                  : `Departments: ${announcement.departments.join(", ")}`}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
