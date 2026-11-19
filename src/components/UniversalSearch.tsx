import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, CornerDownLeft, Search } from "lucide-react";
import { type Content } from "../hooks/useContent";
import { Dialog } from "./ui/Dialog";
import { SourceIcon } from "./ui/SourceIcon";
import { Kbd } from "./ui/Spinner";
import { normalizeSourceType } from "../lib/urlDetector";
import { hostnameOf } from "../lib/format";
import { cn } from "../lib/cn";

interface UniversalSearchProps {
  open: boolean;
  onClose: () => void;
  contents: Content[];
}

/** Subsequence match that also reports which characters matched, for highlighting. */
export function fuzzyIndices(pattern: string, text: string): number[] | null {
  const p = pattern.toLowerCase().replace(/\s+/g, "");
  if (!p) return [];
  const t = text.toLowerCase();
  const hits: number[] = [];
  let pi = 0;
  for (let ti = 0; ti < t.length && pi < p.length; ti++) {
    if (t[ti] === p[pi]) {
      hits.push(ti);
      pi++;
    }
  }
  return pi === p.length ? hits : null;
}

/** Contiguous matches score higher, so "rust" beats "r…u…s…t". */
function score(hits: number[]): number {
  let s = 0;
  for (let i = 1; i < hits.length; i++) if (hits[i] === hits[i - 1] + 1) s += 2;
  return s - (hits[0] ?? 0) * 0.05;
}

export function Highlight({ text, hits }: { text: string; hits: number[] }) {
  if (hits.length === 0) return <>{text}</>;
  const set = new Set(hits);
  const out: ReactNode[] = [];
  let buf = "";
  let inHit = false;
  for (let i = 0; i < text.length; i++) {
    const h = set.has(i);
    if (h !== inHit && buf) {
      out.push(inHit ? <mark key={i} className="rounded-sm bg-accent/15 text-accent-ink">{buf}</mark> : buf);
      buf = "";
    }
    inHit = h;
    buf += text[i];
  }
  if (buf) out.push(inHit ? <mark key="end" className="rounded-sm bg-accent/15 text-accent-ink">{buf}</mark> : buf);
  return <>{out}</>;
}

export function UniversalSearch({ open, onClose, contents }: UniversalSearchProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return contents.slice(0, 50).map((item) => ({ item, hits: [] as number[], s: 0 }));
    const out: { item: Content; hits: number[]; s: number }[] = [];
    for (const item of contents) {
      const titleHits = fuzzyIndices(query, item.title);
      if (titleHits) {
        out.push({ item, hits: titleHits, s: score(titleHits) + 5 });
        continue;
      }
      const linkHits = fuzzyIndices(query, item.link);
      if (linkHits) out.push({ item, hits: [], s: score(linkHits) });
    }
    return out.sort((a, b) => b.s - a.s).slice(0, 50);
  }, [contents, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function openItem(item: Content) {
    window.open(item.link, "_blank", "noopener,noreferrer");
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) openItem(hit.item);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} size="xl" placement="top" label="Search your brain">
      <div onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-line px-5">
          <Search className="size-[18px] shrink-0 text-ink-3" />
          <input
            data-autofocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="search-results"
            aria-activedescendant={results[active] ? `search-option-${active}` : undefined}
            placeholder="Search titles and links…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3"
          />
          <Kbd>esc</Kbd>
        </div>

        <ul id="search-results" role="listbox" ref={listRef} className="max-h-[min(56vh,460px)] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-ink">Nothing matches “{query}”</p>
              <p className="mt-1 text-[13px] text-ink-3">Try fewer letters, or part of the link.</p>
            </li>
          ) : (
            results.map(({ item, hits }, index) => {
              const source = normalizeSourceType(item);
              const isActive = index === active;
              return (
                <li
                  key={item._id ?? item.link}
                  id={`search-option-${index}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={index}
                  onMouseMove={() => setActive(index)}
                  onClick={() => openItem(item)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                    isActive ? "bg-surface-2" : ""
                  )}
                >
                  <SourceIcon channel={source} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-ink">
                      <Highlight text={item.title} hits={hits} />
                    </p>
                    <p className="truncate text-xs text-ink-3">{hostnameOf(item.link)}</p>
                  </div>
                  <ArrowUpRight className={cn("size-4 shrink-0 text-ink-3", isActive ? "opacity-100" : "opacity-0")} />
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-line bg-surface-2/50 px-5 py-2.5 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>
              <CornerDownLeft className="size-3" />
            </Kbd>
            to open
          </span>
          <span className="ml-auto tnum">
            {results.length} of {contents.length}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
