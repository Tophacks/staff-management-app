import { useState } from "react";

export default function TimeOffPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!from || !to) {
      setMessage("Please enter start and end date.");
      return;
    }
    setMessage("Time off request submitted (demo – no backend yet). Your manager will be notified when this feature is connected.");
    setFrom("");
    setTo("");
    setReason("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Time off</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        Request time off. Requests are visible to your manager once submitted.
      </p>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Reason (optional)</label>
          <input
            type="text"
            placeholder="e.g. Vacation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ padding: 8, width: "100%" }}
          />
        </div>
        <button type="submit" style={{ padding: "8px 16px" }}>Submit request</button>
      </form>
      {message && (
        <p style={{ marginTop: 16, color: "#066", maxWidth: 400 }}>{message}</p>
      )}
    </div>
  );
}
