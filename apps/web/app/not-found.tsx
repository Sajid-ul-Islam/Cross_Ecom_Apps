import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "100px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>👖</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: "var(--sub)", fontSize: 14, maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.6 }}>
        The apparel drop or page you are looking for might have moved, sold out, or is temporarily unavailable.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Link href="/" className="btn btn--primary" style={{ padding: "12px 24px", fontWeight: 800 }}>
          Back to Home
        </Link>
        <Link href="/shop" className="btn btn--outline" style={{ padding: "12px 24px", fontWeight: 800 }}>
          Browse Collection
        </Link>
      </div>
    </div>
  );
}
