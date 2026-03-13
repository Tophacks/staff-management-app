import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAnnouncements, getHours, getHoursMe, getNotifications, getStaff } from "../api/staffApi";
import AIInsights from "../components/AIInsights";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";

export default function DashboardPage() {
  const { user, isManager } = useAuth();
  const [staffCount, setStaffCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [hoursThisWeek, setHoursThisWeek] = useState(0);
  const [payrollThisMonth, setPayrollThisMonth] = useState(0);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const requests = [getAnnouncements(), getNotifications()];
        if (isManager) {
          requests.push(getStaff(), getHours(), getHours({ status: "pending" }));
        } else {
          requests.push(getHoursMe());
        }
        const results = await Promise.all(requests);
        setAnnouncements(Array.isArray(results[0].data) ? results[0].data.slice(0, 3) : []);
        setNotifications(Array.isArray(results[1].data) ? results[1].data.slice(0, 4) : []);
        if (isManager) {
          const staffList = Array.isArray(results[2].data) ? results[2].data : [];
          const allHours = Array.isArray(results[3].data) ? results[3].data : [];
          const pendingHours = Array.isArray(results[4].data) ? results[4].data : [];
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 6);
          weekStart.setHours(0, 0, 0, 0);

          setStaffCount(staffList.length);
          setPendingCount(pendingHours.length);
          setHoursThisWeek(
            allHours
              .filter((entry) => new Date(entry.date) >= weekStart)
              .reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0)
          );
          setPayrollThisMonth(
            staffList.reduce((sum, person) => sum + ((Number(person.salary) || 0) / 12), 0)
          );
        } else {
          const myHours = Array.isArray(results[2].data) ? results[2].data : [];
          setHoursThisWeek(myHours.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0));
          setPendingCount(myHours.filter((entry) => entry.status === "pending").length);
        }
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load dashboard data");
      }
    };
    load();
  }, [isManager]);

  const welcomeMessage = useMemo(() => {
    return isManager
      ? `Good to see you, ${user?.name}. Your team workspace is up to date.`
      : `Welcome back, ${user?.name}. Here’s what needs your attention today.`;
  }, [isManager, user?.name]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-600">Today</p>
            <h2 className="mt-2 font-['Syne'] text-3xl font-bold text-slate-950">{welcomeMessage}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review team activity, stay ahead of approvals, and keep everyone aligned with a polished daily operating view.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notifications.filter((item) => !item.read).length} unread notifications
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={isManager ? "Total Staff" : "Hours Logged"}
          value={isManager ? staffCount : hoursThisWeek.toFixed(1)}
          hint={isManager ? "Active people in your workspace" : "All hours currently on record"}
          tone="navy"
          icon={<span className="text-lg">👥</span>}
        />
        <StatCard
          title="Hours This Week"
          value={hoursThisWeek.toFixed(1)}
          hint="Current week activity"
          tone="green"
          icon={<span className="text-lg">⏱️</span>}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          hint={isManager ? "Awaiting manager action" : "Awaiting review"}
          tone="amber"
          icon={<span className="text-lg">🟡</span>}
        />
        <StatCard
          title={isManager ? "Payroll This Month" : "Workspace Updates"}
          value={isManager ? `$${Math.round(payrollThisMonth).toLocaleString()}` : announcements.length}
          hint={isManager ? "Estimated salary run rate" : "Recent announcements visible to you"}
          tone="rose"
          icon={<span className="text-lg">💸</span>}
        />
      </div>

      {isManager && <AIInsights />}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-['Syne'] text-xl font-semibold text-slate-950">Company Updates</h3>
              <p className="mt-1 text-sm text-slate-500">Announcements your team should see right away.</p>
            </div>
            <Link to="/announcements" className="text-sm font-medium text-slate-700 transition hover:text-slate-950">
              View all
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              No announcements have been posted yet. When your team shares updates, they’ll appear here.
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
                    <Badge status={announcement.audience === "company" ? "approved" : "pending"}>
                      {announcement.audience === "company" ? "Company-wide" : "Team update"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{announcement.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-['Syne'] text-xl font-semibold text-slate-950">Notifications Center</h3>
              <p className="mt-1 text-sm text-slate-500">Important system activity across your workspace.</p>
            </div>
            <Link to="/notifications" className="text-sm font-medium text-slate-700 transition hover:text-slate-950">
              Open
            </Link>
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              You’re all caught up. New alerts and approval updates will land here.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                    </div>
                    <Badge status={notification.read ? "approved" : "pending"}>
                      {notification.read ? "Read" : "Unread"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
