import React from "react";

export default function Footer() {
  return (
    <footer className="border-t border-[#433530] mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-serif text-lg text-[#E8E4DB]">Root to Route</div>
        <div className="text-xs text-[#A69A92] tracking-wide">
          Grown with soil, sun and patience · © {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
