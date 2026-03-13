export default function ShiftCard({ date, startTime, endTime, role, title }) {
  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 8,
        marginBottom: 8,
        background: "#fff",
      }}
    >
      {title && <div style={{ fontWeight: "bold", marginBottom: 4 }}>{title}</div>}
      <div style={{ color: "#333" }}>{date}</div>
      {(startTime || endTime) && (
        <div style={{ fontSize: 14, color: "#666" }}>
          {startTime || "—"} – {endTime || "—"}
        </div>
      )}
      {role && <div style={{ fontSize: 14, color: "#888", marginTop: 4 }}>{role}</div>}
    </div>
  );
}
