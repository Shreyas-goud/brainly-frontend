import { useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { InstagramMark } from "./icons/brands";
import type { OgData } from "../hooks/useContent";

interface InstagramCardProps {
  url: string;
  ogData?: OgData | null;
  /** Show the embed straight away (the full-screen viewer), not the tap-to-load tile. */
  startLoaded?: boolean;
}

const POST_RE = /instagram\.com\/p\/([A-Za-z0-9_-]+)/i;
const REEL_RE = /instagram\.com\/reels?\/([A-Za-z0-9_-]+)/i;
const STORY_RE = /instagram\.com\/stories\/([^/]+)\//i;
const PROFILE_RE = /instagram\.com\/([A-Za-z0-9._]+)\/?$/i;

type PostType = "reel" | "post" | "story" | "profile";

function parse(url: string): { type: PostType; id: string } {
  let m = url.match(REEL_RE);
  if (m) return { type: "reel", id: m[1] };
  m = url.match(POST_RE);
  if (m) return { type: "post", id: m[1] };
  m = url.match(STORY_RE);
  if (m) return { type: "story", id: m[1] };
  m = url.match(PROFILE_RE);
  if (m) return { type: "profile", id: m[1] };
  return { type: "post", id: "" };
}

const LABEL: Record<PostType, string> = {
  reel: "Reel",
  post: "Post",
  story: "Story",
  profile: "Profile",
};

const GRADIENT = "radial-gradient(120% 120% at 20% 110%, #fdc468 0%, #f45e3c 35%, #d6249f 62%, #4f5bd5 100%)";

/**
 * A tile until tapped. Instagram's embed is tall and heavy, and a board full of
 * reels would load a board full of them.
 */
export function InstagramCard({ url, ogData, startLoaded = false }: InstagramCardProps) {
  const { type, id } = parse(url);
  const [loaded, setLoaded] = useState(startLoaded);
  const [imageFailed, setImageFailed] = useState(false);
  const embeddable = (type === "post" || type === "reel") && Boolean(id);
  const cover = ogData?.image && !imageFailed ? ogData.image : null;

  if (embeddable && loaded) {
    const prefix = type === "reel" ? "reel" : "p";
    return (
      <div className="overflow-hidden rounded-xl bg-white ring-1 ring-line">
        <iframe
          src={`https://www.instagram.com/${prefix}/${id}/embed/`}
          className="block w-full border-0"
          style={{ height: type === "reel" ? 600 : 520 }}
          allow="autoplay; encrypted-media"
          referrerPolicy="strict-origin-when-cross-origin"
          title={`Instagram ${LABEL[type]}`}
        />
      </div>
    );
  }

  const label = type === "profile" ? `@${id}` : LABEL[type];
  const body = (
    <>
      {cover ? (
        <img
          src={cover}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover/ig:scale-[1.03]"
        />
      ) : (
        <span className="absolute inset-0" style={{ background: GRADIENT }} />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10" />
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">
        <InstagramMark className="size-3" />
        {label}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        {embeddable ? (
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-black shadow-lift transition-transform duration-200 ease-out group-hover/ig:scale-110">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
        ) : (
          <ArrowUpRight className="size-6 text-white/90" />
        )}
      </span>
    </>
  );

  const shape = `group/ig relative block w-full overflow-hidden rounded-xl text-left ${type === "reel" ? "aspect-[4/5]" : "aspect-square"}`;

  return embeddable ? (
    <button type="button" onClick={() => setLoaded(true)} className={shape} aria-label={`Play Instagram ${LABEL[type]}`}>
      {body}
    </button>
  ) : (
    <a href={url} target="_blank" rel="noreferrer" className={shape}>
      {body}
    </a>
  );
}
