import OptionSwitch from "@/components/OptionSwitch";
import { ContentProvider } from "@/components/e/content";
import NavG from "@/components/g/NavG";
import HeroG from "@/components/g/HeroG";
import FinderG from "@/components/g/FinderG";
import AboutG from "@/components/g/AboutG";
import JourneyG from "@/components/g/JourneyG";
import LeadershipG from "@/components/g/LeadershipG";
import GalleryG from "@/components/g/GalleryG";
import FaqG from "@/components/g/FaqG";
import FooterG from "@/components/g/FooterG";

// Design option G, "Tiles": the page as a grid of rounded tiles on a soft grey ground, in the logo's navy and
// gold, with a modern sans-serif. Built around a showroom finder (every franchise, by business or by search)
// and a year picker for the journey. Its content is option E's (the same live database, edited on
// /option-e/admin), and the logo is used exactly as supplied.
export default function OptionG() {
  return (
    <>
      <ContentProvider>
        <NavG />
        <main>
          <HeroG />
          <FinderG />
          <AboutG />
          <JourneyG />
          <LeadershipG />
          <GalleryG />
          <FaqG />
        </main>
        <FooterG />
      </ContentProvider>
      <OptionSwitch current="g" />
    </>
  );
}
