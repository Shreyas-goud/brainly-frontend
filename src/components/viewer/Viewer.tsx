import { useEffect, useState } from "react";
import { ArrowBigUp, ArrowUpRight, BookOpen, MessageSquare } from "lucide-react";
import type { Content } from "../../hooks/useContent";
import { normalizeSourceType, type SourceType } from "../../lib/urlDetector";
import { getChannelConfig } from "../../lib/channels";
import { fetchReader, fetchRedditThread, type ReaderPage, type RedditThread } from "../../lib/viewerApi";
import { compactNumber, hostnameOf } from "../../lib/format";
import { TweetCard } from "../TweetCard";
import { InstagramCard } from "../InstagramCard";
import { RedditCard } from "../RedditCard";
import { LinkPreviewCard } from "../LinkPreviewCard";
import { SourceIcon } from "../ui/SourceIcon";
import { ReaderBlocks, ReaderSkeleton } from "./Reader";
import { Video } from "../VideoPlayer";
import { cn } from "../../lib/cn";

function youTubeId(url: string): string | null {
  const m = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/);
  return m?.[2]?.length === 11 ? m[2] : null;
}

/** The save itself, shown cleanly inside Brainly. */
export function Viewer({ item }: { item: Content }) {
  const source = normalizeSourceType(item);
  switch (source) {
    case "youtube":
      return <VideoView url={item.link} title={item.title} />;
    case "x":
      return (
        <div className="mx-auto max-w-[560px] rounded-2xl bg-surface p-5 ring-1 ring-line">
          <TweetCard url={item.link} />
        </div>
      );
    case "instagram":
      return (
        <div className="mx-auto max-w-[460px]">
          <InstagramCard url={item.link} ogData={item.ogData} startLoaded />
        </div>
      );
    case "reddit":
      return <RedditView item={item} />;
    case "email":
    case "chat":
      return <OutsideView item={item} source={source} />;
    default:
      return <ReaderView item={item} />;
  }
}

function VideoView({ url, title }: { url: string; title: string }) {
  const id = youTubeId(url);
  if (!id) return <ReaderView item={{ link: url, title } as Content} />;
  const short = /\/shorts\//.test(url);
  return (
    <Video
      key={id}
      source={{ kind: "youtube", id, vertical: short }}
      title={title}
      channel="youtube"
      originalUrl={url}
      size="lg"
      className={short ? "mx-auto max-w-[300px]" : undefined}
    />
  );
}

function ReaderView({ item }: { item: Content }) {
  const [page, setPage] = useState<ReaderPage | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let active = true;
    setState("loading");
    setPage(null);
    fetchReader(item.link)
      .then((p) => {
        if (!active) return;
        setPage(p);
        setState("ready");
      })
      .catch(() => active && setState("failed"));
    return () => {
      active = false;
    };
  }, [item.link]);

  if (state === "loading") return <ReaderSkeleton />;
  if (state === "failed" || !page) {
    return (
      <div className="space-y-4">
        <LinkPreviewCard url={item.link} ogData={item.ogData} />
        <p className="text-[14px] text-ink-3">This page can't be shown cleanly inside Brainly.</p>
        <OpenOriginal href={item.link} label={`Open ${hostnameOf(item.link)}`} />
      </div>
    );
  }
  return (
    <article>
      <p className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-ink-3">
        <BookOpen className="size-3.5" />
        <span>{page.minutes} min read</span>
        {page.siteName && <span>· {page.siteName}</span>}
        {page.byline && <span>· {page.byline}</span>}
      </p>
      {page.leadImage && (
        <img
          src={page.leadImage}
          alt=""
          referrerPolicy="no-referrer"
          onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          className="mb-6 w-full rounded-2xl bg-surface-2 object-cover"
        />
      )}
      <ReaderBlocks blocks={page.blocks} />
      <div className="mt-10 border-t border-line pt-6">
        <OpenOriginal href={item.link} label={`Read on ${page.siteName ?? hostnameOf(item.link)}`} />
      </div>
    </article>
  );
}

function RedditView({ item }: { item: Content }) {
  const [thread, setThread] = useState<RedditThread | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setThread(null);
    setFailed(false);
    fetchRedditThread(item.link)
      .then((t) => active && setThread(t))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [item.link]);

  if (failed) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-line">
          <RedditCard url={item.link} ogData={item.ogData} />
        </div>
        <OpenOriginal href={item.link} label="Open the thread on Reddit" />
      </div>
    );
  }
  if (!thread) return <ReaderSkeleton />;

  return (
    <article>
      <p className="mb-4 flex flex-wrap items-center gap-x-2 text-[13.5px] text-ink-3 tnum">
        <span className="font-semibold text-[#FF4500]">r/{thread.subreddit}</span>
        <span>· u/{thread.author}</span>
        <span className="inline-flex items-center gap-0.5">
          · <ArrowBigUp className="size-4 text-[#FF4500]" />
          {compactNumber(thread.score)}
        </span>
        <span className="inline-flex items-center gap-1">
          · <MessageSquare className="size-3.5" />
          {compactNumber(thread.num_comments)}
        </span>
      </p>
      {thread.image && <img src={thread.image} alt="" className="mb-5 w-full rounded-2xl bg-surface-2" referrerPolicy="no-referrer" />}
      {thread.selftext && (
        <div className="space-y-4 text-[17px] leading-[1.75] text-ink-2">
          {thread.selftext.split(/\n{2,}/).map((para, i) => (
            <p key={i} className="whitespace-pre-line text-pretty">
              {para}
            </p>
          ))}
        </div>
      )}
      {thread.link && (
        <div className="mt-5">
          <OpenOriginal href={thread.link} label={`Open ${hostnameOf(thread.link)}`} />
        </div>
      )}
      {thread.comments.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-[15px] font-semibold">Top comments</h2>
          <ul className="space-y-3">
            {thread.comments.map((c, i) => (
              <li key={i} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                <p className="mb-1.5 flex items-center gap-2 text-xs text-ink-3 tnum">
                  <span className="font-medium text-ink-2">u/{c.author}</span>
                  <span className="inline-flex items-center gap-0.5">
                    <ArrowBigUp className="size-3.5" />
                    {compactNumber(c.score)}
                  </span>
                </p>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink text-pretty">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-8">
        <OpenOriginal href={item.link} label="Open the thread on Reddit" />
      </div>
    </article>
  );
}

/** Mail and AI chats live behind the person's own sign-in, so they open where they live. */
function OutsideView({ item, source }: { item: Content; source: SourceType }) {
  const config = getChannelConfig(source);
  return (
    <div className="flex flex-col items-center rounded-3xl bg-surface px-6 py-12 text-center ring-1 ring-line">
      <SourceIcon channel={source} size="lg" />
      <p className="mt-4 text-[15px] text-ink-2">
        {source === "email" ? "This email opens in your mail app, where you're signed in." : "This chat opens where it was shared."}
      </p>
      <div className="mt-5">
        <OpenOriginal href={item.link} label={`Open in ${source === "email" ? "your mail" : hostnameOf(item.link) || config.label}`} primary />
      </div>
    </div>
  );
}

export function OpenOriginal({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[14px] font-medium transition-colors",
        primary ? "bg-inverse text-inverse-ink" : "text-ink ring-1 ring-inset ring-line hover:bg-surface-2"
      )}
    >
      {label}
      <ArrowUpRight className="size-4" />
    </a>
  );
}
