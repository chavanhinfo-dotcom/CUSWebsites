"use client";
import { motion } from "framer-motion";
import { verticals } from "@/lib/content";
import { scrollToHash } from "@/lib/lenis";
import { statesOf, useContent } from "./content";
import { ease } from "./ui";
import { LOGO_ALT, LOGO_CUTOUT } from "./logo";

// Dark call to action with radiating rings, then a white footer closed by a giant wordmark.
export default function FooterX() {
  const { company, districts: places } = useContent();
  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    scrollToHash(href);
  };
  const districts = places.map((d) => d.name);
  const marquee = ["Home Appliances", "Two-Wheelers", "Passenger Cars", "Commercial Vehicles", ...districts];

  return (
    <footer id="contact">
      <div className="relative grid min-h-[90svh] place-items-center overflow-hidden bg-x-black px-4 text-center text-white">
        {[1, 2, 3, 4, 5].map((k) => (
          <span
            key={k}
            className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.07] animate-[ring_6s_ease-out_infinite]"
            style={{ width: `${k * 26}vmax`, animationDelay: `${k * 0.6}s` }}
            aria-hidden
          />
        ))}
        <div className="relative">
          <h2 className="wide text-[clamp(48px,8vw,140px)]">
            <motion.span className="block" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, ease }}>Ready to</motion.span>
            <motion.span className="block" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.08, ease }}>
              drive home<span className="text-x-gold">?</span>
            </motion.span>
          </h2>
          <p className="mx-auto mt-8 max-w-md text-[16px] leading-relaxed text-white/60">
            Visit any of our showrooms across {districts.join(", ")}. Six decades of experience, one visit away.
          </p>
        </div>
      </div>

      <div className="bg-x-white px-4 pt-20 md:px-8">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            {/* the logo exactly as supplied */}
            <img src={LOGO_CUTOUT} alt={LOGO_ALT} loading="lazy" decoding="async" className="w-48" />
            <p className="micro mt-6 text-x-mute">One group.<br />Every road ahead.</p>
          </div>
          <div>
            <p className="micro mb-4 text-x-grey">Group</p>
            <ul className="space-y-2 text-[14px]">
              {[["#about", "About"], ["#journey", "Journey"], ["#leadership", "Leadership"], ["#gallery", "Gallery"], ["#faq", "F.A.Q"]].map(([h, l]) => (
                <li key={h}><a href={h} onClick={(e) => go(e, h)} className="transition-colors hover:text-x-gold">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="micro mb-4 text-x-grey">Businesses</p>
            <ul className="space-y-2 text-[14px]">{verticals.map((v) => <li key={v.id}>{v.title}</li>)}</ul>
          </div>
          <div>
            <p className="micro mb-4 text-x-grey">Head office</p>
            <p className="text-[14px] leading-relaxed">{company.address || company.hq}</p>
            {(company.phone || company.email) && (
              <p className="mt-3 space-y-1 text-[14px] leading-relaxed">
                {company.phone && <a href={`tel:${company.phone.replace(/[^\d+]/g, "")}`} className="block transition-colors hover:text-x-gold">{company.phone}</a>}
                {company.email && <a href={`mailto:${company.email}`} className="block transition-colors hover:text-x-gold">{company.email}</a>}
              </p>
            )}
            <p className="micro mb-4 mt-8 text-x-grey">Operating regions</p>
            <p className="text-[14px] leading-relaxed">{statesOf(places).join(" / ")}</p>
          </div>
        </div>

        <div className="mt-16 overflow-hidden border-y border-x-line py-4" aria-hidden>
          <div className="flex w-max gap-8 whitespace-nowrap marquee-l">
            {[...marquee, ...marquee].map((m, i) => (
              <span key={i} className="text-[clamp(20px,2.4vw,34px)] text-x-grey">{m} <span className="text-x-gold">·</span></span>
            ))}
          </div>
        </div>

        <div className="micro flex flex-col gap-3 py-6 text-x-mute md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} {company.name}. {company.motto}</span>
          <span>Brand names and product renders © their respective manufacturers · Photography: Unsplash</span>
        </div>
        {/* (a touch under the full width, and clipped sideways only, so it never makes the page scroll sideways) */}
        <p className="wide select-none overflow-x-clip pb-4 text-center text-[16.5vw] !leading-[0.8] text-[#e7e7e3]" aria-hidden>Chavan</p>
      </div>
    </footer>
  );
}
