import { brands } from "@/lib/content";
import { Eyebrow } from "./ui";

// what each brand is sold as, shown under its name
const KIND: Record<string, string> = {
  Samsung: "Home appliances",
  "Hero MotoCorp": "Two-wheelers",
  "Royal Enfield": "Motorcycles",
  "Ather Electric": "Electric scooters",
  "Kinetic Honda": "Two-wheelers",
  "Maruti Suzuki Arena": "Passenger cars",
  Nexa: "Premium cars",
  "Tata Commercial": "Commercial vehicles",
  "Maruti Commercial": "Commercial vehicles",
  "Hero Premia": "Premium two-wheelers",
};

// A strip of the group's brand partners, moving continuously, between the highway and the story.
export default function BrandsX() {
  return (
    <section aria-label="Our brand partners" className="relative bg-x-white py-6 text-x-black md:py-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4 px-4 md:mb-5 md:px-8">
        <Eyebrow>Our brand partners</Eyebrow>
        <p className="micro text-x-mute">
          {brands.length}+ brands <span className="text-x-gold">·</span> four businesses
        </p>
      </div>

      {/* the list twice over, moved by half its width, so it loops without a seam; edges fade out */}
      <div className="overflow-hidden border-y border-x-line [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max marquee-l hover:[animation-play-state:paused]" style={{ animationDuration: "45s" }}>
          {[...brands, ...brands].map((b, i) => (
            <li
              key={i}
              aria-hidden={i >= brands.length || undefined}
              className="group flex shrink-0 items-center gap-3 border-r border-x-line px-6 py-3 md:px-9 md:py-4"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-x-gold transition-transform duration-500 group-hover:scale-150" />
              <span>
                <span className="wide block whitespace-nowrap text-[clamp(15px,1.5vw,22px)] !leading-none text-x-black/75 transition-colors duration-500 group-hover:text-x-black">
                  {b}
                </span>
                <span className="micro mt-1.5 block !text-[9px] whitespace-nowrap text-x-mute">{KIND[b] ?? ""}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
