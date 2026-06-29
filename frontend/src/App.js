import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Guide from "./pages/Guide";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { Toaster } from "sonner";
import "./App.css";

function Protected({ children }) {
  const { user, checking } = useAuth();
  if (checking) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-[#A69A92] text-sm" data-testid="auth-checking">
        Checking session…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: { background: "#2A221F", border: "1px solid #433530", color: "#E8E4DB" },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
