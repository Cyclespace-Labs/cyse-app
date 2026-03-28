"use client";

import { useState } from "react";

const tabs = [
  "Balances",
  "Positions",
  "Open Orders",
  "Borrows",
  "TWAP",
  "Fill History",
  "Order History",
  "Position History",
  "Funding History",
];

export default function BottomTabs() {
  const [activeTab, setActiveTab] = useState("Balances");

  return (
    <div className="flex flex-col bg-[#0b0b0e] border-t border-[#1c1c28]">
      {/* Tab Header */}
      <div className="flex items-center overflow-x-auto border-b border-[#1c1c28] px-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-[12px] whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "text-white border-b-2 border-white"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex items-center justify-center h-16 text-[#5a5a6a] text-[12px]">
        <span>Connect wallet or log in to view your {activeTab.toLowerCase()}</span>
      </div>
    </div>
  );
}
