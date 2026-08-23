import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

/**
 * Crash guard — if any screen throws at runtime (usually stale persisted
 * state from an older build), show a recoverable console instead of a
 * blank preview. "Reset workspace state" clears the persisted stores and
 * remounts fresh.
 */
class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null; resetKey: number }> {
  state = { error: null as Error | null, resetKey: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  private reset = () => {
    try {
      const keep: string[] = [];
      for (let i = window.localStorage.length - 1; i >= 0; i--) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith("deen.") || k.startsWith("bw.")) && !keep.includes(k)) {
          window.localStorage.removeItem(k);
        }
      }
    } catch {
      /* storage unavailable */
    }
    this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#081422",
            color: "#e9f1f8",
            fontFamily: "'IBM Plex Mono', monospace",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 480, border: "1px solid #22405c", padding: 28, background: "#0c1e31" }}>
            <p style={{ color: "#f07a5e", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
              runtime fault caught
            </p>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, margin: "10px 0 8px" }}>
              The workspace hit a snag
            </h1>
            <p style={{ color: "#9fb4c8", fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>
              {String(this.state.error?.message ?? this.state.error)}
            </p>
            <p style={{ color: "#64798f", fontSize: 11, lineHeight: 1.6, marginTop: 10 }}>
              Usually this is stale state from a previous build. Resetting clears the local
              stores (cart, sessions, ledger overrides) and remounts everything.
            </p>
            <button
              onClick={this.reset}
              style={{
                marginTop: 18,
                cursor: "pointer",
                background: "#f2b45c",
                color: "#081422",
                border: "none",
                padding: "10px 18px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Reset workspace state
            </button>
          </div>
        </div>
      );
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Boundary>
    <App />
  </Boundary>
);
