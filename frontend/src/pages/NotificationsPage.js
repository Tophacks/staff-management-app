import { useEffect, useState } from "react";
import { getNotifications, markNotificationRead } from "../api/staffApi";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load notifications");
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update notification");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900 }}>
      <h1>Notifications</h1>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Your personal notification center.
      </p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <div style={{ display: "grid", gap: 12 }}>
        {notifications.length === 0 ? (
          <p style={{ color: "#666" }}>No notifications yet.</p>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                background: item.read ? "#fafafa" : "#fffef3",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <strong>{item.title}</strong>
                <span style={{ color: "#666", fontSize: 14 }}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
              <p style={{ marginBottom: 10 }}>{item.message}</p>
              {!item.read && (
                <button type="button" onClick={() => handleRead(item.id)}>
                  Mark as read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
