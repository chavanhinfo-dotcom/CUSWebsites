"use client";
import { verticals } from "@/lib/content";
import { useContent } from "@/components/e/content";
import { BTN, BTN_SOFT, CountUp, pickGroup, type GroupId } from "./ui";

// which finder group each business tile opens
const TILE_GROUP: Record<string, GroupId> = { appliances: "appliances", "two-wheelers": "two-wheelers", cars: "cars", commercial: "commercial" };

/**
 * The opening, as tiles: the headline with the two things to do, the group's figures (counting up), and the
 * four businesses, each of which opens the showroom finder on its franchises.
 */
export default function HeroG() {
  const { company, figures } = useContent();
  return (
    <section id="top" className="pt-[92px] md:pt-[96px]">
      <div className="g-wrap grid gap-3 md:gap-4 lg:grid-cols-12">
        <div className="g-tile relative flex flex-col overflow-hidden p-7 animate-[g-in_0.8s_cubic-bezier(0.22,1,0.36,1)_both] md:p-10 lg:col-span-7">
          <span className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(199,138,31,0.14),transparent_70%)]" aria-hidden />
          <p className="g-eyebrow relative">
            Since {company.since} · {company.hq}
          </p>
          <h1 className="g-h relative mt-4 text-[length:clamp(38px,5.2vw,72px)]">
            From homes to highways, <span className="text-[var(--g-gold)]">one family</span> since {company.since}.
          </h1>
          <p className="relative mt-5 max-w-lg text-[16px] leading-relaxed text-[var(--g-mute)]">
            {company.tagline}: home appliances, two-wheelers, passenger cars and commercial vehicles.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-10">
            <a href="#showrooms" className={BTN}>
              Find a showroom <span aria-hidden>→</span>
            </a>
            <a href="#about" className={BTN_SOFT}>
              Our story
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:col-span-5">
          {figures.map((f, i) => (
            <div
              key={f.label}
              className={`flex min-h-[148px] flex-col justify-between rounded-[28px] p-6 animate-[g-in_0.8s_cubic-bezier(0.22,1,0.36,1)_both] md:min-h-[186px] md:p-7 ${i === 0 ? "bg-[var(--g-navy)] text-white" : "g-tile"}`}
              style={{ animationDelay: `${0.08 + i * 0.06}s` }}
            >
              <p className={`text-[length:clamp(40px,4.4vw,62px)] font-extrabold leading-none tracking-[-0.045em] ${i === 0 ? "" : "text-[var(--g-navy)]"}`}>
                <CountUp value={f.value} />
                {f.suffix && <span className="text-[var(--g-gold)]">{f.suffix}</span>}
              </p>
              <p className={`mt-4 text-[13px] font-semibold leading-snug ${i === 0 ? "text-white/70" : "text-[var(--g-mute)]"}`}>{f.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:col-span-12 lg:grid-cols-4">
          {verticals.map((v, i) => (
            <a
              key={v.id}
              href="#showrooms"
              onClick={() => pickGroup(TILE_GROUP[v.id])}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[28px] bg-[var(--g-navy)] animate-[g-in_0.8s_cubic-bezier(0.22,1,0.36,1)_both] sm:aspect-[4/3]"
              style={{ animationDelay: `${0.3 + i * 0.06}s` }}
              aria-label={`${v.title}: find its showrooms`}
            >
              <img src={v.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]" />
              <span className="absolute inset-0 bg-gradient-to-t from-[rgba(6,28,63,0.85)] via-[rgba(6,28,63,0.2)] to-transparent" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 p-4 text-white md:p-6">
                <span className="block text-[12px] font-semibold text-white/70">Since {v.since}</span>
                <span className="mt-1 block text-[17px] font-extrabold leading-tight tracking-tight md:text-[22px]">{v.title}</span>
                <span className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--g-gold-soft)]">
                  Find showrooms <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
