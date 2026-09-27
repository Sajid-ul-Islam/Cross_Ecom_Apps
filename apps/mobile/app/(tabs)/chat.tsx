import React from "react";
import { useRouter } from "expo-router";
import { ScreenShell } from "../../src/components/ScreenShell";
import { AiChatView } from "../../src/components/AiConciergeModal";

export default function ChatScreen() {
  const router = useRouter();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <ScreenShell renderNav={<></>}>
      <AiChatView isEmbedded onClose={handleClose} />
    </ScreenShell>
  );
}
