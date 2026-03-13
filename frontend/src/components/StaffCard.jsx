import { Link } from "react-router-dom";

function getInitials(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function StaffCard({ staff, isManager, onRemove }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
            {getInitials(staff.name)}
          </div>
          <div>
            <h3 className="font-['Syne'] text-lg font-semibold text-slate-900">{staff.name}</h3>
            <p className="text-sm text-slate-500">{staff.role}</p>
          </div>
        </div>
        {isManager && (
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {staff.salary != null ? `$${Number(staff.salary).toLocaleString()}` : "Salary hidden"}
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <p>{staff.email}</p>
        {!isManager && <p>Internal directory access enabled</p>}
      </div>

      {isManager && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/employees/${staff.id}`}
            className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Open record
          </Link>
          <button
            type="button"
            onClick={() => onRemove(staff.id, staff.name)}
            className="inline-flex items-center rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
          >
            Remove staff
          </button>
        </div>
      )}
    </div>
  );
}
