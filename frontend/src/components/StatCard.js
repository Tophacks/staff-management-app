export default function StatCard({ title, value, hint, tone = "navy", icon }) {
  const toneClasses =
    tone === "green"
      ? "from-emerald-500/10 to-emerald-500/5 text-emerald-700"
      : tone === "amber"
        ? "from-amber-500/10 to-amber-500/5 text-amber-700"
        : tone === "rose"
          ? "from-rose-500/10 to-rose-500/5 text-rose-700"
          : "from-slate-900/10 to-slate-900/5 text-slate-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 font-['Syne'] text-3xl font-bold text-slate-900">{value}</p>
          {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 ${toneClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
