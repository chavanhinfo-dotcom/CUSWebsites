"use client";
import type { Category } from "@/lib/content";

// ---------------------------------------------------------------- top-down vehicles (front = up)

export function Vehicle({ cat }: { cat: Category }) {
  switch (cat) {
    case "heritage":
      return (
        <svg viewBox="-30 -70 60 140" className="h-[110px] w-[48px] overflow-visible">
          <rect x="-24" y="-30" width="48" height="62" rx="4" fill="#8b5a3c" />
          <rect x="-20" y="-26" width="40" height="54" rx="2" fill="#a06a47" />
          {[[-9, -12, "#b53a30"], [9, -12, "#2d4a7a"], [-9, 8, "#d29b2c"], [9, 8, "#e6e1d6"]].map(([x, y, c], i) => (
            <rect key={i} x={(x as number) - 8} y={(y as number) - 8} width="16" height="16" rx="7" fill={c as string} />
          ))}
          <rect x="-29" y="-6" width="5" height="22" rx="2" fill="#2a2a2a" />
          <rect x="24" y="-6" width="5" height="22" rx="2" fill="#2a2a2a" />
          <path d="M-14 -30 L-14 -52 M14 -30 L14 -52 M-14 -50 H14" stroke="#6b4a33" strokeWidth="3" />
          <circle cx="0" cy="-60" r="8" fill="#1d1814" />
          <path d="M-12 -56 Q0 -48 12 -56" stroke="#f3ede2" strokeWidth="6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "appliances":
      return (
        <svg viewBox="-24 -50 48 100" className="h-[100px] w-[48px] overflow-visible">
          <rect x="-21" y="-46" width="42" height="92" rx="9" fill="#f5f5f2" stroke="#d7d7d2" />
          <path d="M-18 -30 Q0 -40 18 -30 L16 -20 Q0 -26 -16 -20 Z" fill="#1d2433" />
          <rect x="-19" y="-14" width="38" height="56" rx="3" fill="#ffffff" stroke="#e1e1dc" />
          <rect x="-2" y="-14" width="4" height="56" fill="#c9a24a" />
          <rect x="-16" y="-48" width="8" height="3" rx="1" fill="#fff6d6" />
          <rect x="8" y="-48" width="8" height="3" rx="1" fill="#fff6d6" />
        </svg>
      );
    case "two-wheelers":
      return (
        <svg viewBox="-16 -40 32 80" className="h-[80px] w-[32px] overflow-visible">
          <rect x="-5" y="-36" width="10" height="16" rx="5" fill="#1b1b1d" />
          <rect x="-5" y="22" width="10" height="16" rx="5" fill="#1b1b1d" />
          <rect x="-9" y="-22" width="18" height="44" rx="9" fill="#c9a24a" />
          <path d="M-15 -24 H15" stroke="#2a2a2a" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="0" cy="2" rx="10" ry="12" fill="#2d4a7a" />
          <circle cx="0" cy="-6" r="7" fill="#c9a24a" stroke="#1b1b1d" strokeWidth="1.5" />
        </svg>
      );
    case "cars":
      return (
        <svg viewBox="-22 -46 44 92" className="h-[92px] w-[44px] overflow-visible">
          <rect x="-20" y="-44" width="40" height="88" rx="12" fill="#121214" />
          <path d="M-16 -22 Q0 -30 16 -22 L14 -10 Q0 -14 -14 -10 Z" fill="#5b6472" />
          <rect x="-13" y="-8" width="26" height="30" rx="5" fill="#26272b" />
          <path d="M-14 26 Q0 32 14 26 L13 34 Q0 38 -13 34 Z" fill="#5b6472" />
          <rect x="-16" y="-45" width="8" height="3" rx="1" fill="#fff6d6" />
          <rect x="8" y="-45" width="8" height="3" rx="1" fill="#fff6d6" />
          <rect x="-16" y="42" width="8" height="2.5" rx="1" fill="#c0392b" />
          <rect x="8" y="42" width="8" height="2.5" rx="1" fill="#c0392b" />
        </svg>
      );
    case "commercial":
      return (
        <svg viewBox="-24 -80 48 160" className="h-[160px] w-[48px] overflow-visible">
          <rect x="-21" y="-78" width="42" height="34" rx="6" fill="#121214" />
          <path d="M-17 -68 H17 L15 -58 H-15 Z" fill="#5b6472" />
          <rect x="-4" y="-44" width="8" height="6" fill="#2a2a2a" />
          <rect x="-23" y="-38" width="46" height="116" rx="2" fill="#f4f4f1" stroke="#d7d7d2" />
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M-23 ${-28 + i * 11} H23`} stroke="#e3e3de" strokeWidth="1.5" />
          ))}
          <rect x="-23" y="-38" width="46" height="5" fill="#c9a24a" />
        </svg>
      );
  }
}

