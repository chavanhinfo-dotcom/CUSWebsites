import SmoothScroll from "@/components/SmoothScroll";
import OptionSwitch from "@/components/OptionSwitch";
import { ContentProvider } from "@/components/e/content";
import PreloaderH from "@/components/h/PreloaderH";
import NavH from "@/components/h/NavH";
import HeroH from "@/components/h/HeroH";
import IntroH from "@/components/h/IntroH";
import HousesH from "@/components/h/HousesH";
import ShowroomsH from "@/components/h/ShowroomsH";
import LegacyH from "@/components/h/LegacyH";
import JourneyH from "@/components/h/JourneyH";
import PresenceH from "@/components/h/PresenceH";
import GalleryH from "@/components/h/GalleryH";
import FaqH from "@/components/h/FaqH";
import InvitationH from "@/components/h/InvitationH";
import FooterH from "@/components/h/FooterH";

// Design option H, "Royal": the logo's navy deepened to midnight, with champagne gold, ivory and pearl, set in
// Cormorant. An opening through a medallion; the four businesses in an arch, then as showroom cards that
// travel sideways with their vehicles driving in; template A's 3D journey (its drive and transitions
// unchanged), then the marques; the districts on a watch dial; the family in arched frames; the album; an
// invitation.
// Content is option E's (the same live database, edited on /option-e/admin); the logo is used exactly as
// supplied, always on its own ivory ground.
export default function OptionH() {
  return (
    <>
      {/* SmoothScroll mounts before the preloader, so the smooth scroll exists when the opening locks it */}
      <SmoothScroll />
      <ContentProvider>
        <PreloaderH />
        <NavH />
        <main>
          <HeroH />
          <IntroH />
          <HousesH />
          <JourneyH />
          <ShowroomsH />
          <PresenceH />
          <LegacyH />
          <GalleryH />
          <FaqH />
          <InvitationH />
        </main>
        <FooterH />
      </ContentProvider>
      <OptionSwitch current="h" />
    </>
  );
}
