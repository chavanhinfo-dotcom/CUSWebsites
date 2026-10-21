import OptionSwitch from "@/components/OptionSwitch";
import { ContentProvider } from "@/components/e/content";
import NavF from "@/components/f/NavF";
import HeroF from "@/components/f/HeroF";
import AboutF from "@/components/f/AboutF";
import BusinessesF from "@/components/f/BusinessesF";
import FranchisesF from "@/components/f/FranchisesF";
import JourneyF from "@/components/f/JourneyF";
import PresenceF from "@/components/f/PresenceF";
import LeadershipF from "@/components/f/LeadershipF";
import GalleryF from "@/components/f/GalleryF";
import FaqF from "@/components/f/FaqF";
import FooterF from "@/components/f/FooterF";

// Design option F: the simplest of the options. A calm page in the logo's own navy, gold and ivory with a
// Bodoni display face; it scrolls normally, opens at once (no preloader), and its only motion is a gentle
// fade as each part comes into view. Its content is option E's (the same live database, edited on
// /option-e/admin), and the logo is used exactly as supplied.
export default function OptionF() {
  return (
    <>
      <ContentProvider>
        <NavF />
        <main>
          <HeroF />
          <AboutF />
          <BusinessesF />
          <FranchisesF />
          <JourneyF />
          <PresenceF />
          <LeadershipF />
          <GalleryF />
          <FaqF />
        </main>
        <FooterF />
      </ContentProvider>
      <OptionSwitch current="f" />
    </>
  );
}
