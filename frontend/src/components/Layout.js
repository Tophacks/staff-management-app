import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { getNotifications } from "../api/staffApi";
import { useAuth } from "../context/AuthContext";

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarLink({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-white/10 text-white shadow-sm"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout({ title, subtitle, children }) {
  const { user, isManager, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await getNotifications();
        const list = Array.isArray(res.data) ? res.data : [];
        setUnreadCount(list.filter((item) => !item.read).length);
      } catch {
        setUnreadCount(0);
      }
    };

    loadNotifications();
  }, []);

  const navItems = useMemo(() => {
    const common = [
      { to: "/dashboard", label: "Dashboard", icon: <Icon path="M3 12 12 4l9 8v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /> },
      { to: "/", label: isManager ? "Staff" : "Directory", icon: <Icon path="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 7a4 4 0 1 0 0 .01M20 8v6M17 11h6" /> },
      { to: "/my-hours", label: "My Hours", icon: <Icon path="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> },
      { to: "/notifications", label: "Notifications", icon: <Icon path="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m3 0v1a2 2 0 1 1-4 0v-1m4 0H8" /> },
    ];

    if (isManager) {
      common.splice(2, 0, {
        to: "/hours",
        label: "Manage Hours",
        icon: <Icon path="M9 12h6M9 16h3M7 3h10a2 2 0 0 1 2 2v14l-4-3H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />,
      });
    }

    return common;
  }, [isManager]);

  return (
    <div className="min-h-screen bg-slate-100 font-['DM_Sans'] text-slate-900">
      <div className="lg:flex">
        <aside className="border-b border-slate-800 bg-slate-950 px-4 py-5 text-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-8 flex items-center gap-3 px-2">
            <img
              src="/staffflow-logo.png"
              alt="StaffFlow"
              className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 object-cover"
            />
            <div>
              <p className="font-['Syne'] text-xl font-bold">StaffFlow</p>
              <p className="text-sm text-slate-400">Operations hub</p>
            </div>
          </div>

          <nav className="grid gap-2 lg:gap-1">
            {navItems.map((item) => (
              <SidebarLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
          </nav>

          <div className="mt-8 lg:mt-auto lg:pt-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-bold text-white">
                  {(user?.name || "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{user?.name}</p>
                  <p className="truncate text-sm text-slate-400">{user?.role}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Link to="/profile" className="flex-1 rounded-xl border border-white/10 px-3 py-2 text-center text-sm text-slate-200 transition hover:bg-white/5">
                  Profile
                </Link>
                <button onClick={logout} className="flex-1 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
                  Log out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-['Syne'] text-2xl font-bold text-slate-950">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/notifications"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <Icon path="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m3 0v1a2 2 0 1 1-4 0v-1m4 0H8" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to={isManager ? "/announcements" : "/my-hours"}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
                >
                  {isManager ? "Create update" : "Log hours"}
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
