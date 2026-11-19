import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { AlertCircle, ArrowRight, Check, Undo2 } from "lucide-react";
import { useAuth } from "../lib/auth/AuthContext";
import { setPendingLink } from "../lib/pendingLink";
import { detectSourceType } from "../lib/urlDetector";
import { saveLink, updateItem } from "../lib/recall";
import { api, normalizeError } from "../lib/api";
import type { Content } from "../hooks/useContent";
import { Logo } from "../components/brand/Logo";
import { SourceIcon } from "../components/ui/SourceIcon";
import { Spinner } from "../components/ui/Spinner";
import { Button } from "../components/ui/Button";

/** Share sheets put the link in url, in text ("Look at this https://…"), or both. */
export function sharedLink(params: URLSearchParams): string | null {
  const candidates = [params.get("url"), params.get("text"), params.get("title")];
  for (const c of candidates) {
    const m = c?.match(/https?:\/\/[^\s<>"']+/i);
    if (m) return m[0].replace(/[).,!?]+$/, "");
  }
  return null;
}

/**
 * Where "Share → Brainly" and the bookmarklet land. Saves straight away, then
 * offers one tap to say why.
 */
export function SaveShared() {
  const [params] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const link = sharedLink(params);
  const sharedTitle = params.get("title")?.trim() || undefined;
  const [state, setState] = useState<"saving" | "saved" | "error">("saving");
  const [item, setItem] = useState<Content | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!link) return;
    if (!isAuthenticated) {
      setPendingLink(link);
      navigate("/signup", { replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;
    const title = sharedTitle && !/https?:\/\//.test(sharedTitle) ? sharedTitle.slice(0, 300) : undefined;
    saveLink({ link, sourceType: detectSourceType(link), title })
      .then((res) => {
        setItem(res.content);
        setDuplicate(res.duplicate);
        setNote(res.content.note ?? "");
        setState("saved");
      })
      .catch((err) => {
        setError(normalizeError(err).message);
        setState("error");
      });
  }, [link, isAuthenticated, navigate, sharedTitle]);

  async function finish() {
    if (item?._id && note.trim() !== (item.note ?? "")) {
      try {
        await updateItem(item._id, { note: note.trim() });
      } catch {
        /* keep going; the note is optional */
      }
    }
    // A share sheet opens us in a new window; closing returns to the app it came from.
    window.close();
    navigate("/app", { replace: true });
  }

  async function undo() {
    if (!item?._id) return;
    try {
      await api.delete("/api/v1/content", { data: { contentId: item._id } });
    } finally {
      window.close();
      navigate("/app", { replace: true });
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg px-5 py-5 text-ink">
      <Link to="/app" className="self-start rounded-lg" aria-label="Brainly">
        <Logo />
      </Link>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
        {!link ? (
          <Message
            icon={<AlertCircle className="size-5" />}
            title="Nothing to save"
            body="That share didn't include a link. Try Copy link in the app, then Save link in Brainly."
          />
        ) : state === "saving" ? (
          <div className="flex flex-col items-center text-center">
            <Spinner className="size-6 text-ink-3" />
            <p className="mt-4 text-[15px] text-ink-2">Saving to your brain…</p>
          </div>
        ) : state === "error" ? (
          <Message icon={<AlertCircle className="size-5" />} title="Couldn't save that" body={error ?? "Please try again."} />
        ) : (
          item && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center gap-2.5">
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.45, duration: 0.5 }}
                  className="flex size-9 items-center justify-center rounded-full bg-success text-white"
                >
                  <Check className="size-5" strokeWidth={2.75} />
                </motion.span>
                <h1 className="text-[22px] font-semibold tracking-title">{duplicate ? "Already saved. Moved to the top." : "Saved"}</h1>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-surface p-3.5 ring-1 ring-line">
                <SourceIcon channel={detectSourceType(item.link)} size="md" />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[14.5px] font-medium leading-snug">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-3">{item.link}</p>
                </div>
              </div>

              <label htmlFor="share-note" className="mt-7 block text-[13px] font-medium text-ink-2">
                Why, in a few words (optional)
              </label>
              <input
                id="share-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="For the Goa trip"
                maxLength={1000}
                className="mt-2 h-11 w-full rounded-xl bg-surface px-3.5 text-[15px] outline-none ring-1 ring-inset ring-line placeholder:text-ink-3 focus:ring-2 focus:ring-accent"
              />

              <div className="mt-8 flex items-center gap-2">
                <Button variant="primary" size="lg" className="flex-1" onClick={finish} endIcon={<ArrowRight className="size-4" />}>
                  Done
                </Button>
                {!duplicate && (
                  <Button variant="ghost" size="lg" onClick={undo} startIcon={<Undo2 className="size-4" />}>
                    Undo
                  </Button>
                )}
              </div>
              <p className="mt-4 text-center text-xs text-ink-3">It'll come up in a catch-up in a few days.</p>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}

function Message({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-surface-2 text-ink-2 ring-1 ring-line">{icon}</span>
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-1.5 text-[14.5px] text-ink-2">{body}</p>
      <Link to="/app" className="mt-6 inline-flex h-10 items-center rounded-xl bg-inverse px-4 text-sm font-medium text-inverse-ink">
        Open Brainly
      </Link>
    </div>
  );
}
