import { useEffect, useMemo, useState } from "react";
import { getAIInsights } from "../api/staffApi";

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function severityClasses(level) {
  if (level === "high" || level === "High") return "border-red-200 bg-red-50 text-red-800";
  if (level === "medium" || level === "Medium") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  return "border-green-200 bg-green-50 text-green-800";
}

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dismissedAnomalies, setDismissedAnomalies] = useState([]);
  const [dismissedRisks, setDismissedRisks] = useState([]);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getAIInsights();
        setInsights(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load smart insights");
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  const visibleAnomalies = useMemo(() => {
    const anomalies = insights?.anomalies || [];
    return anomalies
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => !dismissedAnomalies.includes(index));
  }, [dismissedAnomalies, insights]);

  const visibleRisks = useMemo(() => {
    const risks = insights?.turnoverRisk || [];
    return risks
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => !dismissedRisks.includes(index));
  }, [dismissedRisks, insights]);

  const forecast = insights?.forecast;
  const payrollProgress = forecast?.projected
    ? Math.min(100, Math.round(((forecast.currentSpend || 0) / forecast.projected) * 100))
    : 0;

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">Loading Smart Insights...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Smart Insights</h2>
          <p className="text-sm text-slate-500">Intelligent Alerts and Predictive Analytics for managers.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h3 className="mb-2 text-lg font-semibold text-green-900">Weekly Summary</h3>
          <p className="whitespace-pre-wrap text-sm leading-6 text-green-900">{insights?.summary || "No summary available."}</p>
        </div>

        <div className={`rounded-xl border p-5 ${forecast?.alert ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}>
          <h3 className={`mb-3 text-lg font-semibold ${forecast?.alert ? "text-red-900" : "text-yellow-900"}`}>Payroll Forecast</h3>
          <div className={`mb-2 flex justify-between text-sm ${forecast?.alert ? "text-red-800" : "text-yellow-800"}`}>
            <span>Current spend</span>
            <span>{currency(forecast?.currentSpend)}</span>
          </div>
          <div className={`mb-2 flex justify-between text-sm ${forecast?.alert ? "text-red-800" : "text-yellow-800"}`}>
            <span>Projected month-end</span>
            <span>{currency(forecast?.projected)}</span>
          </div>
          <div className={`mb-3 flex justify-between text-sm ${forecast?.alert ? "text-red-800" : "text-yellow-800"}`}>
            <span>Change vs last month</span>
            <span>{Number(forecast?.percentChange || 0).toFixed(1)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/70">
            <div
              className={`h-full rounded-full ${forecast?.alert ? "bg-red-500" : "bg-yellow-500"}`}
              style={{ width: `${payrollProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Anomalies</h3>
          <div className="space-y-3">
            {visibleAnomalies.length === 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                No active anomaly alerts.
              </div>
            )}
            {visibleAnomalies.map(({ item, index }) => {
              return (
                <div key={`${item.employeeName}-${item.flag}-${item.date}-${index}`} className={`rounded-xl border p-4 ${severityClasses(item.severity)}`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.employeeName}</div>
                      <div className="text-sm">{item.flag}</div>
                      <div className="text-xs opacity-80">{item.date}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissedAnomalies((prev) => [...prev, index])}
                      className="rounded-md border border-current px-2 py-1 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Turnover Risk</h3>
          <div className="space-y-3">
            {visibleRisks.length === 0 && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                No turnover risk signals detected.
              </div>
            )}
            {visibleRisks.map(({ item, index }) => {
              return (
                <div key={`${item.employeeName}-${item.score}-${index}`} className={`rounded-xl border p-4 ${severityClasses(item.risk)}`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.employeeName}</div>
                      <div className="text-sm">
                        <span className="mr-2 inline-flex rounded-full border border-current px-2 py-0.5 text-xs font-semibold">
                          {item.risk}
                        </span>
                        Score {item.score}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDismissedRisks((prev) => [...prev, index])}
                      className="rounded-md border border-current px-2 py-1 text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                  <ul className="list-disc pl-5 text-sm">
                    {item.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
