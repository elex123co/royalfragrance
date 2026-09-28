export function AnniversarySeal({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.25}
      viewBox="0 0 120 150"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Anniversary"
    >
      <defs>
        <linearGradient id="goldFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8C88A" />
          <stop offset="45%" stopColor="#C49A7A" />
          <stop offset="100%" stopColor="#8A5A34" />
        </linearGradient>
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F2D9A8" />
          <stop offset="100%" stopColor="#70452F" />
        </linearGradient>
      </defs>

      {/* Ribbon tails, drawn first so the medallion sits on top */}
      <path d="M42 88 L34 148 L60 132 L86 148 L78 88 Z" fill="#5C1F1F" />
      <path d="M42 88 L34 148 L48 140 L52 88 Z" fill="#4A1818" />
      <path d="M78 88 L86 148 L72 140 L68 88 Z" fill="#4A1818" />

      {/* Laurel branches */}
      <g fill="none" stroke="url(#goldRim)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M14 70 C 20 55, 22 40, 34 28" />
        <path d="M18 62 C 24 60, 28 56, 30 50" />
        <path d="M20 50 C 26 49, 30 45, 32 40" />
        <path d="M24 38 C 29 38, 32 35, 34 31" />

        <path d="M106 70 C 100 55, 98 40, 86 28" />
        <path d="M102 62 C 96 60, 92 56, 90 50" />
        <path d="M100 50 C 94 49, 90 45, 88 40" />
        <path d="M96 38 C 91 38, 88 35, 86 31" />
      </g>

      {/* Medallion */}
      <circle cx="60" cy="55" r="42" fill="url(#goldRim)" />
      <circle cx="60" cy="55" r="36" fill="url(#goldFace)" stroke="#3D2414" strokeWidth="1" />
      <circle cx="60" cy="55" r="30" fill="none" stroke="#E8D7C5" strokeWidth="1" opacity="0.6" />

      <text
        x="60"
        y="49"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        letterSpacing="1.5"
        fill="#2B1B14"
        fontFamily="serif"
      >
        ROYAL
      </text>
      <text
        x="60"
        y="60"
        textAnchor="middle"
        fontSize="6.5"
        letterSpacing="1.2"
        fill="#2B1B14"
        fontFamily="serif"
      >
        FRAGRANCE
      </text>
      <line x1="42" y1="65" x2="78" y2="65" stroke="#2B1B14" strokeWidth="0.75" opacity="0.5" />
      <text
        x="60"
        y="74"
        textAnchor="middle"
        fontSize="6"
        letterSpacing="2"
        fill="#2B1B14"
        fontFamily="serif"
      >
        ANNIVERSARY
      </text>
    </svg>
  );
}
