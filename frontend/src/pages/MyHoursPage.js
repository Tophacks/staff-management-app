import { useCallback, useEffect, useMemo, useState } from "react";
import { getHoursMe, addHoursMe } from "../api/staffApi";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";

export default function MyHoursPage() {
  const [hoursLog, setHoursLog] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [error, setError] = useState("");

  const loadHours = useCallback(async () => {
    try {
      setError("");
      const params = {};
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const res = await getHoursMe(params);
      setHoursLog(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.status === 401 ? "Please log in again" : err.response?.status === 403 ? "Access denied" : err.message || "Failed to load hours. Is the backend running on port 5000?";
      setError(msg);
    }
  }, [filterFrom, filterTo]);

  useEffect(() => {
    loadHours();
  }, [loadHours]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!date || hours === "" || Number(hours) < 0) {
      setError("Enter date and hours");
      return;
    }
    try {
      await addHoursMe({ date, hours: Number(hours), notes });
      loadHours();
      setHours("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to log hours");
    }
  };

  const pendingCount = hoursLog.filter((h) => (h.status || "pending") === "pending").length;
  const approvedCount = hoursLog.filter((h) => h.status === "approved").length;
  const disapprovedCount = hoursLog.filter((h) => h.status === "disapproved").length;
  const totalLogged = useMemo(
    () => hoursLog.reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0),
    [hoursLog]
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Logged" value={totalLogged.toFixed(1)} hint="Hours currently on your record" tone="navy" icon={<span className="text-lg">🗂️</span>} />
        <StatCard title="Pending" value={pendingCount} hint="Waiting on manager approval" tone="amber" icon={<span className="text-lg">🟡</span>} />
        <StatCard title="Approved" value={approvedCount} hint="Ready for payroll processing" tone="green" icon={<span className="text-lg">✅</span>} />
        <StatCard title="Denied" value={disapprovedCount} hint="Needs review or correction" tone="rose" icon={<span className="text-lg">🔴</span>} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-['Syne'] text-xl font-semibold text-slate-950">Log New Hours</h2>
            <p className="mt-1 text-sm text-slate-500">Submit time entries cleanly and keep your approvals moving.</p>
          </div>

          <form onSubmit={handleAdd} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <input
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Hours"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <input
              placeholder="Add notes for context"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
            >
              Submit hours
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-['Syne'] text-xl font-semibold text-slate-950">Hours Activity</h2>
              <p className="mt-1 text-sm text-slate-500">Track approvals and view your recent submissions.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </div>
          </div>

          {hoursLog.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
              No hours logged yet. Submit your first entry to start building your timeline.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Hours</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hoursLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{entry.date}</td>
                      <td className="px-4 py-4 text-right text-slate-700">{entry.hours}</td>
                      <td className="px-4 py-4 text-slate-600">{entry.notes || "No notes added"}</td>
                      <td className="px-4 py-4">
                        <Badge status={entry.status || "pending"}>
                          {(entry.status || "pending") === "approved"
                            ? "Approved"
                            : (entry.status || "pending") === "disapproved"
                              ? "Denied"
                              : "Pending"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
