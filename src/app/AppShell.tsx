import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { AppDataProvider, useAppData } from "./AppData";
import { MobileBar, SaveFab, Sidebar } from "./nav";
import { CreateContentModal } from "../components/CreateContentModal";
import { CaptureDialog } from "../components/CaptureDialog";
import { ShareDialog } from "../components/ShareDialog";
import { UniversalSearch } from "../components/UniversalSearch";
import { ItemSheet } from "../components/ItemSheet";
import { useToast } from "../components/ui/Toast";
import { useBrains } from "../hooks/useBrains";
import type { Content } from "../hooks/useContent";
import { BRAIN_CHANNELS, getChannelConfig, type BrainChannelId } from "../lib/channels";
import { normalizeSourceType } from "../lib/urlDetector";
import { takePendingLink } from "../lib/pendingLink";

export function AppShell() {
  const [save, setSave] = useState<{ open: boolean; link?: string }>({ open: false });
  const [captureOpen, setCaptureOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [item, setItem] = useState<Content | null>(null);

  const modals = useMemo(
    () => ({
      openSave: (link?: string) => setSave({ open: true, link }),
      openItem: (c: Content) => setItem(c),
      openCapture: () => setCaptureOpen(true),
      openShare: () => setShareOpen(true),
      openSearch: () => setSearchOpen(true),
    }),
    []
  );

  return (
    <AppDataProvider modals={modals}>
      <Shell
        save={save}
        closeSave={() => setSave({ open: false })}
        captureOpen={captureOpen}
        closeCapture={() => setCaptureOpen(false)}
        shareOpen={shareOpen}
        closeShare={() => setShareOpen(false)}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        item={item}
        setItem={setItem}
      />
    </AppDataProvider>
  );
}

function Shell({
  save,
  closeSave,
  captureOpen,
  closeCapture,
  shareOpen,
  closeShare,
  searchOpen,
  setSearchOpen,
  item,
  setItem,
}: {
  save: { open: boolean; link?: string };
  closeSave: () => void;
  captureOpen: boolean;
  closeCapture: () => void;
  shareOpen: boolean;
  closeShare: () => void;
  searchOpen: boolean;
  setSearchOpen: (fn: boolean | ((o: boolean) => boolean)) => void;
  item: Content | null;
  setItem: (c: Content | null) => void;
}) {
  const { contents, counts, upsertItem, refreshAll, refreshToday, modals } = useAppData();
  const { configuredChannels } = useBrains();
  const toast = useToast();

  // A link typed on the landing page, or shared before sign-in, opens straight into "Save a link".
  useEffect(() => {
    const pending = takePendingLink();
    if (pending) modals.openSave(pending);
  }, [modals]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey || document.body.dataset.scrollLocked) return;
      if (/^\/app\/(catch-up|view)/.test(window.location.pathname)) return;
      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        modals.openSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modals, setSearchOpen]);

  const onSaved = useCallback(
    (result: { content?: Content; duplicate?: boolean; playlist?: boolean }) => {
      if (result.playlist) {
        refreshAll();
        toast("Playlist imported.");
        return;
      }
      if (!result.content) return;
      upsertItem(result.content);
      refreshToday();
      const saved = result.content;
      const app = normalizeSourceType(saved);
      toast(
        result.duplicate
          ? "Already saved. It's back at the top."
          : app === "other"
            ? "Saved."
            : `Saved to ${getChannelConfig(app).label}.`,
        { action: { label: "Add a note", run: () => setItem(saved) } }
      );
    },
    [refreshAll, refreshToday, toast, upsertItem, setItem]
  );

  const configuredList = useMemo(
    () => BRAIN_CHANNELS.filter((c) => configuredChannels.has(c.id as BrainChannelId)).map((c) => c.id as BrainChannelId),
    [configuredChannels]
  );

  return (
    <div className="min-h-screen bg-bg text-ink">
      <Sidebar />
      <MobileBar />
      <main className="pb-[calc(96px+env(safe-area-inset-bottom))] lg:pb-16 lg:pl-[248px]">
        <div className="mx-auto max-w-[1240px] px-4 pt-5 sm:px-6 lg:px-10 lg:pt-9">
          <Outlet />
        </div>
      </main>
      <SaveFab />

      <CreateContentModal open={save.open} onClose={closeSave} initialLink={save.link} onSaved={onSaved} />
      <CaptureDialog open={captureOpen} onClose={closeCapture} />
      <ShareDialog open={shareOpen} onClose={closeShare} configuredChannels={configuredList} counts={counts} />
      <UniversalSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        contents={contents}
      />
      <ItemSheet
        item={item}
        contents={contents}
        onClose={() => setItem(null)}
        onChange={(next) => {
          setItem(next);
          upsertItem(next);
          refreshToday();
        }}
        onDeleted={() => refreshAll()}
      />
    </div>
  );
}
