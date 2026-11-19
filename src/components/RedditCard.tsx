import { useEffect, useState } from "react";
import { ArrowBigUp, MessageSquare } from "lucide-react";
import { api } from "../lib/api";
import { compactNumber } from "../lib/format";
import type { OgData } from "../hooks/useContent";
import { LinkPreviewCard } from "./LinkPreviewCard";

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
  const mo = Math.floor(d / 30);
  return mo < 12 ? `${mo}mo` : `${Math.floor(mo / 12)}y`;
}

export function RedditCard({ url, ogData }: RedditCardProps) {
  const [post, setPost] = useState<RedditPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<RedditPost>("/api/v1/reddit", { params: { url } })
      .then((r) => active && setPost(r.data))
      .catch(() => {
        /* the link preview below takes over */
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="space-y-2.5" aria-hidden="true">
        <div className="skeleton h-2.5 w-32 rounded" />
        <div className="skeleton h-3.5 w-full rounded" />
        <div className="skeleton h-3.5 w-3/4 rounded" />
      </div>
    );
  }
  if (!post) return <LinkPreviewCard url={url} ogData={ogData} />;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="group/inner block">
      <div className="flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-ink-3">
        <span className="font-semibold text-[#FF4500]">r/{post.subreddit}</span>
        <span aria-hidden="true">·</span>
        <span>u/{post.author}</span>
        <span aria-hidden="true">·</span>
        <span>{timeAgo(post.created_utc)}</span>
      </div>

      {post.image && !imageFailed && (
        <div className="mt-2.5 overflow-hidden rounded-xl bg-surface-2">
          <img
            src={post.image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="max-h-56 w-full object-cover transition-transform duration-500 ease-out group-hover/inner:scale-[1.03]"
          />
        </div>
      )}

      {post.is_self && post.selftext && (
        <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-2">{post.selftext}</p>
      )}

      <div className="mt-3 flex items-center gap-3 text-[13px] text-ink-3 tnum">
        <span className="inline-flex items-center gap-1 font-medium text-ink-2">
          <ArrowBigUp className="size-4 text-[#FF4500]" />
          {compactNumber(post.score)}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5" />
          {compactNumber(post.num_comments)}
        </span>
        {post.flair && (
          <span className="ml-auto truncate rounded-full bg-surface-2 px-2 py-0.5 text-xs text-ink-2">
            {post.flair}
          </span>
        )}
      </div>
    </a>
  );
}
