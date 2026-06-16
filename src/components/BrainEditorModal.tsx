import { useEffect, useState } from "react";
import { CrossIcon } from "../icons/CrossIcon";
import { Button } from "./Button";
import { Input } from "./Input";
import { getChannelConfig, type BrainChannelId } from "../lib/channels";
import { normalizeError } from "../lib/api";

export type BrainEditorTarget = {
  mode: "create" | "edit";
  channel: BrainChannelId;
  name?: string;
  description?: string;
};

interface BrainEditorModalProps {
  target: BrainEditorTarget | null;
  onClose: () => void;
  onSave: (
    channel: BrainChannelId,
    fields: { name?: string; description?: string }
  ) => Promise<void>;
}

/** Create or edit a channel brain: a name + a short "what this channel knows" blurb. */
export function BrainEditorModal({ target, onClose, onSave }: BrainEditorModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seed fields whenever a new target opens.
  useEffect(() => {
    if (!target) return;
    const config = getChannelConfig(target.channel);
    setName(target.name ?? config.label);
    setDescription(target.description ?? "");
    setError(null);
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [target, onClose]);

  if (!target) return null;

  const config = getChannelConfig(target.channel);
  const isCreate = target.mode === "create";

  async function submit() {
    if (saving || !target) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(target.channel, {
        name: name.trim() || config.label,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isCreate ? "Create brain" : "Edit brain"}
    >
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="p-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${config.iconBgClass}`}>
              <config.Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isCreate ? "Create Brain" : "Edit Brain"}
              </h2>
              <p className="text-sm text-gray-500">{config.label} channel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-1 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-900 transition-colors"
            aria-label="Close"
          >
            <CrossIcon />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={config.label}
            maxLength={80}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What knowledge does this channel hold?"
              maxLength={500}
              rows={3}
              className="w-full border border-gray-300 rounded px-4 py-2 outline-none transition resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl p-3">
              {error}
            </p>
          )}

          <Button
            onClick={submit}
            variant="primary"
            text={isCreate ? "Create Brain" : "Save Changes"}
            loading={saving}
            loadingText="Saving…"
            fullWidth
            className="h-12 rounded-2xl shadow-lg shadow-purple-200"
          />
        </div>
      </div>
    </div>
  );
}
