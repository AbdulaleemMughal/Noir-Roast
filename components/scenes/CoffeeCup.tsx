'use client';

/**
 * The cup, drawn rather than photographed.
 *
 * Kept to porcelain, shadow and crema so it sits inside the same grade as the
 * beans. Elements carrying `data-*` hooks are animated by BrewScene.
 */
export default function CoffeeCup({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 340"
      className={className}
      role="img"
      aria-label="An espresso cup on a saucer, filling with coffee."
    >
      <defs>
        <linearGradient id="porcelain" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#f7f0e6" />
          <stop offset="34%" stopColor="#e6dac9" />
          <stop offset="68%" stopColor="#b9a893" />
          <stop offset="100%" stopColor="#8a7b6a" />
        </linearGradient>

        <linearGradient id="porcelain-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cbbda9" />
          <stop offset="18%" stopColor="#f4ece0" />
          <stop offset="52%" stopColor="#ddd0bd" />
          <stop offset="82%" stopColor="#9d8e7b" />
          <stop offset="100%" stopColor="#6f6355" />
        </linearGradient>

        <linearGradient id="saucer-face" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b6a894" />
          <stop offset="30%" stopColor="#eae0d1" />
          <stop offset="70%" stopColor="#c3b5a1" />
          <stop offset="100%" stopColor="#7e7263" />
        </linearGradient>

        <radialGradient id="brew" cx="0.42" cy="0.36" r="0.75">
          <stop offset="0%" stopColor="#8a4a1c" />
          <stop offset="42%" stopColor="#4a2410" />
          <stop offset="100%" stopColor="#1d0d06" />
        </radialGradient>

        <radialGradient id="crema-ring" cx="0.5" cy="0.5" r="0.5">
          <stop offset="62%" stopColor="rgba(196,132,66,0)" />
          <stop offset="86%" stopColor="rgba(212,152,84,0.75)" />
          <stop offset="100%" stopColor="rgba(232,190,140,0.9)" />
        </radialGradient>

        <linearGradient id="steam-fade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(240,224,200,0.55)" />
          <stop offset="100%" stopColor="rgba(240,224,200,0)" />
        </linearGradient>
      </defs>

      {/* Contact shadow. */}
      <ellipse cx="210" cy="300" rx="152" ry="20" fill="rgba(0,0,0,0.55)" />

      {/* Saucer. */}
      <ellipse cx="210" cy="292" rx="146" ry="26" fill="url(#saucer-face)" />
      <ellipse cx="210" cy="288" rx="146" ry="26" fill="#0a0503" opacity="0.35" />
      <ellipse cx="210" cy="286" rx="140" ry="23" fill="url(#saucer-face)" />
      <ellipse cx="210" cy="285" rx="86" ry="14" fill="rgba(0,0,0,0.22)" />

      {/* Handle, behind the body. */}
      <path
        d="M 292 172 C 348 160, 356 236, 296 240"
        fill="none"
        stroke="url(#porcelain-body)"
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Cup body. */}
      <path
        d="M 118 152 C 122 232, 146 274, 210 274 C 274 274, 298 232, 302 152 Z"
        fill="url(#porcelain-body)"
      />

      {/* Rim. */}
      <ellipse cx="210" cy="152" rx="92" ry="22" fill="#efe5d6" />
      <ellipse cx="210" cy="152" rx="86" ry="18.5" fill="#2a1a10" />

      {/* The coffee itself — scaled in from nothing as the beans arrive. */}
      <g data-liquid style={{ transformOrigin: '210px 152px' }}>
        <ellipse cx="210" cy="152" rx="86" ry="18.5" fill="url(#brew)" />
        <ellipse cx="210" cy="152" rx="86" ry="18.5" fill="url(#crema-ring)" />
        {/* Crema swirl. */}
        <path
          data-swirl
          d="M 168 150 C 186 140, 232 140, 250 152 C 236 162, 186 162, 168 150 Z"
          fill="rgba(226,178,116,0.5)"
        />
      </g>

      {/* Specular along the left wall. */}
      <path
        d="M 134 162 C 138 226, 156 258, 186 266"
        fill="none"
        stroke="rgba(255,250,242,0.5)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Steam. */}
      <g data-steam opacity="0">
        {[
          'M 186 128 C 172 100, 200 84, 186 54 C 178 36, 192 24, 190 10',
          'M 212 122 C 200 92, 226 74, 212 44 C 204 26, 218 16, 216 2',
          'M 238 128 C 226 102, 250 86, 238 58 C 231 40, 244 30, 242 16',
        ].map((d, index) => (
          <path
            key={d}
            data-steam-path
            d={d}
            fill="none"
            stroke="url(#steam-fade)"
            strokeWidth={2.5 - index * 0.4}
            strokeLinecap="round"
            style={{ filter: 'blur(1.5px)' }}
          />
        ))}
      </g>
    </svg>
  );
}
