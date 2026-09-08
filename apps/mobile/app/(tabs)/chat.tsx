import React from "react";
import { ScreenShell } from "../../src/components/ScreenShell";
import { AiChatView } from "../../src/components/AiConciergeModal";

export default function ChatScreen() {
  return (
    <ScreenShell title="CHAT" showBag={false}>
      <AiChatView isEmbedded />
    </ScreenShell>
  );
}
