import { useEffect, useRef, useState } from "react";
import { Bookmark, Download, MonitorSmartphone, Share, Smartphone, SquarePlus } from "lucide-react";
import { Dialog, DialogHeader } from "./ui/Dialog";
import { Button } from "./ui/Button";
import { bookmarkletHref, detectPlatform, isStandalone, useInstallPrompt, type Platform } from "../lib/install";
import { cn } from "../lib/cn";

const TABS: { id: Platform; label: string; Icon: typeof Smartphone }[] = [
  { id: "android", label: "Android", Icon: Smartphone },
  { id: "ios", label: "iPhone", Icon: Smartphone },
  { id: "desktop", label: "Computer", Icon: MonitorSmartphone },
];

/** How to get links into Brainly without opening Brainly first. */
export function CaptureDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<Platform>("android");
  const { canInstall, install } = useInstallPrompt();
  const [installed, setInstalled] = useState(false);
  const bookmarkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (open) {
      setTab(detectPlatform());
      setInstalled(isStandalone());
    }
  }, [open]);

  // React refuses javascript: hrefs in JSX, so the bookmarklet is set directly.
  useEffect(() => {
    if (open && tab === "desktop") {
      window.setTimeout(() => bookmarkRef.current?.setAttribute("href", bookmarkletHref(window.location.origin)), 0);
    }
  }, [open, tab]);

  return (
    <Dialog open={open} onClose={onClose} size="lg" label="Save from anywhere">
      <DialogHeader
        title="Save from anywhere"
        description="The best time to save is the moment you see it. Set this up once and saving takes one tap from any app."
        onClose={onClose}
      />
      <div className="px-6 pb-6">
        <div role="tablist" className="flex rounded-xl bg-surface-2 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg text-[13.5px] transition-colors",
                tab === t.id ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-2 hover:text-ink"
              )}
            >
              <t.Icon className="size-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "android" && (
          <Steps
            steps={[
              {
                icon: <Download className="size-4" />,
                title: "Install Brainly on this phone",
                body: installed
                  ? "Done: Brainly is installed."
                  : "Open brain-lly.vercel.app in Chrome, then menu ⋮ → Install app (or Add to Home screen).",
                action:
                  canInstall && !installed ? (
                    <Button size="sm" variant="primary" onClick={() => install().then((ok) => ok && setInstalled(true))}>
                      Install now
                    </Button>
                  ) : null,
              },
              {
                icon: <Share className="size-4" />,
                title: "Share → Brainly",
                body: "In Instagram, YouTube, X or Reddit, tap Share on any post, then pick Brainly. It saves and sorts itself.",
              },
              {
                icon: <SquarePlus className="size-4" />,
                title: "Add why, if you want",
                body: "After it saves, tap Recipes, Places or another reason, or type a quick note. Or just close it.",
              },
            ]}
          />
        )}

        {tab === "ios" && (
          <Steps
            steps={[
              {
                icon: <SquarePlus className="size-4" />,
                title: "Add Brainly to your Home Screen",
                body: "Open brain-lly.vercel.app in Safari, tap Share, then Add to Home Screen.",
              },
              {
                icon: <Share className="size-4" />,
                title: "Copy the link in the app",
                body: "In Instagram tap ⋯ → Copy link. In YouTube tap Share → Copy link.",
              },
              {
                icon: <Download className="size-4" />,
                title: "Open Brainly and tap Save link",
                body: "Brainly offers to paste what you copied. iPhone doesn't let web apps join the share sheet yet, so this is the fastest way.",
              },
            ]}
          />
        )}

        {tab === "desktop" && (
          <Steps
            steps={[
              {
                icon: <Bookmark className="size-4" />,
                title: "Drag this to your bookmarks bar",
                body: "Click it on any page (a YouTube video, a thread, an article) and that page is saved.",
                action: (
                  <a
                    ref={bookmarkRef}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    draggable
                    className="inline-flex h-8 cursor-grab items-center gap-1.5 rounded-lg bg-inverse px-3 text-[13px] font-medium text-inverse-ink active:cursor-grabbing"
                  >
                    <Bookmark className="size-3.5" />
                    Save to Brainly
                  </a>
                ),
              },
              {
                icon: <SquarePlus className="size-4" />,
                title: "Or press N in Brainly",
                body: "Paste any link. Brainly fetches the title and works out what kind of thing it is.",
              },
            ]}
          />
        )}
      </div>
    </Dialog>
  );
}

function Steps({
  steps,
}: {
  steps: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }[];
}) {
  return (
    <ol className="mt-5 space-y-3">
      {steps.map((s) => (
        <li key={s.title} className="flex gap-3.5 rounded-2xl p-3 ring-1 ring-line">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-2 ring-1 ring-line">
            {s.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-medium text-ink">{s.title}</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">{s.body}</p>
            {s.action && <div className="mt-2.5">{s.action}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
