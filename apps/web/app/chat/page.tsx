"use client";

import React from "react";
import ChatAssistant from "@/components/ChatAssistant";

export default function ChatPage() {
  return (
    <div className="container" style={{ padding: "16px 16px 48px" }}>
      <ChatAssistant isEmbedded />
    </div>
  );
}
