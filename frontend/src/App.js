import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import StaffPage from "./pages/StaffPage";
import HoursPage from "./pages/HoursPage";
import MyHoursPage from "./pages/MyHoursPage";

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div>
      <header style={{ padding: "12px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Staff Management</span>
        <span>
          {user?.name} ({user?.role})
          <button onClick={logout} style={{ marginLeft: 12 }}>Log out</button>
        </span>
      </header>
      <nav style={{ padding: "8px 20px", background: "#f5f5f5" }}>
        <Link to="/" style={{ marginRight: 16 }}>{user?.role === "Manager" ? "Staff &amp; Pay" : "Staff directory"}</Link>
        <Link to="/my-hours" style={{ marginRight: 16 }}>My Hours</Link>
        {user?.role === "Manager" && <Link to="/hours">Manage hours</Link>}
      </nav>
      {children}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout><StaffPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-hours"
            element={
              <ProtectedRoute>
                <Layout><MyHoursPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hours"
            element={
              <ProtectedRoute requireManager>
                <Layout><HoursPage /></Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
