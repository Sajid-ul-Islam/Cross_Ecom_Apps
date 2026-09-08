"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected client runtime errors
    console.error("[Next.js ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
        Something went wrong
      </h2>
      <p style={{ color: "var(--sub)", fontSize: 14, maxWidth: 440, margin: "0 auto 24px", lineHeight: 1.6 }}>
        We encountered a temporary error loading this section. Please try again or return to the storefront.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => reset()}
          className="btn btn--primary"
          style={{ padding: "12px 24px", fontWeight: 800 }}
        >
          Try Again
        </button>
        <Link href="/" className="btn btn--outline" style={{ padding: "12px 24px", fontWeight: 800 }}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}
