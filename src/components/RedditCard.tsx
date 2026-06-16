import { useState, useEffect } from "react";
import { api } from "../lib/api";
import type { OgData } from "../hooks/useContent";

interface RedditCardProps {
  url: string;
  ogData?: OgData | null;
}

interface RedditPost {
  title: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  flair: string | null;
  created_utc: number;
  image: string | null;
  selftext: string | null;
  is_self: boolean;
}

function timeAgo(utc: number): string {
  const s = Math.floor(Date.now() / 1000 - utc);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 space-y-3 animate-pulse">
      <div className="h-3 w-28 bg-gray-100 rounded-full" />
      <div className="h-4 bg-gray-100 rounded" />
      <div className="h-4 w-3/4 bg-gray-100 rounded" />
      <div className="h-3 w-20 bg-gray-100 rounded-full" />
    </div>
  );
}

function Fallback({ url, ogData }: { url: string; ogData?: OgData | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-orange-100 hover:bg-orange-50/30 transition-all"
    >
      <img
        src="https://www.google.com/s2/favicons?domain=reddit.com&sz=32"
        alt="" width={20} height={20} className="rounded-full shrink-0"
      />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {ogData?.title ?? "View on Reddit"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">reddit.com</p>
      </div>
    </a>
  );
}

export function RedditCard({ url, ogData }: RedditCardProps) {
  const [post, setPost] = useState<RedditPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get<RedditPost>("/api/v1/reddit", { params: { url } })
      .then((r) => { if (active) setPost(r.data); })
      .catch(() => { /* show fallback */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [url]);

  if (loading) return <Skeleton />;
  if (!post) return <Fallback url={url} ogData={ogData} />;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group overflow-hidden"
    >
      {/* Cover image */}
      {post.image && (
        <div className="overflow-hidden bg-gray-50">
          <img
            src={post.image}
            alt={post.title}
            loading="lazy"
            className="w-full object-cover max-h-48 group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="p-3">
        {/* Meta row */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <img
            src="https://www.google.com/s2/favicons?domain=reddit.com&sz=32"
            alt="" width={13} height={13} className="rounded-full shrink-0"
          />
          <span className="text-[11px] font-bold text-orange-500">
            r/{post.subreddit}
          </span>
          <span className="text-[10px] text-gray-300">•</span>
          <span className="text-[11px] text-gray-400">u/{post.author}</span>
          <span className="text-[10px] text-gray-300">•</span>
          <span className="text-[11px] text-gray-400">{timeAgo(post.created_utc)}</span>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-3 mb-2">
          {post.title}
        </p>

        {/* Selftext preview */}
        {post.is_self && post.selftext && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">
            {post.selftext}
          </p>
        )}

        {/* Flair */}
        {post.flair && (
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 mb-2">
            {post.flair}
          </span>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-1.5">
          {/* Upvote */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l8 8H4z" />
            </svg>
            {fmt(post.score)}
          </div>
          {/* Comments */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {fmt(post.num_comments)}
          </div>
        </div>
      </div>
    </a>
  );
}
