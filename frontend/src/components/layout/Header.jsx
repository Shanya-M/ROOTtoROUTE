import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Sprout, Home, LayoutDashboard, BookOpen, LogIn, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const linkClass = ({ isActive }) =>
  `relative px-3 py-2 text-sm tracking-wide flex items-center gap-2 transition-colors ${
    isActive ? "text-[#9EB27A]" : "text-[#A69A92] hover:text-[#E8E4DB]"
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl bg-[#1C1614]/85 border-b border-[#433530]"
      data-testid="site-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-3" data-testid="brand-link">
          <span className="w-9 h-9 rounded-full bg-[#9EB27A]/15 border border-[#9EB27A]/40 grid place-items-center">
            <Sprout className="w-4 h-4 text-[#9EB27A]" />
          </span>
          <div className="leading-none">
            <div className="font-serif text-xl text-[#E8E4DB]">Root to Route</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#CBA279]">Beginner Arable Guide</div>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={linkClass} data-testid="nav-home">
            <Home className="w-4 h-4" /> Home
          </NavLink>
          <NavLink to="/dashboard" className={linkClass} data-testid="nav-dashboard">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </NavLink>
          <NavLink to="/guide" className={linkClass} data-testid="nav-guide">
            <BookOpen className="w-4 h-4" /> Guide
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          {user && user.email ? (
            <>
              <span className="hidden sm:flex items-center gap-2 text-sm text-[#A69A92]" data-testid="user-greeting">
                <UserCircle2 className="w-4 h-4 text-[#CBA279]" />
                {user.name || user.email}
              </span>
              <button
                onClick={async () => { await logout(); navigate("/"); }}
                className="rtr-btn-ghost text-sm"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 inline mr-1" /> Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className="rtr-btn-primary text-sm" data-testid="header-login-link">
              <LogIn className="w-4 h-4 inline mr-1" /> Sign in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
