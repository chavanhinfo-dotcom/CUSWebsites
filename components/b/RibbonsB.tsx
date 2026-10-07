import { brands } from "@/lib/content";

// Two crossing brand ribbons running in opposite directions.
export default function RibbonsB() {
  const row = [...brands, ...brands];
  const band = (dir: "l" | "r", cls: string) => (
    <div className={`overflow-hidden py-4 ${cls}`}>
      <div className={`flex w-max gap-10 whitespace-nowrap marquee-${dir}`}>
        {row.map((b, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-3xl md:text-5xl">
            {b} <span className="font-hand text-2xl opacity-70">✳</span>
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <section aria-label="Brand partners" className="relative h-48 overflow-hidden md:h-60">
      <div className="absolute inset-x-[-5%] top-8 rotate-[-3deg] md:top-10">{band("l", "bg-navy text-paper")}</div>
      <div className="absolute inset-x-[-5%] top-24 rotate-[2deg] md:top-32">{band("r", "bg-brass text-navy")}</div>
    </section>
  );
}
