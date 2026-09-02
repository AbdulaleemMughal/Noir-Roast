'use client';

/**
 * The pack. Drawn in SVG so it stays crisp at any size and can be lit to match
 * the rest of the grade — a photograph would have to be re-shot for every
 * background the scroll passes through.
 */
export default function CoffeeBag({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 470"
      className={className}
      role="img"
      aria-label="A 250 gram bag of Noir Roast single-origin coffee."
    >
      <defs>
        <linearGradient id="bag-face" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f0906" />
          <stop offset="14%" stopColor="#241610" />
          <stop offset="46%" stopColor="#332015" />
          <stop offset="74%" stopColor="#1d120c" />
          <stop offset="100%" stopColor="#080504" />
        </linearGradient>

        <linearGradient id="bag-gusset" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>

        <linearGradient id="foil" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0%" stopColor="#8a6127" />
          <stop offset="42%" stopColor="#e2a857" />
          <stop offset="70%" stopColor="#f3d9a4" />
          <stop offset="100%" stopColor="#9a6f2e" />
        </linearGradient>

        <linearGradient id="bag-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,232,200,0)" />
          <stop offset="42%" stopColor="rgba(255,232,200,0.13)" />
          <stop offset="58%" stopColor="rgba(255,232,200,0.05)" />
          <stop offset="100%" stopColor="rgba(255,232,200,0)" />
        </linearGradient>
      </defs>

      <ellipse cx="170" cy="452" rx="126" ry="16" fill="rgba(0,0,0,0.6)" />

      {/* Body, with the shoulders a filled bag actually has. */}
      <path
        d="M 44 92 C 44 78, 52 70, 66 68 L 274 68 C 288 70, 296 78, 296 92
           L 296 424 C 296 438, 286 446, 272 446 L 68 446
           C 54 446, 44 438, 44 424 Z"
        fill="url(#bag-face)"
      />

      {/* Side gusset. */}
      <path d="M 44 92 L 78 92 L 78 446 L 68 446 C 54 446, 44 438, 44 424 Z" fill="url(#bag-gusset)" />
      <rect x="272" y="92" width="24" height="354" fill="rgba(0,0,0,0.45)" />

      {/* Folded top and tin tie. */}
      <path d="M 44 92 C 96 74, 244 74, 296 92 L 296 108 C 244 92, 96 92, 44 108 Z" fill="#0b0705" />
      <rect x="86" y="80" width="168" height="7" rx="3.5" fill="url(#foil)" opacity="0.75" />

      {/* Degassing valve. */}
      <circle cx="240" cy="150" r="13" fill="#0a0605" stroke="rgba(226,168,87,0.35)" strokeWidth="1" />
      <circle cx="240" cy="150" r="4" fill="rgba(226,168,87,0.4)" />

      {/* Label. */}
      <line x1="76" y1="196" x2="264" y2="196" stroke="url(#foil)" strokeWidth="1.2" opacity="0.65" />

      <text x="76" y="176" fill="rgba(232,217,194,0.55)" fontSize="9.5" letterSpacing="4.2" fontFamily="var(--font-sans), sans-serif">
        SINGLE ORIGIN
      </text>

      <text x="74" y="258" fill="#f5ede0" fontSize="62" letterSpacing="-2.5" fontFamily="var(--font-display), Georgia, serif">
        NOIR
      </text>
      <text x="74" y="316" fill="url(#foil)" fontSize="62" letterSpacing="-2.5" fontFamily="var(--font-display), Georgia, serif">
        ROAST
      </text>

      <line x1="76" y1="344" x2="264" y2="344" stroke="rgba(232,217,194,0.16)" strokeWidth="1" />

      <text x="76" y="372" fill="rgba(232,217,194,0.72)" fontSize="11" letterSpacing="2.6" fontFamily="var(--font-sans), sans-serif">
        HUILA · COLOMBIA
      </text>
      <text x="76" y="394" fill="rgba(232,217,194,0.42)" fontSize="9.5" letterSpacing="2.2" fontFamily="var(--font-sans), sans-serif">
        JASMINE · APRICOT · MUSCOVADO
      </text>
      <text x="76" y="424" fill="rgba(232,217,194,0.42)" fontSize="9.5" letterSpacing="2.2" fontFamily="var(--font-sans), sans-serif">
        WHOLE BEAN · 250 g
      </text>

      {/* Sheen last, so it rides over the artwork. */}
      <path
        d="M 44 92 C 44 78, 52 70, 66 68 L 274 68 C 288 70, 296 78, 296 92
           L 296 424 C 296 438, 286 446, 272 446 L 68 446
           C 54 446, 44 438, 44 424 Z"
        fill="url(#bag-sheen)"
      />
    </svg>
  );
}
