import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/staffApi";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      authLogin(res.data.token, res.data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 font-['DM_Sans'] text-slate-900">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.28),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.18),_transparent_35%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300">
              Premium workforce operations
            </div>
            <img
              src="/staffflow-logo.png"
              alt="StaffFlow logo"
              className="mt-8 h-24 w-auto rounded-2xl border border-white/10 bg-white/5 p-2"
            />
            <h1 className="mt-8 max-w-md font-['Syne'] text-5xl font-bold leading-tight">
              Staff operations that feel built for a funded startup.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Centralize staffing, approvals, payroll visibility, records, announcements, and smart operational insights in one polished workspace.
            </p>
          </div>

          <div className="relative z-10 grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-sm text-slate-400">Demo access</p>
              <p className="mt-2 text-lg font-semibold text-white">Manager: alice@example.com</p>
              <p className="text-sm text-slate-300">Password: password123</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Hours approvals", "Records & docs", "Smart insights"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-slate-50 p-6 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <img
                  src="/staffflow-logo.png"
                  alt="StaffFlow"
                  className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-cover"
                />
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-600">StaffFlow</p>
              </div>
              <h2 className="mt-3 font-['Syne'] text-4xl font-bold text-slate-950">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to access your workspace, team updates, and operating metrics.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Work Email</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Access workspace"}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500 lg:hidden">
              Demo manager login: alice@example.com / password123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
