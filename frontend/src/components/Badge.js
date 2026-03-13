export default function Badge({ status, children }) {
  const value = (status || children || "").toString().toLowerCase();

  const tone =
    value.includes("approve") || value.includes("active") || value.includes("low")
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : value.includes("deny") || value.includes("disapprove") || value.includes("high")
        ? "bg-rose-50 text-rose-700 ring-rose-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition ${tone}`}>
      {children || status}
    </span>
  );
}
