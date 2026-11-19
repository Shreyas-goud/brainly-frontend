import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { ArrowRight, Link2 } from "lucide-react";
import { detectSourceType, isYouTubePlaylist, type SourceType } from "../../lib/urlDetector";
import { getChannelConfig } from "../../lib/channels";
import { setPendingLink } from "../../lib/pendingLink";
import { useAuth } from "../../lib/auth/AuthContext";
import { SourceIcon } from "../ui/SourceIcon";
import { cn } from "../../lib/cn";

const EXAMPLES = [
  "https://youtube.com/watch?v=…",
  "https://x.com/mira_codes/status/1849…",
  "https://github.com/lumen/inkwell",
  "https://reddit.com/r/productivity/comments/…",
  "https://instagram.com/reel/C9x…",
  "https://claude.ai/share/7b1e…",
];

function parse(value: string): { valid: boolean; source: SourceType | null; playlist: boolean } {
  try {
    const u = new URL(value.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return { valid: false, source: null, playlist: false };
    return { valid: true, source: detectSourceType(value.trim()), playlist: isYouTubePlaylist(value.trim()) };
  } catch {
    return { valid: false, source: null, playlist: false };
  }
}

/** Types example links into the placeholder until the visitor takes over. */
function useTypedPlaceholder(active: boolean) {
  const reduced = useReducedMotion();
  const [text, setText] = useState(EXAMPLES[0]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || reduced) {
      setText(EXAMPLES[0]);
      return;
    }
    let cancelled = false;
    let timer = 0;
    const target = EXAMPLES[index % EXAMPLES.length];
    let i = 0;
    let phase: "type" | "hold" | "erase" = "type";
    const tick = () => {
      if (cancelled) return;
      if (phase === "type") {
        i++;
        setText(target.slice(0, i));
        if (i >= target.length) {
          phase = "hold";
          timer = window.setTimeout(tick, 1700);
          return;
        }
        timer = window.setTimeout(tick, 26 + Math.random() * 30);
      } else if (phase === "hold") {
        phase = "erase";
        timer = window.setTimeout(tick, 16);
      } else {
        i = Math.max(0, i - 3);
        setText(target.slice(0, i));
        if (i === 0) {
          setIndex((n) => n + 1);
          return;
        }
        timer = window.setTimeout(tick, 14);
      }
    };
    timer = window.setTimeout(tick, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [active, index, reduced]);

  return text;
}

export function Composer({ className, size = "lg" }: { className?: string; size?: "lg" | "md" }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const shake = useAnimationControls();

  const typing = !focused && value === "";
  const placeholder = useTypedPlaceholder(typing);
  const shown = value || (typing ? placeholder : "");
  const { valid, source, playlist } = parse(shown);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const check = parse(value);
    if (!check.valid) {
      setError(value ? "That isn't a full link yet. It should start with https://" : "Paste a link to try it.");
      inputRef.current?.focus();
      shake.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.42 } });
      return;
    }
    setPendingLink(value.trim());
    navigate(isAuthenticated ? "/app" : "/signup");
  }

  const big = size === "lg";
  const detectedLabel = playlist ? "YouTube playlist" : source ? getChannelConfig(source).label : null;

  return (
    <div className={cn("w-full", className)}>
      <motion.form
        animate={shake}
        onSubmit={onSubmit}
        className={cn(
          "group relative flex items-center gap-2 rounded-2xl bg-surface p-2 shadow-lift ring-1 transition-[box-shadow] duration-200",
          focused ? "ring-2 ring-accent" : "ring-line",
          big ? "h-16 pl-4" : "h-14 pl-3.5"
        )}
      >
        <span className="relative flex size-6 shrink-0 items-center justify-center" aria-hidden="true">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={valid && source ? source : "none"}
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.45 }}
              className="absolute"
            >
              {valid && source ? <SourceIcon channel={source} size="sm" /> : <Link2 className="size-5 text-ink-3" />}
            </motion.span>
          </AnimatePresence>
        </span>
        <label className="sr-only" htmlFor="composer-input">
          Paste a link
        </label>
        <input
          id="composer-input"
          ref={inputRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={typing ? placeholder : "Paste any link"}
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "min-w-0 flex-1 bg-transparent font-mono text-ink outline-none placeholder:text-ink-3",
            big ? "text-[15px]" : "text-[14px]"
          )}
        />
        <AnimatePresence>
          {detectedLabel && valid && (
            <motion.span
              key={detectedLabel}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              transition={{ duration: 0.2 }}
              className="hidden shrink-0 rounded-lg bg-surface-2 px-2 py-1 text-xs text-ink-2 sm:block"
            >
              {detectedLabel}
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="submit"
          className={cn(
            "inline-flex h-full shrink-0 items-center gap-1.5 rounded-xl bg-inverse px-4 font-medium text-inverse-ink transition-transform active:scale-[0.97]",
            big ? "text-[15px]" : "text-sm"
          )}
        >
          Save it
          <ArrowRight className="size-4" />
        </button>
      </motion.form>
      <p
        role={error ? "alert" : undefined}
        className={cn("mt-3 h-5 text-center text-[13px]", error ? "text-danger" : "text-ink-3")}
      >
        {error ?? "Free to use. Your link will be waiting after you sign up."}
      </p>
    </div>
  );
}
