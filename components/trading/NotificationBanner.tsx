"use client";

import { X } from "lucide-react";

interface NotificationBannerProps {
  notification: {
    type: "success" | "info" | "error";
    message: string;
  } | null;
  onDismiss: () => void;
}

export default function NotificationBanner({ notification, onDismiss }: NotificationBannerProps) {
  if (!notification) return null;

  return (
    <div
      className="px-3 py-2 text-[11px] font-mono flex items-center justify-between"
      style={{
        background: notification.type === "success"
          ? "rgba(0,192,118,0.1)"
          : notification.type === "info"
          ? "rgba(99,179,255,0.1)"
          : "rgba(255,77,79,0.1)",
        color: notification.type === "success"
          ? "var(--buy)"
          : notification.type === "info"
          ? "#63b3ff"
          : "var(--sell)",
      }}
    >
      <span className="truncate">{notification.message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 shrink-0"><X size={10} /></button>
    </div>
  );
}
