import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sprout, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { login, formatApiErrorDetail } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      nav("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="login-page">
      <div className="rtr-card rtr-grain p-8 rtr-anim-in">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-full bg-[#9EB27A]/15 border border-[#9EB27A]/40 grid place-items-center">
            <Sprout className="w-5 h-5 text-[#9EB27A]" />
          </span>
          <div>
            <div className="font-serif text-2xl text-[#E8E4DB]">Welcome back</div>
            <div className="text-xs text-[#A69A92]">Sign in to your plot</div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#CBA279] mb-2 block">Email</label>
            <input
              data-testid="login-email-input"
              type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="rtr-input"
              placeholder="farmer@roottoroute.app"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#CBA279] mb-2 block">Password</label>
            <input
              data-testid="login-password-input"
              type="password" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="rtr-input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={busy} className="rtr-btn-primary w-full mt-2" data-testid="login-submit-btn">
            {busy ? "Signing in…" : (<>Sign in <ArrowRight className="w-4 h-4 inline ml-1" /></>)}
          </button>
        </form>
        <div className="text-sm text-[#A69A92] mt-6 text-center">
          New here?{" "}
          <Link to="/register" className="text-[#9EB27A] hover:text-[#B4C890]" data-testid="login-register-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
