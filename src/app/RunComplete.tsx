import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { useAppData } from "./AppData";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { normalizeError } from "../lib/api";
import { count } from "../lib/format";
import { startBonus, type FinishResult } from "../lib/runApi";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The end of a catch-up: what you did with each save, and the way back to your saves. */
export function RunComplete({
  result,
  kind,
  bonusAvailable,
  onClose,
}: {
  result: FinishResult;
  kind: "daily" | "bonus";
  bonusAvailable: boolean;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const toast = useToast();
  const { today, refreshToday } = useAppData();
  const [starting, setStarting] = useState(false);

  const c = result.counts;
  const summary = [
    { n: (c.done ?? 0) + (c.got ?? 0), label: "done" },
    { n: c.plan ?? 0, label: "planned" },
    { n: (c.later ?? 0) + (c.pass ?? 0) + (c.let_go ?? 0), label: "for later" },
  ].filter((s) => s.n > 0);
  const handled = today?.backlog.clearedThisWeek ?? 0;

  async function more() {
    setStarting(true);
    try {
      await startBonus();
      await refreshToday();
      navigate("/app/catch-up?kind=bonus", { replace: true });
    } catch (err) {
      toast(normalizeError(err).message, { tone: "info" });
      setStarting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-[max(24px,env(safe-area-inset-bottom))] text-center">
      <motion.span
        initial={reduced ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.35, duration: 0.55 }}
        className="flex size-16 items-center justify-center rounded-full bg-success/12 text-success"
      >
        <Check className="size-8" strokeWidth={2.8} />
      </motion.span>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: 0.12 }}
        className="mt-6 w-full max-w-[400px]"
      >
        <h1 className="text-[28px] font-semibold tracking-title">All caught up</h1>
        {summary.length > 0 && (
          <p className="mt-2 text-[16px] text-ink-2">{summary.map((s) => `${s.n} ${s.label}`).join(" · ")}</p>
        )}
        {handled > 0 && <p className="mt-1 text-[14px] text-ink-3">You went through {count(handled, "save")} in the last 7 days.</p>}

        <div className="mt-8 flex flex-col gap-2">
          <Button variant="primary" size="lg" onClick={onClose}>
            Back to my saves
          </Button>
          {kind === "daily" && bonusAvailable && (
            <Button variant="ghost" size="lg" onClick={more} loading={starting} loadingText="Picking 3 more…">
              Go through 3 more
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
