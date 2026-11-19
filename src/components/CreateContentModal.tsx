import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ClipboardPaste, Link2, ListVideo } from "lucide-react";
import { Dialog, DialogFooter, DialogHeader } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { Field } from "./ui/Field";
import { SourceIcon } from "./ui/SourceIcon";
import { Kbd } from "./ui/Spinner";
import { api, normalizeError } from "../lib/api";
import { detectSourceType, isYouTubePlaylist, type SourceType } from "../lib/urlDetector";
import { getChannelConfig } from "../lib/channels";
import { saveLink } from "../lib/recall";
import type { Content } from "../hooks/useContent";

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
  /** A link handed over from the landing page or a share. */
  initialLink?: string;
  /** Called with the saved item (absent for playlists, which save many). */
  onSaved?: (result: { content?: Content; duplicate?: boolean; playlist?: boolean }) => void;
}

function looksLikeUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function firstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0].replace(/[).,!?]+$/, "") : null;
}

export function CreateContentModal({ open, onClose, initialLink, onSaved }: CreateContentModalProps) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLink(initialLink ?? "");
    setTitle("");
    setNote("");
    setError(null);
  }, [open, initialLink]);

  const trimmed = link.trim();
  const valid = looksLikeUrl(trimmed);
  const detected: SourceType | null = valid ? detectSourceType(trimmed) : null;
  const isPlaylist = valid && isYouTubePlaylist(trimmed);
  const detectedChannel = detected ? getChannelConfig(detected) : null;
  const canPaste = typeof navigator !== "undefined" && Boolean(navigator.clipboard?.readText);

  function handleClose() {
    if (submitting) return;
    onClose();
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      const url = firstUrl(text) ?? text.trim();
      setLink(url);
      setError(null);
    } catch {
      linkRef.current?.focus();
      setError("Your browser didn't allow reading the clipboard. Paste with Ctrl+V or long-press instead.");
    }
  }

  async function addContent(e?: FormEvent) {
    e?.preventDefault();
    if (submitting) return;
    const pasted = firstUrl(trimmed) ?? trimmed;
    if (!pasted) {
      setError("Paste a link to save.");
      return;
    }
    if (!looksLikeUrl(pasted)) {
      setError("That doesn't look like a full link. It should start with https://");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (isYouTubePlaylist(pasted)) {
        await api.post("/api/v1/content/playlist", {
          playlistUrl: pasted,
          ...(title.trim() ? { title: title.trim() } : {}),
        });
        onSaved?.({ playlist: true });
      } else {
        const res = await saveLink({
          link: pasted,
          sourceType: detectSourceType(pasted),
          ...(title.trim() ? { title: title.trim() } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        });
        onSaved?.(res);
      }
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} size="lg" label={isPlaylist ? "Import playlist" : "Save a link"}>
      <form onSubmit={addContent} noValidate>
        <DialogHeader
          title={isPlaylist ? "Import a playlist" : "Save a link"}
          description={
            isPlaylist
              ? "Every video in it lands in your YouTube brain, in order."
              : "Paste anything. Brainly fetches the title and works out what it is."
          }
          onClose={handleClose}
        />

        <div className="space-y-5 px-6 pb-6">
          <div>
            <Field
              reference={linkRef}
              data-autofocus
              label="Link"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://"
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                if (error) setError(null);
              }}
              leading={detected ? <SourceIcon channel={detected} size="xs" bare /> : <Link2 className="size-4" />}
              trailing={
                canPaste && !link ? (
                  <button
                    type="button"
                    onClick={paste}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-ink-2 hover:bg-surface-2 hover:text-ink"
                  >
                    <ClipboardPaste className="size-3.5" />
                    Paste
                  </button>
                ) : undefined
              }
              className="font-mono text-[14px]"
            />
            <div className="mt-2 h-5">
              <AnimatePresence mode="wait" initial={false}>
                {detectedChannel && (
                  <motion.div
                    key={isPlaylist ? "playlist" : detectedChannel.id}
                    initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-1.5 text-[13px] text-ink-2"
                  >
                    {isPlaylist ? (
                      <>
                        <ListVideo className="size-4 text-[#FF0033]" />
                        <span>
                          <span className="font-medium text-ink">YouTube playlist</span> · imports up to 500 videos
                        </span>
                      </>
                    ) : (
                      <>
                        <SourceIcon channel={detectedChannel.id} size="xs" />
                        <span>
                          From <span className="font-medium text-ink">{detectedChannel.label}</span>
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Field
            label={isPlaylist ? "Name (optional)" : "Title (optional)"}
            placeholder={isPlaylist ? "Uses the playlist's own name if left empty" : "Uses the page's own title if left empty"}
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
          />

          {!isPlaylist && (
            <Field
              label="Why you're saving it (optional)"
              placeholder="For the Goa trip · try with rice · send to Priya"
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
            />
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="justify-between">
          <span className="hidden items-center gap-1.5 text-xs text-ink-3 sm:inline-flex">
            <Kbd>↵</Kbd> to save
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} loadingText={isPlaylist ? "Importing…" : "Saving…"}>
              {isPlaylist ? "Import playlist" : "Save link"}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
