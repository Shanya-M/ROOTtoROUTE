import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sprout, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register, formatApiErrorDetail } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(email, password, name);
      toast.success("Account ready. Let's grow.");
      nav("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20" data-testid="register-page">
      <div className="rtr-card rtr-grain p-8 rtr-anim-in">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-10 h-10 rounded-full bg-[#CBA279]/15 border border-[#CBA279]/40 grid place-items-center">
            <Sprout className="w-5 h-5 text-[#CBA279]" />
          </span>
          <div>
            <div className="font-serif text-2xl text-[#E8E4DB]">Start your farm journal</div>
            <div className="text-xs text-[#A69A92]">It only takes a minute</div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#CBA279] mb-2 block">Name</label>
            <input data-testid="register-name-input" value={name} onChange={(e) => setName(e.target.value)} className="rtr-input" placeholder="Your name" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#CBA279] mb-2 block">Email</label>
            <input data-testid="register-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="rtr-input" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-[#CBA279] mb-2 block">Password</label>
            <input data-testid="register-password-input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="rtr-input" placeholder="At least 6 characters" />
          </div>
          <button type="submit" disabled={busy} className="rtr-btn-primary w-full mt-2" data-testid="register-submit-btn">
            {busy ? "Creating…" : (<>Create account <ArrowRight className="w-4 h-4 inline ml-1" /></>)}
          </button>
        </form>
        <div className="text-sm text-[#A69A92] mt-6 text-center">
          Already farming with us?{" "}
          <Link to="/login" className="text-[#9EB27A] hover:text-[#B4C890]" data-testid="register-login-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
