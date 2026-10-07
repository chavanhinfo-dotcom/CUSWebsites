import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import About from "@/components/About";
import Legacy from "@/components/Legacy";
import Marquee from "@/components/Marquee";
import VerticalPanels from "@/components/VerticalPanels";
import JourneyDiorama from "@/components/diorama/JourneyDiorama";
import Presence from "@/components/Presence";
import Future from "@/components/Future";
import Footer from "@/components/Footer";
import OptionSwitch from "@/components/OptionSwitch";

// Design option C: option A's design with a living 3D diorama journey (day passes from 1960 to 2025).
export default function OptionC() {
  return (
    <>
      {/* SmoothScroll must mount before Preloader so Lenis exists when the intro locks scrolling */}
      <SmoothScroll />
      <Preloader />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Stats />
        <About />
        <Legacy />
        <Marquee />
        <VerticalPanels theme="ink" />
        <JourneyDiorama />
        <Presence />
        <Future />
      </main>
      <Footer />
      <OptionSwitch current="c" />
    </>
  );
}
