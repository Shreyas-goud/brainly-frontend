import { useLenis } from "../hooks/useLenis";
import { useForcedTheme } from "../lib/theme";
import { Nav } from "../components/landing/Nav";
import { Hero } from "../components/landing/Hero";
import { Gather } from "../components/landing/Gather";
import { Sources } from "../components/landing/Sources";
import { Bento } from "../components/landing/Bento";
import { FinalCta, Footer } from "../components/landing/Footer";
import { ChapterRail } from "../components/landing/ChapterRail";

export function LandingPage() {
  useLenis();
  useForcedTheme("light");
  return (
    <div className="min-h-screen bg-bg text-ink">
      <Nav />
      <ChapterRail />
      <main>
        <Hero />
        <Gather />
        <Sources />
        <Bento />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
