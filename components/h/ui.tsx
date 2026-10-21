// Option H's building blocks: masked text for the rising reveals, the decades as a word, and the two buttons.
import { scrollToHash } from "@/lib/lenis";

/** Splits text into masked words (or letters) so GSAP can slide them up into view. */
export function Split({ text, by = "word", itemClass = "" }: { text: string; by?: "word" | "char"; itemClass?: string }) {
  const words = text.split(" ");
  return (
    <span aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="line-mask" aria-hidden>
          {by === "word" ? (
            <span className={`inline-block ${itemClass}`}>{word}</span>
          ) : (
            word.split("").map((c, ci) => (
              <span key={ci} className={`inline-block ${itemClass}`}>
                {c}
              </span>
            ))
          )}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </span>
  );
}

/** The decades since a year, as a word ("Six decades"). */
export function decades(since: number) {
  const n = Math.floor((new Date().getFullYear() - since) / 10);
  const w = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n] ?? String(n);
  return `${w} decade${n === 1 ? "" : "s"}`;
}

/**
 * A pill button whose fill sweeps up from below on hover. In-page links (#…) glide there; others open normally.
 * tone: "gold" (gold outline on dark), "pearl" (pale outline on dark), "navy" (navy, on light), "light"
 * (outline on light); each fills gold.
 */
export function Btn({ href, children, tone = "gold", external = false }: { href: string; children: React.ReactNode; tone?: "gold" | "pearl" | "navy" | "light"; external?: boolean }) {
  const look = {
    gold: "border-[var(--h-gold)]/70 text-[var(--h-gold-2)] hover:text-[var(--h-night)]",
    pearl: "border-white/30 text-[var(--h-pearl)] hover:text-[var(--h-night)] hover:border-[var(--h-gold)]",
    navy: "border-[var(--h-brand)] bg-[var(--h-brand)] text-white hover:text-[var(--h-night)]",
    light: "border-[var(--h-ink)]/25 text-[var(--h-ink)] hover:text-[var(--h-night)] hover:border-[var(--h-gold)]",
  }[tone];
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={(e) => {
        if (!href.startsWith("#")) return;
        e.preventDefault();
        scrollToHash(href);
      }}
      className={`group relative inline-flex h-[52px] items-center justify-center overflow-hidden rounded-full border px-8 text-[12px] font-semibold uppercase tracking-[0.2em] transition-colors duration-500 ${look}`}
    >
      <span className="absolute inset-0 translate-y-full rounded-full bg-[var(--h-gold)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0" aria-hidden />
      <span className="relative flex items-center gap-3">{children}</span>
    </a>
  );
}
