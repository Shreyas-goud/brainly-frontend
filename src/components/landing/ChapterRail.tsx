import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SECTIONS } from "./Nav";
import { scrollToId } from "../../hooks/useLenis";
import { cn } from "../../lib/cn";

/** A quiet table of contents on wide screens; it appears once the hero is behind you. */
export function ChapterRail() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const onScroll = () => {
      const mid = window.innerHeight * 0.45;
      let current: string | null = null;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) current = el.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <nav
      aria-label="On this page"
      className={cn(
        "fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 transition-opacity duration-500 2xl:block",
        active ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <ul className="space-y-1">
        {SECTIONS.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => scrollToId(s.id)}
                className={cn(
                  "group flex items-center gap-3 py-1 text-[12.5px] transition-colors",
                  on ? "text-ink" : "text-ink-3 hover:text-ink-2"
                )}
              >
                <span className="relative h-px w-5 bg-line-strong">
                  {on && <motion.span layoutId="rail" className="absolute inset-0 h-px w-8 bg-ink" />}
                </span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
