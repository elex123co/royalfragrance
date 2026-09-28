export function AnniversarySeal({ size = 120 }: { size?: number }) {
  const rays = Array.from({ length: 16 });
  const confetti = [
    { x: 14, y: 22, r: 3.2, color: "#E85D4E", rot: 20 },
    { x: 100, y: 18, r: 2.6, color: "#4BA3A0", rot: -15 },
    { x: 108, y: 55, r: 3, color: "#E8C24A", rot: 45 },
    { x: 96, y: 92, r: 2.8, color: "#E85D4E", rot: -30 },
    { x: 60, y: 106, r: 3.2, color: "#4BA3A0", rot: 10 },
    { x: 20, y: 90, r: 2.6, color: "#E8C24A", rot: -20 },
    { x: 8, y: 58, r: 3, color: "#E85D4E", rot: 35 },
    { x: 30, y: 10, r: 2.4, color: "#4BA3A0", rot: 60 },
    { x: 88, y: 8, r: 2.4, color: "#E8C24A", rot: -50 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Anniversary celebration"
    >
      <defs>
        <radialGradient id="burstCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5D98A" />
          <stop offset="100%" stopColor="#C49A7A" />
        </radialGradient>
      </defs>

      {/* Sunburst rays — the core "energy" of the design, replacing the
          stiff laurel wreath with something that reads as celebratory
          motion rather than a formal crest. Spins slowly for real,
          continuous energy rather than sitting static. */}
      <g
        transform="translate(60,60)"
        className="animate-slow-spin"
        style={{ transformOrigin: "60px 60px" }}
      >
        {rays.map((_, i) => {
          const angle = (360 / rays.length) * i;
          return (
            <rect
              key={i}
              x="-2.5"
              y="-58"
              width="5"
              height="20"
              rx="2.5"
              fill={i % 2 === 0 ? "#E8C24A" : "#C49A7A"}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>

      {/* Confetti pieces scattered around the burst — bright, varied
          colors for genuine party energy. */}
      {confetti.map((c, i) => (
        <rect
          key={i}
          x={c.x - c.r}
          y={c.y - c.r}
          width={c.r * 2}
          height={c.r * 2}
          rx={c.r * 0.4}
          fill={c.color}
          transform={`rotate(${c.rot} ${c.x} ${c.y})`}
        />
      ))}

      {/* Center medallion — gently pulses to draw the eye without being
          obnoxious about it. */}
      <g className="animate-gentle-pulse" style={{ transformOrigin: "60px 60px" }}>
        <circle cx="60" cy="60" r="34" fill="url(#burstCore)" stroke="#70452F" strokeWidth="2" />

        <text
          x="60"
          y="55"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          letterSpacing="0.5"
          fill="#2B1B14"
          fontFamily="sans-serif"
        >
          HAPPY
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          letterSpacing="0.5"
          fill="#5C1F1F"
          fontFamily="sans-serif"
        >
          ANNIVERSARY
        </text>
      </g>
    </svg>
  );
}
