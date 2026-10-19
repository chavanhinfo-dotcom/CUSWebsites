"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useContent, type Leader as Person } from "./content";
import { Eyebrow, Headline, ease } from "./ui";

const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

/**
 * A portrait in a fine frame: the photograph (uploaded on the admin page) in black and white, colour on
 * hover; until there is one, an engraved monogram stands in its frame.
 */
function Portrait({ person, className = "" }: { person: Person; className?: string }) {
  // (a photograph that fails to load gives way to the monogram, never a broken image)
  const [failed, setFailed] = useState<string | null>(null);
  const src = person.photo && person.photo !== failed ? person.photo : undefined;
  // (the frame is what is watched for coming into view; the picture inside it is what unveils, from the
  // foot up: a fully clipped element can read as off screen, so it must not be the one watched)
  return (
    <motion.div initial="hidden" whileInView="shown" viewport={{ once: true, amount: 0.15 }} className={`group relative overflow-hidden ${className}`}>
      <motion.div
        variants={{ hidden: { clipPath: "inset(100% 0 0 0)" }, shown: { clipPath: "inset(0% 0 0 0)" } }}
        transition={{ duration: 1.3, ease }}
        className="absolute inset-0 bg-x-ink"
      >
      {src ? (
        <img src={src} alt={person.name} loading="lazy" decoding="async" onError={() => setFailed(src)} className="absolute inset-0 h-full w-full object-cover grayscale transition duration-1000 ease-out group-hover:scale-[1.03] group-hover:grayscale-0" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_80%_at_50%_10%,#2c2c2e_0%,#141415_55%,#0a0a0b_100%)]" aria-hidden>
          <span className="wide select-none text-[clamp(64px,8vw,132px)] text-transparent [-webkit-text-stroke:1px_rgba(201,162,74,0.75)]">{person.initials}</span>
        </div>
      )}
      {/* an inner hairline, and a gold line that draws along the foot on hover */}
      <span className="pointer-events-none absolute inset-3 border border-white/[0.12] md:inset-4" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-x-gold transition-transform duration-700 group-hover:scale-x-100" aria-hidden />
      </motion.div>
    </motion.div>
  );
}

/** A generation's label: a numeral, its name and era, over a gold rule. */
function Generation({ index, name, era }: { index: number; name: string; era: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-x-line pt-5">
      <span className="wide text-[13px] text-x-gold">{ROMAN[index]}</span>
      <span className="h-px w-6 bg-x-gold/60" />
      <p className="micro text-x-mute">
        {name} <span className="text-x-grey">· {era}</span>
      </p>
    </div>
  );
}

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 1, delay, ease },
});

// The three generations, set as a portrait gallery: the founder first, large, with his story beside him; then
// the generations that followed, each under its numeral.
export default function LeadershipX() {
  const [founding, ...after] = useContent().leadership;
  const founder = founding.people[0];
  return (
    <section id="leadership" className="px-4 py-28 md:px-8 md:py-40">
      <div className="grid gap-8 md:grid-cols-[1.3fr_1fr]">
        {/* (on a phone the size follows the screen width, so "generations." always fits on one line) */}
        <Headline lines={["Led by", "three", "generations."]} grey={2} className="text-[clamp(28px,8.6vw,40px)] md:text-[clamp(40px,6vw,96px)]" />
        <div className="flex flex-col justify-end gap-5">
          <Eyebrow>Leadership · Since 1960</Eyebrow>
          <p className="max-w-md text-[17px] leading-relaxed text-x-mute">
            A vision that began with one trader in Solapur, carried forward by his sons and now by the next generation.
          </p>
        </div>
      </div>

      {/* the founder */}
      <div className="mt-20 grid items-end gap-10 md:mt-28 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 lg:gap-24">
        <Portrait person={founder} className="aspect-[4/5] w-full max-w-[520px]" />
        <div className="md:pb-4">
          <motion.div {...rise()}>
            <Generation index={0} name={founding.generation} era={founding.era} />
          </motion.div>
          <motion.p {...rise(0.08)} className="mt-10 text-[clamp(22px,2.4vw,38px)] font-medium leading-[1.3] tracking-[-0.015em]">
            {founder.text}
          </motion.p>
          <motion.div {...rise(0.16)} className="mt-10 flex items-end justify-between gap-6 md:mt-14">
            <div>
              <p className="wide text-[clamp(17px,1.5vw,22px)]">{founder.name}</p>
              <p className="micro mt-2 text-x-mute">{founder.role} · Est. {founding.era}</p>
            </div>
            <span className="wide hidden text-[clamp(40px,4.4vw,72px)] !leading-none text-[#e7e7e3] sm:block" aria-hidden>{founding.era}</span>
          </motion.div>
        </div>
      </div>

      {/* the generations that followed */}
      <div className="mt-24 grid gap-x-8 gap-y-20 md:mt-36 md:grid-cols-3 lg:gap-x-12">
        {after.map((g, gi) => {
          // (a generation whose members share one story tells it once, under its label)
          const shared = g.people.every((p) => p.text === g.people[0].text) && g.people.length > 1;
          return (
            <div key={`${gi}-${g.generation}`} className={g.people.length > 1 ? "md:col-span-2" : ""}>
              <motion.div {...rise()}>
                <Generation index={gi + 1} name={g.generation} era={g.era} />
              </motion.div>
              {shared && <motion.p {...rise(0.06)} className="mt-6 max-w-xl text-[15px] leading-relaxed text-x-mute">{g.people[0].text}</motion.p>}
              <div className={`mt-10 grid gap-10 ${g.people.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {g.people.map((p, pi) => (
                  <article key={`${pi}-${p.name}`}>
                    <Portrait person={p} className="aspect-[3/4] w-full" />
                    <motion.div {...rise(0.08 + pi * 0.06)} className="mt-6">
                      <h3 className="wide text-[clamp(15px,1.25vw,19px)]">{p.name}</h3>
                      <p className="micro mt-2 text-x-mute">{p.role}</p>
                      {!shared && <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-x-mute">{p.text}</p>}
                    </motion.div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
