import React from "react";

/**
 * Inline SVG illustration for the "All caught up!" empty state.
 * Hardcoded SVG (no external image dependency) — similar to GitHub's inbox-zero style.
 * Features a ninja cat character in a dark forest scene drawn with glowing blue outlines.
 */
const InboxZeroIllustration: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 500 300"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="All caught up illustration"
    >
      <defs>
        {/* Glow filter for the character */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Subtle gradient for the sky */}
        <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1117" />
          <stop offset="100%" stopColor="#161b22" />
        </linearGradient>

        {/* Ground gradient */}
        <linearGradient id="groundGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#161b22" />
          <stop offset="100%" stopColor="#0d1117" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="500" height="300" fill="url(#skyGradient)" />

      {/* Stars */}
      <circle cx="60" cy="30" r="1" fill="#8b949e" opacity="0.5" />
      <circle cx="120" cy="55" r="0.8" fill="#8b949e" opacity="0.4" />
      <circle cx="200" cy="20" r="1.2" fill="#8b949e" opacity="0.6" />
      <circle cx="320" cy="40" r="0.7" fill="#8b949e" opacity="0.3" />
      <circle cx="400" cy="25" r="1" fill="#8b949e" opacity="0.5" />
      <circle cx="450" cy="60" r="0.9" fill="#8b949e" opacity="0.4" />
      <circle cx="80" cy="80" r="0.6" fill="#8b949e" opacity="0.3" />
      <circle cx="380" cy="70" r="1.1" fill="#8b949e" opacity="0.5" />

      {/* Moon */}
      <circle cx="390" cy="50" r="14" fill="#21262d" />
      <circle cx="393" cy="47" r="12" fill="#30363d" />

      {/* Background trees (far) */}
      <g fill="#161b22">
        <polygon points="30,230 45,120 60,230" />
        <polygon points="55,230 75,100 95,230" />
        <polygon points="90,230 105,130 120,230" />
        <polygon points="370,230 390,110 410,230" />
        <polygon points="400,230 415,125 430,230" />
        <polygon points="430,230 450,105 470,230" />
      </g>

      {/* Mid-ground trees */}
      <g fill="#21262d">
        <polygon points="10,240 30,140 50,240" />
        <polygon points="40,240 65,110 90,240" />
        <polygon points="110,240 130,150 150,240" />
        <polygon points="350,240 375,130 400,240" />
        <polygon points="410,240 435,115 460,240" />
        <polygon points="455,240 475,145 495,240" />
      </g>

      {/* Foreground trees */}
      <g fill="#30363d">
        <polygon points="0,250 20,160 40,250" />
        <polygon points="130,250 150,165 170,250" />
        <polygon points="330,250 355,155 380,250" />
        <polygon points="460,250 480,170 500,250" />
      </g>

      {/* Ground */}
      <rect x="0" y="240" width="500" height="60" fill="#21262d" />
      <ellipse cx="250" cy="240" rx="250" ry="15" fill="#30363d" opacity="0.5" />

      {/* Small rocks */}
      <g fill="#30363d">
        <ellipse cx="100" cy="248" rx="12" ry="6" />
        <ellipse cx="400" cy="252" rx="10" ry="5" />
        <ellipse cx="180" cy="255" rx="8" ry="4" />
      </g>
      <g fill="#3d444d">
        <ellipse cx="100" cy="246" rx="10" ry="5" />
        <ellipse cx="400" cy="250" rx="8" ry="4" />
      </g>

      {/* Small mushrooms */}
      <g>
        <rect x="155" y="240" width="2" height="8" fill="#3d444d" />
        <ellipse cx="156" cy="240" rx="5" ry="3" fill="#30363d" />
        <rect x="420" y="242" width="2" height="6" fill="#3d444d" />
        <ellipse cx="421" cy="242" rx="4" ry="2.5" fill="#30363d" />
      </g>

      {/* === NINJA CAT CHARACTER (blue outline style) === */}
      <g filter="url(#glow)" transform="translate(250, 195)">
        {/* Body */}
        <ellipse cx="0" cy="20" rx="28" ry="32" fill="none" stroke="#58a6ff" strokeWidth="1.8" />

        {/* Head */}
        <circle cx="0" cy="-25" r="22" fill="none" stroke="#58a6ff" strokeWidth="1.8" />

        {/* Ears */}
        <polygon points="-18,-42 -12,-60 -5,-42" fill="none" stroke="#58a6ff" strokeWidth="1.8" />
        <polygon points="18,-42 12,-60 5,-42" fill="none" stroke="#58a6ff" strokeWidth="1.8" />

        {/* Inner ears */}
        <line x1="-14" y1="-45" x2="-10" y2="-53" stroke="#58a6ff" strokeWidth="0.8" opacity="0.5" />
        <line x1="14" y1="-45" x2="10" y2="-53" stroke="#58a6ff" strokeWidth="0.8" opacity="0.5" />

        {/* Ninja mask / headband */}
        <line x1="-24" y1="-30" x2="24" y2="-30" stroke="#58a6ff" strokeWidth="2.5" />
        <line x1="22" y1="-30" x2="35" y2="-36" stroke="#58a6ff" strokeWidth="1.5" />
        <line x1="22" y1="-30" x2="33" y2="-28" stroke="#58a6ff" strokeWidth="1.5" />

        {/* Eyes */}
        <ellipse cx="-9" cy="-26" rx="5" ry="4" fill="none" stroke="#58a6ff" strokeWidth="1.5" />
        <ellipse cx="9" cy="-26" rx="5" ry="4" fill="none" stroke="#58a6ff" strokeWidth="1.5" />
        <circle cx="-9" cy="-26" r="2" fill="#58a6ff" />
        <circle cx="9" cy="-26" r="2" fill="#58a6ff" />

        {/* Eye shine */}
        <circle cx="-7" cy="-28" r="0.8" fill="#c9d1d9" />
        <circle cx="11" cy="-28" r="0.8" fill="#c9d1d9" />

        {/* Nose */}
        <ellipse cx="0" cy="-18" rx="2" ry="1.5" fill="#58a6ff" opacity="0.7" />

        {/* Whiskers */}
        <line x1="-20" y1="-18" x2="-8" y2="-17" stroke="#58a6ff" strokeWidth="0.8" opacity="0.6" />
        <line x1="-18" y1="-14" x2="-7" y2="-15" stroke="#58a6ff" strokeWidth="0.8" opacity="0.6" />
        <line x1="20" y1="-18" x2="8" y2="-17" stroke="#58a6ff" strokeWidth="0.8" opacity="0.6" />
        <line x1="18" y1="-14" x2="7" y2="-15" stroke="#58a6ff" strokeWidth="0.8" opacity="0.6" />

        {/* Mouth / smile */}
        <path d="M -4,-13 Q 0,-10 4,-13" fill="none" stroke="#58a6ff" strokeWidth="1" />

        {/* Ninja belt / sash */}
        <line x1="-28" y1="8" x2="28" y2="8" stroke="#58a6ff" strokeWidth="2" />
        <rect x="-5" y="4" width="10" height="8" rx="1" fill="none" stroke="#58a6ff" strokeWidth="1.5" />

        {/* Arms */}
        {/* Left arm holding staff */}
        <path d="M -26,5 Q -40,-5 -38,-20" fill="none" stroke="#58a6ff" strokeWidth="1.8" />
        {/* Left hand */}
        <circle cx="-38" cy="-20" r="4" fill="none" stroke="#58a6ff" strokeWidth="1.5" />

        {/* Right arm */}
        <path d="M 26,5 Q 38,0 40,-15" fill="none" stroke="#58a6ff" strokeWidth="1.8" />
        {/* Right hand */}
        <circle cx="40" cy="-15" r="4" fill="none" stroke="#58a6ff" strokeWidth="1.5" />

        {/* Staff / Bo weapon */}
        <line x1="-42" y1="-55" x2="44" y2="30" stroke="#58a6ff" strokeWidth="2" opacity="0.9" />

        {/* Legs */}
        <path d="M -12,48 Q -15,55 -20,58" fill="none" stroke="#58a6ff" strokeWidth="1.8" />
        <path d="M 12,48 Q 15,55 20,58" fill="none" stroke="#58a6ff" strokeWidth="1.8" />

        {/* Feet */}
        <ellipse cx="-22" cy="59" rx="7" ry="3" fill="none" stroke="#58a6ff" strokeWidth="1.5" />
        <ellipse cx="22" cy="59" rx="7" ry="3" fill="none" stroke="#58a6ff" strokeWidth="1.5" />

        {/* Tail */}
        <path d="M 15,40 Q 45,35 50,15 Q 52,8 48,5" fill="none" stroke="#58a6ff" strokeWidth="1.5" />
      </g>

      {/* Small critter on the left (a mouse/rat) */}
      <g transform="translate(145, 242)" fill="none" stroke="#8b949e" strokeWidth="1">
        <ellipse cx="0" cy="0" rx="8" ry="5" />
        <circle cx="-7" cy="-3" r="3" />
        <circle cx="-9" cy="-4" r="1" fill="#8b949e" />
        <line x1="-10" y1="-2" x2="-14" y2="-3" />
        <line x1="-10" y1="-1" x2="-15" y2="0" />
        <path d="M 8,0 Q 15,-5 18,-8" />
        {/* Ears */}
        <ellipse cx="-5" cy="-6" rx="2" ry="3" />
        <ellipse cx="-3" cy="-6" rx="2" ry="3" />
      </g>

      {/* Small critter on the right (another creature) */}
      <g transform="translate(360, 244)" fill="none" stroke="#8b949e" strokeWidth="1">
        <ellipse cx="0" cy="0" rx="6" ry="4" />
        <circle cx="5" cy="-2" r="2.5" />
        <circle cx="6" cy="-3" r="0.8" fill="#8b949e" />
        <path d="M -6,0 Q -10,-3 -12,-6" />
        <ellipse cx="4" cy="-5" rx="1.5" ry="2.5" />
        <ellipse cx="6" cy="-5" rx="1.5" ry="2.5" />
      </g>
    </svg>
  );
};

export default InboxZeroIllustration;
