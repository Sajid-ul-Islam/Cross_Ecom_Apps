"use client";

import React from "react";

interface QuickRepliesProps {
  replies?: string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export default function QuickReplies({
  replies,
  onSelect,
  disabled = false,
}: QuickRepliesProps) {
  if (!replies || replies.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
        marginBottom: 4,
      }}
    >
      {replies.map((reply, idx) => (
        <button
          key={`${reply}-${idx}`}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          style={{
            background: "var(--surface)",
            color: "var(--indigo)",
            border: "1.5px solid var(--indigo)",
            borderRadius: 16,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 700,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "all 0.15s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
