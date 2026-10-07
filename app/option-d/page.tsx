import SmoothScroll from "@/components/SmoothScroll";
import OptionSwitch from "@/components/OptionSwitch";
import PreloaderD from "@/components/d/PreloaderD";
import NavD from "@/components/d/NavD";
import FlowJourneyD from "@/components/d/FlowJourneyD";
import FeaturesD from "@/components/d/FeaturesD";
import StandardsD from "@/components/d/StandardsD";
import LegacyD from "@/components/d/LegacyD";
import PresenceD from "@/components/d/PresenceD";
import FaqD from "@/components/d/FaqD";
import FooterD from "@/components/d/FooterD";

// Design option D: clean, light and engineered, with the journey as a monochrome 3D model under the hero.
export default function OptionD() {
  return (
    <>
      <SmoothScroll />
      <PreloaderD />
      <NavD />
      <main>
        <FlowJourneyD />
        <FeaturesD />
        <StandardsD />
        <LegacyD />
        <PresenceD />
        <FaqD />
      </main>
      <FooterD />
      <OptionSwitch current="d" />
    </>
  );
}
