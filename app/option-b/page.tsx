import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import OptionSwitch from "@/components/OptionSwitch";
import PreloaderB from "@/components/b/PreloaderB";
import NavB from "@/components/b/NavB";
import HeroB from "@/components/b/HeroB";
import RibbonsB from "@/components/b/RibbonsB";
import AboutB from "@/components/b/AboutB";
import LegacyB from "@/components/b/LegacyB";
import VerticalPanels from "@/components/VerticalPanels";
import Journey3D from "@/components/journey/Journey3D";
import PresenceB from "@/components/b/PresenceB";
import FutureFooterB from "@/components/b/FutureFooterB";

// Design option B: paper & ink sketchbook, with a 3D hand-drawn road trip through the group's history.
export default function OptionB() {
  return (
    <>
      <SmoothScroll />
      <PreloaderB />
      <Cursor />
      <NavB />
      <main>
        <HeroB />
        <RibbonsB />
        <AboutB />
        <LegacyB />
        <VerticalPanels theme="paper" />
        <Journey3D theme="paper" />
        <PresenceB />
      </main>
      <FutureFooterB />
      <OptionSwitch current="b" />
    </>
  );
}
