import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Storefront } from "./apps/Storefront";
import { Admin } from "./apps/Admin";
import { BlueprintPage } from "./pages/BlueprintPage";
import { ToastProvider } from "./components/ui";

/* ------------------------------------------------------------------ */
/*  workspace chrome — branch state + route switcher                   */
/* ------------------------------------------------------------------ */

function WorkspaceBar() {
  const link = (to: string, label: string) => (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `relative shrink-0 cursor-pointer px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors duration-200 ${
          isActive ? "text-ink" : "text-faint hover:text-dim"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          <span
            className={`absolute inset-x-2.5 -bottom-px h-[2px] transition-all duration-300 ${
              isActive ? "bg-amber opacity-100" : "opacity-0"
            }`}
          />
        </>
      )}
    </NavLink>
  );

  return (
    <div className="border-b border-line bg-panel/80">
      <div className="mx-auto flex h-11 w-full max-w-6xl items-center gap-3 px-5 sm:px-8">
        <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden className="shrink-0">
          <rect width="32" height="32" fill="var(--color-panel)" stroke="var(--color-line)" />
          <path d="M6 22 L14 10 L18 16 L26 6" stroke="var(--color-wire)" strokeWidth="2.4" fill="none" />
          <circle cx="26" cy="6" r="2.6" fill="var(--color-amber)" />
        </svg>
        <span className="font-display text-[13px] font-extrabold tracking-tight">BRIDGEWORK</span>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <span className="hidden font-mono text-[9px] uppercase tracking-[0.22em] text-faint sm:block">
          apps workspace
        </span>

        <nav className="ml-2 flex items-center gap-0.5 overflow-x-auto scrollbar-none sm:ml-6">
          {link("/", "storefront")}
          {link("/admin", "admin")}
          {link("/blueprint", "blueprint")}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2.5">
          <span
            className="hidden items-center gap-1.5 border border-mint/40 bg-mint/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-mint md:flex"
            title="full-stack-project-blueprint-4a182 was merged into main, then deleted. The blueprint console lives on at #/blueprint."
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="6" cy="5.5" r="2" />
              <circle cx="6" cy="18.5" r="2" />
              <circle cx="18" cy="8" r="2" />
              <path d="M6 7.5v9M18 10c0 4-4.5 4.2-9.5 4.4" />
            </svg>
            main · merged ✓
          </span>
          <span className="border border-line px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint" title="The middle API layer is simulated in-browser for this workspace">
            gateway: sim
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ambient layers shared by every route                               */
/* ------------------------------------------------------------------ */

function Ambient() {
  return (
    <>
      <div className="bg-blueprint" aria-hidden />
      <div className="noise-veil" aria-hidden />
      <div className="radar-sweep" aria-hidden />
      <svg className="drift-cross" style={{ top: "18%", left: "6%" }} width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <path d="M11 1v20M1 11h20" stroke="currentColor" strokeWidth="1.2" />
      </svg>
      <svg className="drift-cross b" style={{ top: "64%", right: "8%" }} width="18" height="18" viewBox="0 0 22 22" aria-hidden>
        <path d="M11 1v20M1 11h20" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function App() {
  return (
    <ToastProvider>
      <HashRouter>
        <div className="relative min-h-screen">
          <Ambient />
          <WorkspaceBar />
          {/* merge ribbon — the branch transition, on record */}
          <div className="border-b border-dashed border-line bg-panel/40">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-5 py-1.5 font-mono text-[9.5px] tracking-[0.14em] text-faint sm:px-8">
              <span className="text-mint">✓ merged</span>
              <span>
                <span className="text-faint line-through decoration-faint/60">full-stack-project-blueprint-4a182</span>{" "}
                <span className="text-wire">→ main</span>
              </span>
              <span className="text-coral/80">branch deleted</span>
              <span className="ml-auto hidden sm:inline">
                now developing: <span className="text-amber">apps/*</span> — web storefront live · /admin live · mobile next
              </span>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<Storefront />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/blueprint" element={<BlueprintPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </HashRouter>
    </ToastProvider>
  );
}
