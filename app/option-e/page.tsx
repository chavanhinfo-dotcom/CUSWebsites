import SmoothScroll from "@/components/SmoothScroll";
import OptionSwitch from "@/components/OptionSwitch";
import PreloaderX from "@/components/e/PreloaderX";
import NavX from "@/components/e/NavX";
import HeroX from "@/components/e/HeroX";
import StoryX from "@/components/e/StoryX";
import JourneyX from "@/components/e/JourneyX";
import HighwayX from "@/components/e/HighwayX";
import BrandsX from "@/components/e/BrandsX";
import DealersX from "@/components/e/DealersX";
import LeadershipX from "@/components/e/LeadershipX";
import GalleryX from "@/components/e/GalleryX";
import PresenceX from "@/components/e/PresenceX";
import FaqX from "@/components/e/FaqX";
import FooterX from "@/components/e/FooterX";
import { ContentProvider } from "@/components/e/content";

// Design option E, modelled on the structure and motion of unitedcarriers.com: a dotted-Earth hero that dives
// to Solapur and closes into cloud, a top-down highway that opens out of that cloud and rises back into it,
// a pinned 3D story (fleet → businesses → top-down), the journey through the milestones in full 3D, then
// presence, leadership, the family gallery, F.A.Q and a wordmark footer.
export default function OptionE() {
  return (
    <>
      <SmoothScroll />
      <PreloaderX />
      <NavX />
      {/* the sections read their content (live, from the admin page's database) from here */}
      <ContentProvider>
        <main>
          <HeroX />
          <HighwayX />
          <BrandsX />
          <DealersX />
          <StoryX />
          <JourneyX />
          <PresenceX />
          <LeadershipX />
          <GalleryX />
          <FaqX />
        </main>
        <FooterX />
      </ContentProvider>
      <OptionSwitch current="e" />
    </>
  );
}
