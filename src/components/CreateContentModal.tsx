import { useState } from "react";
import { CrossIcon } from "../icons/CrossIcon";
import { Button } from "./Button";
import { Input } from "./Input";
import { api, normalizeError } from "../lib/api";
import { detectSourceType, isYouTubePlaylist, type SourceType } from "../lib/urlDetector";
import { getChannelConfig } from "../lib/channels";

interface CreateContentModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateContentModal({ open, onClose }: CreateContentModalProps) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [detectedType, setDetectedType] = useState<SourceType | null>(null);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setLink("");
    setTitle("");
    setDetectedType(null);
    setIsPlaylist(false);
    setError(null);
    onClose();
  }

  function handleLinkChange(value: string) {
    setLink(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setDetectedType(null);
      setIsPlaylist(false);
      return;
    }
    const detected = detectSourceType(trimmed);
    setDetectedType(detected);
    setIsPlaylist(isYouTubePlaylist(trimmed));
  }

  async function addContent() {
    if (submitting) return;

    const trimmedLink = link.trim();
    if (!trimmedLink) {
      setError("Please provide a link.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (isPlaylist) {
        const trimmedTitle = title.trim();
        await api.post("/api/v1/content/playlist", {
          playlistUrl: trimmedLink,
          ...(trimmedTitle ? { title: trimmedTitle } : {}),
        });
      } else {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
          setError("Please provide a title.");
          setSubmitting(false);
          return;
        }
        await api.post("/api/v1/content", {
          link: trimmedLink,
          title: trimmedTitle,
          sourceType: detectedType ?? "other",
        });
      }
      handleClose();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const detectedChannel = detectedType ? getChannelConfig(detectedType) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isPlaylist ? "Import Playlist" : "Add Content"}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <CrossIcon />
          </button>
        </div>

        <div className="p-8 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-800 text-sm rounded-2xl animate-in fade-in slide-in-from-top-1">
              {error}
            </div>
          )}

          <Input
            label="Link"
            placeholder="Paste any URL — YouTube, GitHub, Twitter, Reddit…"
            value={link}
            onChange={(e) => handleLinkChange(e.target.value)}
            className="h-12"
            autoFocus
          />

          {/* Detection badge — appears as soon as a recognisable URL is pasted */}
          {detectedChannel && !isPlaylist && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold animate-in fade-in duration-200 ${detectedChannel.badgeClass}`}
            >
              <detectedChannel.Icon className="w-4 h-4" />
              <span>{detectedChannel.label} detected</span>
              <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {isPlaylist && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold text-red-600 bg-red-50 border-red-100 animate-in fade-in duration-200">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2zm12 0l5 3-5 3v-6z" />
              </svg>
              <span>YouTube Playlist detected</span>
            </div>
          )}

          <Input
            label={isPlaylist ? "Playlist name (optional)" : "Title"}
            placeholder={
              isPlaylist
                ? "Leave blank to use the playlist's name"
                : "Give it a name"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12"
          />

        </div>

        <div className="p-6 bg-gray-50 flex gap-3">
          <Button
            onClick={handleClose}
            variant="secondary"
            text="Cancel"
            className="flex-1 h-12 rounded-2xl"
          />
          <Button
            onClick={addContent}
            variant="primary"
            text={isPlaylist ? "Import Playlist" : "Save to Brain"}
            loading={submitting}
            loadingText={isPlaylist ? "Importing…" : "Saving…"}
            className="flex-1 h-12 rounded-2xl shadow-lg shadow-purple-200"
          />
        </div>
      </div>
    </div>
  );
}
