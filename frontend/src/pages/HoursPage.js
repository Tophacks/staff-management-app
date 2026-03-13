import { useCallback, useEffect, useState } from "react";
import { getStaff, getHours, addHours, patchHours } from "../api/staffApi";
import AIInsights from "../components/AIInsights";
import Badge from "../components/Badge";
import StatCard from "../components/StatCard";

export default function HoursPage() {
  const [staff, setStaff] = useState([]);
  const [hoursLog, setHoursLog] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");
  const [filterStaffId, setFilterStaffId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    try {
      const res = await getStaff();
      setStaff(res.data);
      if (res.data.length && !staffId) setStaffId(String(res.data[0].id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load staff");
    }
  }, [staffId]);

  const loadHours = useCallback(async () => {
    try {
      setError("");
      const params = {};
      if (filterStaffId) params.staffId = filterStaffId;
      if (filterFrom) params.from = filterFrom;
      if (filterTo) params.to = filterTo;
      const res = await getHours(params);
      setHoursLog(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.status === 401 ? "Please log in again" : err.response?.status === 403 ? "Manager access required" : err.message || "Failed to load hours. Is the backend running on port 5000?";
      setError(msg);
    }
  }, [filterFrom, filterStaffId, filterTo]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  useEffect(() => {
    loadHours();
  }, [loadHours]);

  useEffect(() => {
    const loadPending = async () => {
      try {
        const res = await getHours({ status: "pending" });
        setPendingCount(res.data.length);
      } catch {
        setPendingCount(0);
      }
    };
    loadPending();
  }, [hoursLog]);

  const handleSetStatus = async (entryId, status) => {
    try {
      await patchHours(entryId, status);
      await loadHours();
      const res = await getHours({ status: "pending" });
      setPendingCount(res.data.length);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update status");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    if (!staffId || !date || hours === "" || Number(hours) < 0) {
      setError("Select staff, date and enter hours");
      return;
    }
    try {
      await addHours({
        staffId: String(staffId),
        date,
        hours: Number(hours),
        notes,
      });
      await loadHours();
      setHours("");
      setNotes("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to log hours");
    }
  };

  const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));
  const pendingEntries = hoursLog.filter((entry) => (entry.status || "pending") === "pending");
  const approvedHours = hoursLog
    .filter((entry) => entry.status === "approved")
    .reduce((sum, entry) => sum + (Number(entry.hours) || 0), 0);

  return (
    <div className="space-y-6">
      <AIInsights />

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending Approvals" value={pendingCount} hint="Needs manager review" tone="amber" icon={<span className="text-lg">🟡</span>} />
        <StatCard title="Approved Hours" value={approvedHours.toFixed(1)} hint="Approved in current results" tone="green" icon={<span className="text-lg">✅</span>} />
        <StatCard title="Tracked People" value={staff.length} hint="Visible in staff list" tone="navy" icon={<span className="text-lg">👥</span>} />
        <StatCard title="Entries Loaded" value={hoursLog.length} hint="Current filtered results" tone="rose" icon={<span className="text-lg">📋</span>} />
      </div>

      {pendingEntries.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-['Syne'] text-xl font-semibold text-slate-950">Approval Queue</h2>
              <p className="mt-1 text-sm text-slate-500">Fast review cards for time entries that still need a decision.</p>
            </div>
            <Badge status="pending">{pendingEntries.length} pending</Badge>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {pendingEntries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">{staffById[entry.staffId]?.name ?? entry.staffId}</h3>
                    <p className="mt-1 text-sm text-slate-500">{entry.date}</p>
                  </div>
                  <Badge status="pending">Pending</Badge>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Hours:</span> {entry.hours}</p>
                  <p><span className="font-medium text-slate-900">Notes:</span> {entry.notes || "No notes added"}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(entry.id, "approved")}
                    className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(entry.id, "disapproved")}
                    className="inline-flex items-center rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
            No approvals are waiting right now. When staff submit new time entries, they’ll appear here.
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-['Syne'] text-xl font-semibold text-slate-950">Log Hours for Staff</h2>
            <p className="mt-1 text-sm text-slate-500">Create approved entries on behalf of staff when needed.</p>
          </div>

          <form onSubmit={handleAdd} className="grid gap-4">
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
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
              placeholder="Internal notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
            >
              Add approved hours
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-['Syne'] text-xl font-semibold text-slate-950">Hours Log</h2>
              <p className="mt-1 text-sm text-slate-500">Filter by staff and date to review submission history.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filterStaffId}
                onChange={(e) => setFilterStaffId(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">All staff</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
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
              No hours entries match this filter set. Try adjusting staff or date filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Staff</th>
                    <th className="px-4 py-3 text-right font-medium">Hours</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hoursLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-4 py-4 font-medium text-slate-900">{entry.date}</td>
                      <td className="px-4 py-4 text-slate-700">{staffById[entry.staffId]?.name ?? entry.staffId}</td>
                      <td className="px-4 py-4 text-right text-slate-700">{entry.hours}</td>
                      <td className="px-4 py-4 text-slate-600">{entry.notes || "No notes added"}</td>
                      <td className="px-4 py-4">
                        <Badge status={entry.status || "pending"}>
                          {(entry.status || "pending") === "disapproved" ? "Denied" : entry.status || "Pending"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {(entry.status || "pending") === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetStatus(entry.id, "approved")}
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStatus(entry.id, "disapproved")}
                              className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
                            >
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">No action needed</span>
                        )}
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
