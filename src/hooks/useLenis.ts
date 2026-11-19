import { useEffect } from "react";
import Lenis from "lenis";

let instance: Lenis | null = null;

/** Smooth wheel scrolling for the marketing page only; touch and keyboard stay native. */
export function useLenis() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.95,
      autoRaf: true,
      prevent: (node) => Boolean((node as HTMLElement).closest?.("[data-lenis-prevent]")),
    });
    instance = lenis;
    return () => {
      lenis.destroy();
      if (instance === lenis) instance = null;
    };
  }, []);
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset: -24, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}
