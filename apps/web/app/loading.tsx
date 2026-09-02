export default function Loading() {
  return (
    <div className="container" style={{ padding: "120px 0", textAlign: "center" }}>
      <div className="spinner" />
      <p style={{ color: "var(--sub)", fontSize: 13, marginTop: 12, fontWeight: 600 }}>
        Loading DEEN Commerce…
      </p>
    </div>
  );
}
