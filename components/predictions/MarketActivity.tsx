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
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--surface-container-lowest)", border: "1px solid rgba(66,70,84,0.4)" }}>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono rounded whitespace-nowrap transition-colors"
            style={{
              color: activeTab === tab.label ? "var(--on-surface)" : "var(--on-surface-disabled)",
              background: activeTab === tab.label ? "var(--surface-container)" : "transparent",
            }}
          >
            <tab.icon size={12} />
            {tab.label}
            {tab.label === "Comments" && (
              <span className="text-[10px]" style={{ color: "var(--on-surface-disabled)" }}>({comments.length.toLocaleString()})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
        {activeTab === "Comments" && (
          <div>
            {/* Comment Input */}
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(66,70,84,0.4)" }}>
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 rounded px-3 py-2 text-[12px] font-mono outline-none"
                style={{ background: "var(--surface-container)", color: "var(--on-surface)", border: "1px solid rgba(66,70,84,0.4)" }}
              />
              <button
                className="p-2 rounded transition-colors"
                style={{ color: "var(--on-surface-disabled)" }}
                title="Post comment"
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
              >
                <Send size={14} />
              </button>
            </div>

            {/* Comments List */}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3 px-4 py-3 transition-colors"
                style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: "var(--surface-container-high)" }}>
                  {comment.userAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[12px] font-mono font-medium" style={{ color: "var(--on-surface)" }}>
                      {comment.userName}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-[12px] font-mono leading-relaxed" style={{ color: "var(--on-surface-muted)" }}>
                    {comment.text}
                  </p>
                  <button
                    className="flex items-center gap-1 mt-1 text-[10px] font-mono transition-colors"
                    style={{ color: "var(--on-surface-disabled)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--buy)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--on-surface-disabled)")}
                  >
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
            <div className="grid grid-cols-[1fr_60px_80px_80px_70px] gap-2 px-4 py-2 text-[10px] font-mono" style={{ color: "var(--on-surface-disabled)", borderBottom: "1px solid rgba(66,70,84,0.3)" }}>
              <span>User</span>
              <span className="text-center">Position</span>
              <span className="text-right">Shares</span>
              <span className="text-right">Value</span>
              <span className="text-right">P&L</span>
            </div>
            {topHolders.map((holder, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_60px_80px_80px_70px] gap-2 items-center px-4 py-2.5 text-[11px] font-mono transition-colors"
                style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] w-4" style={{ color: "var(--on-surface-disabled)" }}>{i + 1}.</span>
                  <span className="truncate" style={{ color: "var(--on-surface)" }}>{holder.userName}</span>
                </div>
                <span
                  className="text-center text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{
                    color: holder.position === "yes" ? "var(--buy)" : "var(--sell)",
                    background: holder.position === "yes" ? "rgba(0,192,118,0.1)" : "rgba(255,77,79,0.1)",
                  }}
                >
                  {holder.position.toUpperCase()}
                </span>
                <span className="text-right" style={{ color: "var(--on-surface)" }}>{holder.shares.toLocaleString()}</span>
                <span className="text-right" style={{ color: "var(--on-surface)" }}>${holder.value.toLocaleString()}</span>
                <span
                  className="text-right"
                  style={{ color: holder.profit >= 0 ? "var(--buy)" : "var(--sell)" }}
                >
                  {holder.profit >= 0 ? "+" : ""}${holder.profit.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Positions" && (
          <div className="px-4 py-8 text-center">
            <span className="text-[12px] font-mono" style={{ color: "var(--on-surface-disabled)" }}>
              Connect wallet to view your positions
            </span>
          </div>
        )}

        {activeTab === "Activity" && (
          <div>
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                style={{ borderBottom: "1px solid rgba(66,70,84,0.2)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--surface-container-low)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: activity.type === "trade" ? "var(--buy)" : activity.type === "comment" ? "var(--primary)" : "var(--tertiary)" }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px] font-mono" style={{ color: "var(--on-surface-muted)" }}>
                    {activity.userName && (
                      <span style={{ color: "var(--on-surface)" }}>{activity.userName} </span>
                    )}
                    {activity.description}
                  </span>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--on-surface-disabled)" }}>
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
