import SmoothScroll from "@/components/SmoothScroll";
import OptionSwitch from "@/components/OptionSwitch";
import PreloaderX from "@/components/e/PreloaderX";
import NavX from "@/components/e/NavX";
import HeroX from "@/components/e/HeroX";
import AboutX from "@/components/e/AboutX";
import StoryX from "@/components/e/StoryX";
import RoadX from "@/components/e/RoadX";
import HighwayX from "@/components/e/HighwayX";
import LeadershipX from "@/components/e/LeadershipX";
import PartnersX from "@/components/e/PartnersX";
import PresenceX from "@/components/e/PresenceX";
import FaqX from "@/components/e/FaqX";
import FooterX from "@/components/e/FooterX";

// Design option E, modelled on the structure and motion of unitedcarriers.com: a dotted-Earth hero that dives
// to Solapur, a pinned 3D story (fleet → businesses → top-down), the milestone road, a top-down highway rising
// into cloud, then leadership, partners, presence, F.A.Q and a wordmark footer.
export default function OptionE() {
  return (
    <>
      <SmoothScroll />
      <PreloaderX />
      <NavX />
      <main>
        <HeroX />
        <AboutX />
        <StoryX />
        <RoadX />
        <HighwayX />
        <LeadershipX />
        <PartnersX />
        <PresenceX />
        <FaqX />
      </main>
      <FooterX />
      <OptionSwitch current="e" />
    </>
  );
}
