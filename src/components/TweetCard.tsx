import { useEffect, useState } from "react";
import { api } from "../lib/api";

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

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function VerifiedBadge() {
  return (
    <svg viewBox="0 0 24 24" aria-label="Verified" className="w-[18px] h-[18px] text-[#1d9bf0] shrink-0">
      <g fill="currentColor">
        <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
      </g>
    </svg>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 text-black shrink-0">
      <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-500">
      {icon}
      <span className="text-sm">{value}</span>
    </span>
  );
}

/**
 * Renders a faithful X / Twitter post from our backend's normalized data
 * (syndication API), including X Article cards that the official iframe embed
 * silently drops. Entirely in-DOM — no third-party iframe.
 */
export function TweetCard({ url }: { url: string }) {
  const id = extractTweetId(url);
  const [tweet, setTweet] = useState<NormalizedTweet | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

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
      <div className="rounded-2xl border border-gray-200 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 bg-gray-200 rounded" />
            <div className="h-3 w-1/4 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="mt-4 h-44 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (status === "error" || !tweet) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <span className="shrink-0 w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold">
          𝕏
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-gray-900">
            View this post on X
          </span>
          <span className="block text-xs text-gray-500 truncate">{url}</span>
        </span>
      </a>
    );
  }

  const { user, text, article, photos, video, likes, replies } = tweet;

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-normal text-gray-900">
      {/* Header */}
      <header className="flex items-start gap-3">
        <a href={tweet.url} target="_blank" rel="noreferrer" className="shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200" />
          )}
        </a>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-1">
            <span className="font-bold truncate hover:underline">
              {user.name}
            </span>
            {user.verified && <VerifiedBadge />}
          </div>
          <span className="text-gray-500 text-sm">@{user.handle}</span>
        </div>
        <a href={tweet.url} target="_blank" rel="noreferrer" aria-label="Open on X">
          <XLogo />
        </a>
      </header>

      {/* Text */}
      {text && (
        <p className="mt-3 whitespace-pre-wrap break-words">{text}</p>
      )}

      {/* Article card */}
      {article && (
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block rounded-2xl border border-gray-200 overflow-hidden hover:bg-gray-50 transition-colors"
        >
          {article.coverImage && (
            <div className="relative">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full max-h-72 object-cover"
                loading="lazy"
              />
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 text-white text-xs font-semibold backdrop-blur-sm">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                  <path d="M4 5h16v2H4V5zm0 6h16v2H4v-2zm0 6h10v2H4v-2z" />
                </svg>
                Article
              </span>
            </div>
          )}
          <div className="p-3">
            <h3 className="font-bold leading-snug line-clamp-2">
              {article.title}
            </h3>
            {article.preview && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-3">
                {article.preview}
              </p>
            )}
          </div>
        </a>
      )}

      {/* Video */}
      {video && (
        <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-black">
          <video
            src={video.src}
            poster={video.poster ?? undefined}
            controls={!video.isGif}
            autoPlay={video.isGif}
            loop={video.isGif}
            muted={video.isGif}
            playsInline
            preload="metadata"
            className="w-full max-h-80 bg-black"
          />
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div
          className={`mt-3 grid gap-1 rounded-2xl overflow-hidden ${
            photos.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {photos.map((p) => (
            <img
              key={p.url}
              src={p.url}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover max-h-72"
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-5">
        <Stat
          icon={
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
              <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01z" />
            </svg>
          }
          value={formatCount(replies)}
        />
        <Stat
          icon={
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-pink-600" fill="currentColor">
              <path d="M20.884 13.19c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z" />
            </svg>
          }
          value={formatCount(likes)}
        />
        <a
          href={tweet.url}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-sm font-semibold text-[#1d9bf0] hover:underline"
        >
          Read on X
        </a>
      </div>

      {tweet.createdAt && (
        <div className="mt-2 text-xs text-gray-400">
          {formatDate(tweet.createdAt)}
        </div>
      )}
    </article>
  );
}
