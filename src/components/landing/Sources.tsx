import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { BRAIN_CHANNELS, getChannelConfig, type BrainChannelId } from "../../lib/channels";
import { SourceIcon } from "../ui/SourceIcon";
import { DemoCard, demoById } from "./demo";
import { cn } from "../../lib/cn";

const EXAMPLE: Record<BrainChannelId, { url: string; demo: string }> = {
  youtube: { url: "youtube.com/watch?v=…", demo: "yt" },
  x: { url: "x.com/mira_codes/status/…", demo: "x" },
  instagram: { url: "instagram.com/reel/…", demo: "ig" },
  reddit: { url: "reddit.com/r/productivity/comments/…", demo: "rd" },
  github: { url: "github.com/lumen/inkwell", demo: "gh" },
  email: { url: "mail.google.com/mail/u/0/#inbox/…", demo: "em" },
  chat: { url: "claude.ai/share/…", demo: "ai" },
  other: { url: "thecolumn.blog/a-slower-internet", demo: "ln" },
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function Sources() {
  const [active, setActive] = useState<BrainChannelId>("youtube");
  const config = getChannelConfig(active);
  const example = EXAMPLE[active];

  return (
    <section id="sources" className="relative mx-auto max-w-6xl px-5 py-28 sm:px-8 lg:py-40">
      <div className="max-w-2xl">
        <h2 className="text-[36px] font-semibold leading-[1.05] tracking-display text-balance sm:text-[52px]">
          Paste anything.
          <span className="block text-ink-3">It knows what it is.</span>
        </h2>
        <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-2 text-pretty">
          Brainly reads the link, files it under its source and draws it the way that source deserves. No folders to
          pick, no tags required.
        </p>
      </div>

      <div className="mt-14 grid items-start gap-10 lg:mt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div role="tablist" aria-label="Sources" aria-orientation="vertical" className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
          {BRAIN_CHANNELS.map((c) => {
            const id = c.id as BrainChannelId;
            const on = active === id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="source-preview"
                onClick={() => setActive(id)}
                onMouseEnter={() => setActive(id)}
                onFocus={() => setActive(id)}
                className="relative flex items-center gap-3 rounded-xl px-3 py-3 text-left lg:py-3.5"
              >
                {on && (
                  <motion.span
                    layoutId="source-tab"
                    className="absolute inset-0 rounded-xl bg-surface shadow-card ring-1 ring-line"
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  />
                )}
                <span className="relative">
                  <SourceIcon channel={c.id} size="md" />
                </span>
                <span className="relative min-w-0 flex-1">
                  <span className={cn("block text-[15px] font-medium", on ? "text-ink" : "text-ink-2")}>{c.label}</span>
                  <span
                    className={cn(
                      "hidden text-[13.5px] leading-snug transition-colors lg:block",
                      on ? "text-ink-2" : "text-ink-3"
                    )}
                  >
                    {c.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="source-preview" role="tabpanel" className="relative lg:sticky lg:top-28">
          <div className="relative overflow-hidden rounded-[28px] bg-surface-2 p-6 ring-1 ring-line sm:p-10">
            <div
              className="pointer-events-none absolute inset-0 transition-[background] duration-500"
              style={{
                background: `radial-gradient(70% 60% at 50% 100%, ${config.color ? `${config.color}22` : "rgb(var(--ink) / 0.06)"}, transparent 70%)`,
              }}
              aria-hidden="true"
            />
            <div className="relative flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                  transition={{ duration: 0.32, ease: EASE }}
                  className="flex w-full flex-col items-center"
                >
                  <div className="flex w-full max-w-[340px] items-center gap-2 rounded-xl bg-surface px-3 py-2.5 shadow-card ring-1 ring-line">
                    <SourceIcon channel={active} size="xs" bare />
                    <span className="truncate font-mono text-[12.5px] text-ink-2">https://{example.url}</span>
                  </div>
                  <ArrowDown className="my-4 size-4 text-ink-3" aria-hidden="true" />
                  <DemoCard item={demoById(example.demo)} className="w-full max-w-[340px] shadow-float" />
                  <p className="mt-5 text-[13px] text-ink-3">
                    Filed under <span className="font-medium text-ink-2">{config.label}</span>
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
