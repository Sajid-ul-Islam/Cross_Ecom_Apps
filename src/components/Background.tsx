/** Layered ambient background: grid, drifting glows, and a living commit graph. */
export default function Background() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden bg-ink">
      {/* base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,#101b2e_0%,#0b101a_55%,#090d15_100%)]" />
      {/* grid */}
      <div className="grid-bg absolute inset-0" />
      {/* glows */}
      <div className="glow glow-amber -top-40 right-[-10%] h-[34rem] w-[34rem]" />
      <div className="glow glow-mint bottom-[-14rem] left-[-8%] h-[38rem] w-[38rem]" />
      <div className="glow glow-azure top-[38%] left-[52%] h-[26rem] w-[26rem] opacity-70" />

      {/* commit graph */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.32]"
        viewBox="0 0 1440 2600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {/* main branch */}
        <path
          className="graph-line"
          d="M180 -40 V 2640"
          stroke="#2d3d5c"
          strokeWidth="2"
        />
        {/* feature branch looping out and back */}
        <path
          className="graph-line slow"
          d="M180 260 C 420 300, 470 420, 470 560 V 900 C 470 1040, 420 1120, 180 1180"
          stroke="#53e2a2"
          strokeWidth="2"
        />
        {/* second branch, right side */}
        <path
          className="graph-line"
          d="M180 1420 C 760 1470, 1080 1560, 1080 1760 V 2080 C 1080 2260, 840 2330, 180 2400"
          stroke="#6ec1ff"
          strokeWidth="2"
        />
        {/* hotfix stub */}
        <path
          className="graph-line slow"
          d="M1080 1900 C 1250 1930, 1300 1990, 1300 2080 V 2160"
          stroke="#ffb454"
          strokeWidth="2"
        />
        {/* commits on main */}
        {[
          [180, 120, "#8ba3c7"],
          [180, 500, "#8ba3c7"],
          [180, 880, "#8ba3c7"],
          [180, 1180, "#53e2a2"],
          [180, 1420, "#8ba3c7"],
          [180, 1900, "#8ba3c7"],
          [180, 2400, "#6ec1ff"],
        ].map(([x, y, c], i) => (
          <circle
            key={i}
            className="graph-node"
            style={{ animationDelay: `${i * 0.55}s` }}
            cx={x}
            cy={y}
            r="7"
            fill="#0b101a"
            stroke={c as string}
            strokeWidth="2.5"
          />
        ))}
        {/* commits on branches */}
        {[
          [470, 560, "#53e2a2"],
          [470, 900, "#53e2a2"],
          [1080, 1760, "#6ec1ff"],
          [1080, 2080, "#6ec1ff"],
          [1300, 2160, "#ffb454"],
        ].map(([x, y, c], i) => (
          <circle
            key={`b${i}`}
            className="graph-node"
            style={{ animationDelay: `${i * 0.8}s` }}
            cx={x}
            cy={y}
            r="6"
            fill={c as string}
          />
        ))}
        {/* the broken ref — HEAD^ pointing at nothing */}
        <g className="graph-node" style={{ animationDelay: "1.2s" }}>
          <circle cx="180" cy="120" r="16" stroke="#ff7a70" strokeWidth="1.5" strokeDasharray="4 5" />
        </g>
      </svg>
    </div>
  );
}
