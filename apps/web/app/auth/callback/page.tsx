"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#000000",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <p style={{ fontSize: 13, color: "#8E8E93" }}>Redirecting to profile…</p>
    </div>
  );
}
