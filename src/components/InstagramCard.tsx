import type { OgData } from "../hooks/useContent";

interface InstagramCardProps {
  url: string;
  ogData?: OgData | null;
}

const POST_RE = /instagram\.com\/p\/([A-Za-z0-9_-]+)/i;
const REEL_RE = /instagram\.com\/reel\/([A-Za-z0-9_-]+)/i;
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

function InstagramLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function GradientFallback({ url, type, id }: { url: string; type: PostType; id: string }) {
  const displayId = type === "profile" ? `@${id}` : id ? id.slice(0, 11) : "";
  return (
    <a href={url} target="_blank" rel="noreferrer" className="block rounded-2xl overflow-hidden group">
      <div
        className="relative flex flex-col items-center justify-center gap-2 py-8"
        style={{ background: "linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)" }}
      >
        <div className="text-white/80 group-hover:text-white transition-colors">
          <InstagramLogo />
        </div>
        <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
          Instagram {LABEL[type]}
        </span>
        {displayId && (
          <span className="text-sm font-mono font-semibold text-white/90 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
            {displayId}
          </span>
        )}
        <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-white/60 group-hover:text-white/90 transition-colors flex items-center gap-1">
          View on Instagram
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-50">
        <img
          src="https://www.google.com/s2/favicons?domain=instagram.com&sz=32"
          alt="" width={14} height={14} className="rounded shrink-0"
        />
        <span className="text-[11px] font-medium text-gray-400">instagram.com</span>
      </div>
    </a>
  );
}

export function InstagramCard({ url, ogData: _ogData }: InstagramCardProps) {
  const { type, id } = parse(url);

  if ((type === "post" || type === "reel") && id) {
    const prefix = type === "reel" ? "reel" : "p";
    // Reels are portrait 9:16 so need more room; posts are square 1:1.
    const height = type === "reel" ? 600 : 520;

    return (
      // -mx-5 -mb-5 breaks out of the Card body's px-5 pb-5 padding so the
      // embed fills edge-to-edge, just like a full-bleed image. The parent
      // Card's overflow-hidden + rounded-3xl handle the corner clipping.
      <div className="-mx-5 -mb-5 overflow-hidden">
        <iframe
          src={`https://www.instagram.com/${prefix}/${id}/embed/`}
          style={{
            width: "calc(100% + 20px)",
            height: `${height}px`,
            border: 0,
            display: "block",
          }}
          loading="lazy"
          allow="autoplay; encrypted-media"
          title={`Instagram ${LABEL[type]}`}
        />
      </div>
    );
  }

  return <GradientFallback url={url} type={type} id={id} />;
}
