/** Original flat illustration: a nurse with cap, stethoscope and clipboard, framed by a home outline. */
export function NurseIllustration() {
  return (
    <svg className="nurse-illu" viewBox="0 0 420 420" role="img" aria-label="Nurse illustration">
      <defs>
        <linearGradient id="nbg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" stopOpacity=".35" />
          <stop offset="1" stopColor="#077dba" stopOpacity=".18" />
        </linearGradient>
        <linearGradient id="uniform" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1597dc" />
          <stop offset="1" stopColor="#05608f" />
        </linearGradient>
        <clipPath id="circleClip"><circle cx="210" cy="210" r="185" /></clipPath>
      </defs>
      <circle cx="210" cy="210" r="185" fill="url(#nbg)" />
      <g className="illu-ring"><circle cx="210" cy="210" r="200" fill="none" stroke="#077dba" strokeOpacity=".25" strokeDasharray="4 10" strokeWidth="2" /></g>
      <path d="M70 200 L210 95 L350 200" fill="none" stroke="#077dba" strokeOpacity=".35" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <g clipPath="url(#circleClip)">
        {/* body */}
        <path d="M95 420 C100 330 145 292 210 292 C275 292 320 330 325 420 Z" fill="url(#uniform)" />
        <path d="M182 292 L210 336 L238 292 Z" fill="#e0f2fe" />
        <rect x="192" y="248" width="36" height="50" rx="14" fill="#f2c9a5" />
        {/* stethoscope */}
        <path d="M168 300 C160 350 190 372 210 372 C232 372 258 350 252 300" fill="none" stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
        <circle cx="210" cy="376" r="11" fill="#cbd5e1" stroke="#1f2937" strokeWidth="4" />
        {/* clipboard */}
        <rect x="262" y="330" width="58" height="76" rx="8" fill="#fff" stroke="#cbd5e1" strokeWidth="3" />
        <rect x="278" y="322" width="26" height="14" rx="4" fill="#94a3b8" />
        <path d="M274 356 h34 M274 370 h34 M274 384 h22" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" />
        <path d="M302 382 l4 4 8-10" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* head */}
      <circle cx="210" cy="205" r="58" fill="#f6d2b3" />
      <path d="M152 210 C148 150 190 128 222 132 C262 136 276 175 268 214 C262 186 244 170 210 168 C180 168 160 186 152 210 Z" fill="#3b2a24" />
      <path d="M262 200 C276 232 270 262 252 280 C262 252 262 226 262 200 Z" fill="#3b2a24" />
      {/* cap */}
      <path d="M164 150 C170 116 250 116 256 150 L248 162 C226 152 194 152 172 162 Z" fill="#fff" stroke="#e2e8f0" strokeWidth="3" />
      <rect x="203" y="128" width="14" height="30" rx="2" fill="#ef4444" />
      <rect x="195" y="136" width="30" height="14" rx="2" fill="#ef4444" />
      {/* face */}
      <circle cx="190" cy="212" r="5" fill="#1f2937" />
      <circle cx="230" cy="212" r="5" fill="#1f2937" />
      <path d="M194 236 C204 246 216 246 226 236" stroke="#b45309" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="178" cy="230" r="8" fill="#fca5a5" opacity=".5" />
      <circle cx="242" cy="230" r="8" fill="#fca5a5" opacity=".5" />
      {/* floating hearts */}
      <g className="illu-heart h1"><path d="M330 120 c0-10 14-14 18-4 c4-10 18-6 18 4 c0 12-18 22-18 22 s-18-10-18-22z" fill="#ef4444" opacity=".85" /></g>
      <g className="illu-heart h2"><path d="M70 120 h14 v-14 h14 v14 h14 v14 h-14 v14 h-14 v-14 h-14z" fill="#077dba" opacity=".7" /></g>
    </svg>
  );
}
