import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import StaffPage from "./pages/StaffPage";
import HoursPage from "./pages/HoursPage";
import MyHoursPage from "./pages/MyHoursPage";
import DashboardPage from "./pages/DashboardPage";
import TimeOffPage from "./pages/TimeOffPage";
import SchedulePage from "./pages/SchedulePage";
import PayrollPage from "./pages/PayrollPage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import NotificationsPage from "./pages/NotificationsPage";

function AppLayout({ title, subtitle, children, requireManager = false }) {
  return (
    <ProtectedRoute requireManager={requireManager}>
      <Layout title={title} subtitle={subtitle}>
        {children}
      </Layout>
    </ProtectedRoute>
  );
}

function App() {
  const { isManager } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <AppLayout
            title="Command Center"
            subtitle={isManager ? "Monitor staffing, approvals, payroll, and intelligent alerts in one place." : "Track your time, updates, and upcoming work from one home base."}
          >
            <DashboardPage />
          </AppLayout>
        }
      />
      <Route
        path="/"
        element={
          <AppLayout
            title={isManager ? "Staff Directory" : "Team Directory"}
            subtitle={isManager ? "Manage your people, compensation visibility, and employee records." : "Browse teammates and quickly find who to contact."}
          >
            <StaffPage />
          </AppLayout>
        }
      />
      <Route
        path="/my-hours"
        element={
          <AppLayout
            title="My Hours"
            subtitle="Log your hours, track approvals, and keep your week on schedule."
          >
            <MyHoursPage />
          </AppLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <AppLayout
            title="My Profile"
            subtitle="Review your record, documents, and employment details."
          >
            <EmployeeProfilePage />
          </AppLayout>
        }
      />
      <Route
        path="/employees/:id"
        element={
          <AppLayout
            title="Employee Record"
            subtitle="Access documents, contact details, job information, and manager notes."
          >
            <EmployeeProfilePage />
          </AppLayout>
        }
      />
      <Route
        path="/announcements"
        element={
          <AppLayout
            title="Announcements"
            subtitle="Broadcast company-wide or team-specific updates."
          >
            <AnnouncementsPage />
          </AppLayout>
        }
      />
      <Route
        path="/notifications"
        element={
          <AppLayout
            title="Notifications"
            subtitle="Stay on top of approvals, updates, and operational activity."
          >
            <NotificationsPage />
          </AppLayout>
        }
      />
      <Route
        path="/hours"
        element={
          <AppLayout
            requireManager
            title="Manage Hours"
            subtitle="Review submissions, approve time quickly, and track operational insights."
          >
            <HoursPage />
          </AppLayout>
        }
      />
      <Route
        path="/schedule"
        element={
          <AppLayout
            title="Schedule"
            subtitle="Coordinate shifts and keep the team aligned week to week."
          >
            <SchedulePage />
          </AppLayout>
        }
      />
      <Route
        path="/time-off"
        element={
          <AppLayout
            title="Time Off"
            subtitle="Plan time away and keep staffing visibility clear."
          >
            <TimeOffPage />
          </AppLayout>
        }
      />
      <Route
        path="/payroll"
        element={
          <AppLayout
            title="Payroll"
            subtitle="Review approved time and keep payroll forecasting on track."
          >
            <PayrollPage />
          </AppLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function RootApp() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  );
}
