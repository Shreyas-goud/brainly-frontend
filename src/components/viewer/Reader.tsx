import { useState } from "react";
import type { Block, Inline } from "../../lib/viewerApi";
import { cn } from "../../lib/cn";

function Inlines({ runs }: { runs: Inline[] }) {
  return (
    <>
      {runs.map((r, i) => {
        let node: React.ReactNode = r.t;
        if (r.code) node = <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.88em]">{node}</code>;
        if (r.b) node = <strong className="font-semibold text-ink">{node}</strong>;
        if (r.i) node = <em>{node}</em>;
        if (r.href)
          node = (
            <a
              href={r.href}
              target="_blank"
              rel="noreferrer nofollow"
              className="text-ink underline decoration-accent/50 decoration-[1.5px] underline-offset-[3px] transition-colors hover:decoration-accent"
            >
              {node}
            </a>
          );
        return <span key={i} className="whitespace-pre-line">{node}</span>;
      })}
    </>
  );
}

function ReaderImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <figure className="my-7">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="mx-auto max-h-[70vh] w-auto max-w-full rounded-xl bg-surface-2"
      />
      {caption && <figcaption className="mt-2 text-center text-[13.5px] text-ink-3">{caption}</figcaption>}
    </figure>
  );
}

/** Article text, laid out for reading: one measure, generous leading, nothing else on the page. */
export function ReaderBlocks({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={cn("text-[17px] leading-[1.75] text-ink-2", className)}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h": {
            const size = b.level === 2 ? "text-[23px]" : b.level === 3 ? "text-[20px]" : "text-[18px]";
            return (
              <h2 key={i} className={cn("mb-3 mt-9 font-semibold leading-snug tracking-title text-ink text-balance", size)}>
                {b.text}
              </h2>
            );
          }
          case "p":
            return (
              <p key={i} className="my-4 text-pretty">
                <Inlines runs={b.inlines} />
              </p>
            );
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag key={i} className={cn("my-4 space-y-1.5 pl-6", b.ordered ? "list-decimal" : "list-disc", "marker:text-ink-3")}>
                {b.items.map((it, j) => (
                  <li key={j} className="pl-1">
                    <Inlines runs={it} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="my-6 border-l-2 border-line-strong pl-5 text-[18px] italic leading-relaxed text-ink">
                <Inlines runs={b.inlines} />
              </blockquote>
            );
          case "code":
            return (
              <pre key={i} className="my-5 overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-[13.5px] leading-relaxed text-ink ring-1 ring-inset ring-line">
                {b.text}
              </pre>
            );
          case "img":
            return <ReaderImage key={i} src={b.src} alt={b.alt} caption={b.caption} />;
          case "hr":
            return <hr key={i} className="my-8 border-line" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading the page">
      <div className="skeleton aspect-[2/1] w-full rounded-2xl" />
      {[100, 96, 88, 100, 72, 94, 60].map((w, i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
