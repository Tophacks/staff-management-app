import { useCallback, useEffect, useMemo, useState } from "react";
import { getStaff, addStaff, deleteStaff } from "../api/staffApi";
import { useAuth } from "../context/AuthContext";
import StaffCard from "../components/StaffCard";
import StatCard from "../components/StatCard";

export default function StaffPage() {
  const { isManager } = useAuth();
  const [staff, setStaff] = useState([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salary, setSalary] = useState("");
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    try {
      const res = await getStaff();
      setStaff(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load staff");
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

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

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from staff? Their hours will be deleted.`)) return;
    setError("");
    try {
      await deleteStaff(id);
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove staff");
    }
  };

  const totalManagers = useMemo(
    () => staff.filter((member) => member.role === "Manager").length,
    [staff]
  );

  const totalEmployees = useMemo(
    () => staff.filter((member) => member.role !== "Manager").length,
    [staff]
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="People" value={staff.length} hint="Total staff in directory" tone="navy" icon={<span className="text-lg">👥</span>} />
        <StatCard title="Managers" value={totalManagers} hint="Team leads and approvers" tone="green" icon={<span className="text-lg">🧭</span>} />
        <StatCard title="Employees" value={totalEmployees} hint="Active contributors" tone="amber" icon={<span className="text-lg">✨</span>} />
      </div>

      {isManager && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-['Syne'] text-xl font-semibold text-slate-950">Add Staff Member</h2>
            <p className="mt-1 text-sm text-slate-500">Create a new account with role, credentials, and compensation details.</p>
          </div>

          <form onSubmit={handleAdd} className="grid gap-4 lg:grid-cols-6">
            <input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 lg:col-span-2"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              <option value="Employee">Employee</option>
              <option value="Manager">Manager</option>
            </select>
            <input
              type="email"
              placeholder="Work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 lg:col-span-2"
            />
            <input
              type="password"
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <input
              type="number"
              placeholder="Salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              min="0"
              step="1000"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <div className="lg:col-span-6">
              <button
                type="submit"
                className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
              >
                Add staff member
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-['Syne'] text-xl font-semibold text-slate-950">
              {isManager ? "Staff Directory" : "Team Directory"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isManager
                ? "Quickly open employee records, review compensation visibility, and manage your people."
                : "See who’s on the team and reach the right person faster."}
            </p>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
            No staff profiles found yet. New team members will appear here once they’re added.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {staff.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                isManager={isManager}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
