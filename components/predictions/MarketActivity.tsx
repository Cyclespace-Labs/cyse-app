"use client";

import { useState } from "react";
import { Comment, Holder, MarketActivity as MarketActivityType } from "@/types/predictions";
import { MessageSquare, Trophy, Activity, Send, ThumbsUp } from "lucide-react";

interface MarketActivityProps {
  comments: Comment[];
  topHolders: Holder[];
  recentActivity: MarketActivityType[];
}

const tabs = [
  { label: "Comments", icon: MessageSquare },
  { label: "Top Holders", icon: Trophy },
  { label: "Positions", icon: Activity },
  { label: "Activity", icon: Activity },
];

export default function MarketActivitySection({
  comments,
  topHolders,
  recentActivity,
}: MarketActivityProps) {
  const [activeTab, setActiveTab] = useState("Comments");

  return (
    <div className="bg-[#0b0b0e] border border-[#1c1c28] rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#1c1c28] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono rounded whitespace-nowrap transition-colors ${
              activeTab === tab.label
                ? "text-white bg-[#1c1c28]"
                : "text-[#5a5a6a] hover:text-[#8a8a9a]"
            }`}
          >
            <tab.icon size={12} />
            {tab.label}
            {tab.label === "Comments" && (
              <span className="text-[10px] text-[#5a5a6a]">({comments.length.toLocaleString()})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
        {activeTab === "Comments" && (
          <div>
            {/* Comment Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1c1c28]">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 bg-[#12121a] border border-[#1c1c28] rounded px-3 py-2 text-[12px] font-mono text-white outline-none placeholder:text-[#5a5a6a]"
              />
              <button
                className="p-2 text-[#5a5a6a] hover:text-[#00c076] transition-colors"
                title="Post comment"
              >
                <Send size={14} />
              </button>
            </div>

            {/* Comments List */}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 px-4 py-3 border-b border-[#1c1c28] hover:bg-[#1c1c28]/20 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#1c1c28] flex items-center justify-center text-sm shrink-0">
                  {comment.userAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-white text-[12px] font-mono font-medium">
                      {comment.userName}
                    </span>
                    <span className="text-[#5a5a6a] text-[10px] font-mono">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-[#8a8a9a] text-[12px] font-mono leading-relaxed">
                    {comment.text}
                  </p>
                  <button className="flex items-center gap-1 mt-1 text-[#5a5a6a] hover:text-[#00c076] text-[10px] font-mono transition-colors">
                    <ThumbsUp size={10} />
                    {comment.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Top Holders" && (
          <div>
            <div className="grid grid-cols-[1fr_60px_80px_80px_70px] gap-2 px-4 py-2 text-[10px] font-mono text-[#5a5a6a] border-b border-[#1c1c28]">
              <span>User</span>
              <span className="text-center">Position</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Value</span>
              <span className="text-right">P&L</span>
            </div>
            {topHolders.map((holder, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_60px_80px_80px_70px] gap-2 items-center px-4 py-2.5 border-b border-[#1c1c28] text-[11px] font-mono hover:bg-[#1c1c28]/20 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#5a5a6a] text-[10px] w-4">{i + 1}.</span>
                  <span className="text-white truncate">{holder.userName}</span>
                </div>
                <span
                  className={`text-center text-[10px] font-medium px-1.5 py-0.5 rounded ${
                    holder.position === "yes"
                      ? "text-[#00c076] bg-[#00c076]/10"
                      : "text-[#ff4d4f] bg-[#ff4d4f]/10"
                  }`}
                >
                  {holder.position.toUpperCase()}
                </span>
                <span className="text-white text-right">{holder.shares.toLocaleString()}</span>
                <span className="text-white text-right">${holder.value.toLocaleString()}</span>
                <span
                  className={`text-right ${
                    holder.profit >= 0 ? "text-[#00c076]" : "text-[#ff4d4f]"
                  }`}
                >
                  {holder.profit >= 0 ? "+" : ""}${holder.profit.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Positions" && (
          <div className="px-4 py-8 text-center">
            <span className="text-[#5a5a6a] text-[12px] font-mono">
              Connect wallet to view your positions
            </span>
          </div>
        )}

        {activeTab === "Activity" && (
          <div>
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1c1c28] hover:bg-[#1c1c28]/20 transition-colors"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    activity.type === "trade"
                      ? "bg-[#00c076]"
                      : activity.type === "comment"
                        ? "bg-[#4da2ff]"
                        : "bg-[#f7931a]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-mono text-[#8a8a9a]">
                    {activity.userName && (
                      <span className="text-white">{activity.userName} </span>
                    )}
                    {activity.description}
                  </span>
                </div>
                <span className="text-[#5a5a6a] text-[10px] font-mono shrink-0">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
