import Link from "next/link";

// Floating toggle so the client can compare the two design directions.
export default function OptionSwitch({ current }: { current: "a" | "b" | "c" | "d" | "e" }) {
  const item = (key: "a" | "b" | "c" | "d" | "e", href: string, label: string) => (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 transition-colors ${
        current === key ? "bg-[#c99a2e] text-[#0c0b09]" : "text-white/75 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="fixed bottom-4 left-4 z-[80] flex items-center gap-1 rounded-full border border-white/15 bg-[#0c0b09]/85 p-1 text-xs font-semibold uppercase tracking-wider shadow-lg backdrop-blur">
      <span className="px-2 text-white/50">Design</span>
      {item("a", "/", "A")}
      {item("b", "/option-b/", "B")}
      {item("c", "/option-c/", "C")}
      {item("d", "/option-d/", "D")}
      {item("e", "/option-e/", "E")}
    </div>
  );
}
