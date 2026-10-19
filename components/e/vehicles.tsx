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
    case "two-wheelers": // Royal Enfield Classic 350 from above: teardrop tank, wide bars, split seats
      return (
        <svg viewBox="-18 -46 36 92" className="h-[92px] w-[36px] overflow-visible">
          <rect x="-4.5" y="-44" width="9" height="20" rx="4.5" fill="#1b1b1d" />
          <rect x="-5" y="24" width="10" height="20" rx="5" fill="#1b1b1d" />
          <path d="M-6 -30 Q0 -36 6 -30 L5 -22 H-5 Z" fill="#6b1d1d" />
          <path d="M-17 -24 H17" stroke="#c4c8cd" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="0" cy="-28" r="4.5" fill="#fff5dc" stroke="#1b1b1d" strokeWidth="1.2" />
          <ellipse cx="0" cy="-12" rx="7.5" ry="11" fill="#6b1d1d" />
          <ellipse cx="0" cy="-12" rx="2.2" ry="9" fill="#c4c8cd" />
          <rect x="-6" y="0" width="12" height="11" rx="4" fill="#2a2a2d" />
          <rect x="-5.5" y="13" width="11" height="10" rx="4" fill="#2a2a2d" />
          <path d="M-6 26 Q0 31 6 26" stroke="#6b1d1d" strokeWidth="5" fill="none" />
          <rect x="8" y="4" width="3.5" height="26" rx="1.7" fill="#c4c8cd" />
        </svg>
      );
    case "cars": // Maruti Suzuki Swift from above: red body, floating black roof
      return (
        <svg viewBox="-22 -46 44 92" className="h-[92px] w-[44px] overflow-visible">
          <rect x="-20" y="-44" width="40" height="88" rx="14" fill="#b3121c" />
          <path d="M-16 -18 Q0 -26 16 -18 L14 -6 Q0 -10 -14 -6 Z" fill="#1d2433" />
          <rect x="-15" y="-6" width="30" height="34" rx="6" fill="#111114" />
          <path d="M-14 28 Q0 33 14 28 L13 35 Q0 38 -13 35 Z" fill="#1d2433" />
          <path d="M-12 -40 Q0 -44 12 -40" stroke="#8f0d16" strokeWidth="1.5" fill="none" />
          <rect x="-17" y="-45" width="9" height="3" rx="1" fill="#fff6d6" />
          <rect x="8" y="-45" width="9" height="3" rx="1" fill="#fff6d6" />
          <rect x="-17" y="42" width="7" height="2.5" rx="1" fill="#ff3b30" />
          <rect x="10" y="42" width="7" height="2.5" rx="1" fill="#ff3b30" />
          <rect x="-23" y="-12" width="4" height="5" rx="1.5" fill="#111114" />
          <rect x="19" y="-12" width="4" height="5" rx="1.5" fill="#111114" />
        </svg>
      );
    case "commercial": // Tata Signa from above
      return (
        <svg viewBox="-24 -80 48 160" className="h-[160px] w-[48px] overflow-visible">
          <rect x="-21" y="-78" width="42" height="34" rx="6" fill="#f4f4f1" stroke="#d7d7d2" />
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

