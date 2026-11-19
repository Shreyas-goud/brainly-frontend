import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { api } from "../lib/api";
import { hostnameOf } from "../lib/format";
import type { OgData } from "../hooks/useContent";

interface LinkPreviewCardProps {
  url: string;
  ogData?: OgData | null;
}

function Favicon({ src, host }: { src?: string | null; host: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src || `https://www.google.com/s2/favicons?domain=${host}&sz=64`}
      alt=""
      width={14}
      height={14}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-3.5 shrink-0 rounded-sm"
    />
  );
}

export function LinkPreviewCard({ url, ogData: ogDataProp }: LinkPreviewCardProps) {
  const [ogData, setOgData] = useState<OgData | null>(ogDataProp ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(ogDataProp ? "ready" : "loading");
  const [imageFailed, setImageFailed] = useState(false);
  const host = hostnameOf(url);

  useEffect(() => {
    if (ogDataProp) {
      setOgData(ogDataProp);
      setStatus("ready");
      return;
    }
    let active = true;
    setStatus("loading");
    api
      .get<OgData>("/api/v1/link-preview", { params: { url } })
      .then((res) => {
        if (!active) return;
        setOgData(res.data);
        setStatus("ready");
      })
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [url, ogDataProp]);

  if (status === "loading") {
    return (
      <div className="space-y-2.5" aria-hidden="true">
        <div className="skeleton aspect-[1.91/1] w-full rounded-xl" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    );
  }

  if (status === "error" || !ogData) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group/inner flex items-center gap-3 rounded-xl bg-surface-2 p-3 transition-colors hover:bg-surface-3"
      >
        <Favicon host={host} />
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{url}</span>
        <ArrowUpRight className="size-4 shrink-0 text-ink-3 transition-transform group-hover/inner:-translate-y-0.5 group-hover/inner:translate-x-0.5" />
      </a>
    );
  }

  const { title, description, image, favicon } = ogData;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="group/inner block">
      {image && !imageFailed && (
        <div className="overflow-hidden rounded-xl bg-surface-2 ring-1 ring-inset ring-line">
          <img
            src={image}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="aspect-[1.91/1] w-full object-cover transition-transform duration-500 ease-out group-hover/inner:scale-[1.03]"
          />
        </div>
      )}
      {description && (
        <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2 text-pretty">{description}</p>
      )}
      <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-ink-3">
        <Favicon src={favicon} host={host} />
        <span className="truncate">{host}</span>
        {title && !description && <span className="sr-only">{title}</span>}
      </div>
    </a>
  );
}
