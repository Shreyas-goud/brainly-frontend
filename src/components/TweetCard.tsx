import { useEffect, useState } from "react";
import { Heart, MessageCircle, FileText } from "lucide-react";
import { api } from "../lib/api";
import { XMark } from "./icons/brands";
import { Video } from "./VideoPlayer";
import { compactNumber, formatDate } from "../lib/format";

type NormalizedTweet = {
  id: string;
  url: string;
  text: string;
  createdAt: string;
  user: {
    name: string;
    handle: string;
    verified: boolean;
    avatar: string | null;
  };
  likes: number;
  replies: number;
  photos: { url: string; width: number; height: number }[];
  video: { poster: string | null; src: string; isGif: boolean } | null;
  article: {
    title: string;
    preview: string;
    coverImage: string | null;
    url: string;
  } | null;
};

const TWEET_ID_RE = /(?:twitter\.com|x\.com)\/[^/]+\/status(?:es)?\/(\d+)/i;

function extractTweetId(url: string): string | null {
  return url.match(TWEET_ID_RE)?.[1] ?? null;
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" aria-label="Verified" className="size-4 shrink-0 text-[#1d9bf0]">
      <path
        fill="currentColor"
        d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
      />
    </svg>
  );
}

/**
 * Renders an X post from our backend's normalized data (syndication API),
 * including X Article cards the official iframe embed drops. No third-party iframe.
 */
export function TweetCard({ url }: { url: string }) {
  const id = extractTweetId(url);
  const [tweet, setTweet] = useState<NormalizedTweet | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!id) {
      setStatus("error");
      return;
    }
    let active = true;
    setStatus("loading");
    api
      .get<NormalizedTweet>(`/api/v1/tweet/${id}`)
      .then((res) => {
        if (!active) return;
        setTweet(res.data);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="flex items-center gap-2.5">
          <div className="skeleton size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-2.5 w-1/4 rounded" />
          </div>
        </div>
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
    );
  }

  if (status === "error" || !tweet) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-xl bg-surface-2 p-3 transition-colors hover:bg-surface-3"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-inverse text-inverse-ink">
          <XMark className="size-3.5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">Open this post on X</span>
          <span className="block truncate text-xs text-ink-3">{url}</span>
        </span>
      </a>
    );
  }

  const { user, text, article, photos, video, likes, replies } = tweet;

  return (
    <article className="text-[14.5px] leading-[1.5] text-ink">
      <header className="flex items-center gap-2.5">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" loading="lazy" />
        ) : (
          <div className="size-9 shrink-0 rounded-full bg-surface-3" />
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            {user.verified && <VerifiedBadge />}
          </div>
          <span className="text-[13px] text-ink-3">@{user.handle}</span>
        </div>
      </header>

      {text && <p className="mt-2.5 whitespace-pre-wrap break-words text-pretty">{text}</p>}

      {article && (
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block overflow-hidden rounded-xl ring-1 ring-line transition-colors hover:bg-surface-2"
        >
          {article.coverImage && (
            <div className="relative">
              <img src={article.coverImage} alt="" className="max-h-64 w-full object-cover" loading="lazy" />
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
                <FileText className="size-3" />
                Article
              </span>
            </div>
          )}
          <div className="p-3">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{article.title}</h3>
            {article.preview && <p className="mt-1 line-clamp-3 text-[13px] text-ink-2">{article.preview}</p>}
          </div>
        </a>
      )}

      {video &&
        (video.isGif ? (
          <div className="mt-3 overflow-hidden rounded-xl bg-black">
            <video src={video.src} poster={video.poster ?? undefined} autoPlay loop muted playsInline className="max-h-80 w-full bg-black" />
          </div>
        ) : (
          <Video
            key={video.src}
            source={{ kind: "file", src: video.src }}
            poster={video.poster}
            title={text ? text.split("\n")[0].slice(0, 120) : `Video from @${user.handle}`}
            subtitle={`${user.name} · @${user.handle}`}
            channel="x"
            originalUrl={url}
            className="mt-3"
          />
        ))}

      {photos.length > 0 && (
        <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl ${photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {photos.map((p) => (
            <img key={p.url} src={p.url} alt="" loading="lazy" className="h-full max-h-72 w-full object-cover" />
          ))}
        </div>
      )}

      <footer className="mt-3 flex items-center gap-4 text-[13px] text-ink-3 tnum">
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="size-3.5" />
          {compactNumber(replies)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Heart className="size-3.5" />
          {compactNumber(likes)}
        </span>
        {tweet.createdAt && <span className="ml-auto">{formatDate(tweet.createdAt)}</span>}
      </footer>
    </article>
  );
}
