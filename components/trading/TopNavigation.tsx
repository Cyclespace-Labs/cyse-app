"use client";

import { Search, Bell, Settings, Globe } from "lucide-react";

const navItems = [
  { label: "Spot", active: false },
  { label: "Futures", active: true },
  { label: "Lend", active: false },
  { label: "Vault", active: false },
  { label: "BP", active: false },
  { label: "More", active: false, hasDropdown: true },
];

export default function TopNavigation() {
  return (
    <header className="flex items-center justify-between h-12 px-4 bg-[#0b0b0e] border-b border-[#1c1c28]">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-1">
        {/* Backpack Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-6 h-6 rounded bg-white/90 flex items-center justify-center">
            <span className="text-black text-xs font-bold">B</span>
          </div>
          <span className="text-white text-sm font-semibold tracking-wide">Backpack</span>
        </div>

        {/* Nav Items */}
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`px-3 py-1.5 text-[13px] rounded transition-colors ${
              item.active
                ? "text-white bg-[#1c1c28]"
                : "text-[#8a8a9a] hover:text-white hover:bg-[#1c1c28]/50"
            }`}
          >
            {item.label}
            {item.hasDropdown && (
              <span className="ml-1 text-[10px]">▾</span>
            )}
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button title="Search" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Search size={16} />
        </button>
        <button title="Language" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Globe size={16} />
        </button>
        <button title="Notifications" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Bell size={16} />
        </button>
        <button title="Settings" className="p-1.5 text-[#8a8a9a] hover:text-white transition-colors">
          <Settings size={16} />
        </button>
        <button className="ml-2 px-4 py-1.5 text-[13px] text-white border border-[#2a2a3a] rounded hover:bg-[#1c1c28] transition-colors">
          Log in
        </button>
        <button className="px-4 py-1.5 text-[13px] text-black bg-white rounded font-medium hover:bg-gray-200 transition-colors">
          Sign up
        </button>
      </div>
    </header>
  );
}
