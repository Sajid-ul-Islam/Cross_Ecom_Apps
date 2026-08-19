import { useState } from "react";
import { TOPO_EDGES, TOPO_NODES, type TopoNode } from "../data";
import { useReducedMotion } from "../hooks";
import { Reveal, SectionShell, Stamp } from "./ui";
import { IconChip, IconEye, IconLock, IconRoute, IconShield } from "./Icons";

const HEX: Record<string, string> = {
  mint: "#55d69b",
  amber: "#f2b45c",
  wire: "#66bce3",
  coral: "#f07a5e",
  dim: "#64798f",
};

function NodeBox({
  n,
  selected,
  onSelect,
}: {
  n: TopoNode;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const c = HEX[n.tone];
  return (
    <g
      className={`node-g ${selected ? "sel" : ""}`}
      onClick={() => onSelect(n.id)}
      opacity={n.ghost ? 0.72 : 1}
    >
      <rect
        className="frame"
        x={n.x}
        y={n.y}
        width={n.w}
        height={n.h}
        fill="#0c1e31"
        stroke={selected ? c : "#22405c"}
        strokeWidth={selected ? 1.6 : 1.2}
        strokeDasharray={n.ghost ? "5 6" : undefined}
      />
      <rect x={n.x} y={n.y} width={4} height={n.h} fill={c} opacity={n.ghost ? 0.45 : 0.95} />
      <circle cx={n.x + n.w - 16} cy={n.y + 17} r={3.4} fill={c} opacity={n.ghost ? 0.4 : 1}>
        {!n.ghost && (
          <animate attributeName="opacity" values="1;0.35;1" dur="2.2s" repeatCount="indefinite" />
        )}
      </circle>
      <text
        x={n.x + 16}
        y={n.y + 30}
        fill="#e9f1f8"
        fontSize="15"
        fontWeight="700"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {n.title}
      </text>
      <text x={n.x + 16} y={n.y + 48} fill="#9fb4c8" fontSize="10" style={{ fontFamily: "var(--font-body)" }}>
        {n.sub}
      </text>
      <text
        x={n.x + 16}
        y={n.y + n.h - 15}
        fill={c}
        fontSize="9"
        letterSpacing="2.4"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {n.stamp}
      </text>
      {/* corner ticks */}
      <path
        d={`M ${n.x + n.w - 10} ${n.y + n.h} h 10 v -10`}
        stroke={c}
        strokeWidth="1.4"
        fill="none"
        opacity="0.7"
      />
    </g>
  );
}

function Inspector({ node }: { node: TopoNode }) {
  return (
    <div key={node.id} className="tick-in corners border border-line bg-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-extrabold">{node.title}</h3>
          <p className="mt-0.5 text-[13px] text-dim">{node.sub}</p>
        </div>
        <Stamp tone={node.tone}>{node.stamp}</Stamp>
      </div>

      <div className="mt-5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-wire">
          <IconChip size={13} /> Stack
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {node.stack.map((s) => (
            <span key={s} className="border border-line bg-panel2 px-2 py-1 font-mono text-[11px] text-dim">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-wire">
          <IconRoute size={13} /> Responsibilities
        </p>
        <ul className="mt-2 space-y-1.5">
          {node.duties.map((d) => (
            <li key={d} className="flex gap-2 text-[13px] text-dim leading-snug">
              <span className="mt-[7px] h-1 w-3 shrink-0 bg-wire/60" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-coral">
          <IconShield size={13} /> Security posture
        </p>
        <ul className="mt-2 space-y-1.5">
          {node.security.map((s) => (
            <li key={s} className="flex gap-2 text-[13px] text-dim leading-snug">
              <IconLock size={12} className="mt-[3px] shrink-0 text-coral/80" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 border-t border-dashed border-line pt-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-faint">Env surface</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {node.env.map((e) => (
            <code key={e} className="border border-line bg-bg/70 px-2 py-1 font-mono text-[11px] text-amber/90">
              {e}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Topology() {
  const [selected, setSelected] = useState("api");
  const reduced = useReducedMotion();
  const node = TOPO_NODES.find((n) => n.id === selected) ?? TOPO_NODES[4];

  return (
    <SectionShell
      id="sheet-00"
      sheet="Sheet 00"
      kicker="System topology"
      title="Everything crosses the bridge"
      intro="Four client surfaces, one system of record, and a single secure choke point between them. Click any node on the schematic to inspect its stack, responsibilities, security posture and env surface."
    >
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] items-start">
        <Reveal>
          <div className="corners border border-line bg-panel/70 p-3 sm:p-5">
            <svg viewBox="0 0 1000 560" className="w-full h-auto select-none" role="img" aria-label="Architecture schematic: Expo Android, Expo iOS, Next.js web and admin panel all connect through the middle API layer to WooCommerce, with Redis for sessions, cache and queues.">
              {/* ruler */}
              <g stroke="#22405c" strokeWidth="1">
                <line x1="40" y1="20" x2="960" y2="20" />
                {Array.from({ length: 24 }).map((_, i) => (
                  <line
                    key={i}
                    x1={40 + i * 40}
                    y1={i % 5 === 0 ? 12 : 16}
                    x2={40 + i * 40}
                    y2="20"
                  />
                ))}
              </g>
              <text x="40" y="34" fill="#64798f" fontSize="8" letterSpacing="2" style={{ fontFamily: "var(--font-mono)" }}>
                BW-2025 · SYSTEM SCHEMATIC · ALL CLIENT TRAFFIC VIA GATEWAY
              </text>

              {/* edges */}
              {TOPO_EDGES.map((e) => (
                <g key={e.id}>
                  <path
                    id={`topo-${e.id}`}
                    d={e.d}
                    fill="none"
                    stroke="#22405c"
                    strokeWidth="1.4"
                    strokeDasharray={e.dashed ? "5 8" : undefined}
                  />
                  {e.flow && !reduced && (
                    <path d={e.d} fill="none" stroke="#66bce3" strokeWidth="1.4" className="dash-flow" opacity="0.65" />
                  )}
                  <text
                    x={e.lx}
                    y={e.ly}
                    fill={e.dashed ? "#64798f" : "#9fb4c8"}
                    fontSize="9.5"
                    letterSpacing="1.4"
                    textAnchor="middle"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {e.label}
                  </text>
                </g>
              ))}

              {/* travelling request packets */}
              {!reduced && (
                <>
                  <circle r="7" fill="#f2b45c" opacity="0.18">
                    <animateMotion dur="3.4s" repeatCount="indefinite">
                      <mpath href="#topo-e-and" />
                    </animateMotion>
                  </circle>
                  <circle r="3.2" fill="#f2b45c">
                    <animateMotion dur="3.4s" repeatCount="indefinite">
                      <mpath href="#topo-e-and" />
                    </animateMotion>
                  </circle>
                  <circle r="7" fill="#66bce3" opacity="0.18">
                    <animateMotion dur="2.8s" repeatCount="indefinite">
                      <mpath href="#topo-e-woo" />
                    </animateMotion>
                  </circle>
                  <circle r="3.2" fill="#66bce3">
                    <animateMotion dur="2.8s" repeatCount="indefinite">
                      <mpath href="#topo-e-woo" />
                    </animateMotion>
                  </circle>
                  <circle r="3" fill="#f07a5e" opacity="0.9">
                    <animateMotion dur="4.2s" repeatCount="indefinite">
                      <mpath href="#topo-e-hook" />
                    </animateMotion>
                  </circle>
                </>
              )}

              {/* nodes */}
              {TOPO_NODES.map((n) => (
                <NodeBox key={n.id} n={n} selected={selected === n.id} onSelect={setSelected} />
              ))}

              {/* zone labels */}
              <text x="44" y="552" fill="#64798f" fontSize="9" letterSpacing="2.5" style={{ fontFamily: "var(--font-mono)" }}>
                CLIENT ZONE
              </text>
              <text x="396" y="552" fill="#64798f" fontSize="9" letterSpacing="2.5" style={{ fontFamily: "var(--font-mono)" }}>
                BRIDGE ZONE
              </text>
              <text x="760" y="552" fill="#64798f" fontSize="9" letterSpacing="2.5" style={{ fontFamily: "var(--font-mono)" }}>
                COMMERCE ZONE
              </text>
            </svg>

            {/* legend */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-dashed border-line pt-3 px-1">
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-dim uppercase">
                <span className="inline-block h-px w-7 bg-wire" /> live request path
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-dim uppercase">
                <svg width="28" height="4"><line x1="0" y1="2" x2="28" y2="2" stroke="#64798f" strokeWidth="1.4" strokeDasharray="4 5" /></svg>
                planned / async
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-dim uppercase">
                <span className="inline-block h-2 w-2 rounded-full bg-amber" /> request in flight
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-dim uppercase text-wire">
                <IconEye size={13} /> click a node to inspect
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120} className="lg:sticky lg:top-20">
          <Inspector node={node} />
          <div className="mt-4 border border-dashed border-amber/40 bg-amber/[0.04] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber">Non-negotiable</p>
            <p className="mt-2 text-[13px] leading-relaxed text-dim">
              No client — Android, iOS, web or admin — ever holds WooCommerce credentials or calls its REST
              API directly. The middle layer normalizes payloads, enforces auth and rate limits, and is the
              only thing that changes when Woo changes.
            </p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  );
}
