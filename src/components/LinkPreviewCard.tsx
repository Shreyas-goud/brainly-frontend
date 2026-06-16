import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { OgData } from "../hooks/useContent";

interface LinkPreviewCardProps {
  url: string;
  ogData?: OgData | null;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-100" />
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-50 rounded w-full" />
        <div className="h-3 bg-gray-50 rounded w-2/3" />
      </div>
    </div>
  );
}

function MinimalFallback({ url }: { url: string }) {
  const hostname = getHostname(url);
  const faviconSrc = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 hover:border-purple-100 transition-all group"
    >
      <img
        src={faviconSrc}
        alt=""
        width={28}
        height={28}
        loading="lazy"
        className="rounded-lg shrink-0 bg-gray-100"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-700 truncate">{hostname}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{url}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export function LinkPreviewCard({ url, ogData: ogDataProp }: LinkPreviewCardProps) {
  const [ogData, setOgData] = useState<OgData | null>(ogDataProp ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    ogDataProp ? "ready" : "loading"
  );
  const hostname = getHostname(url);

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
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [url, ogDataProp]);

  if (status === "loading") return <Skeleton />;
  if (status === "error" || !ogData) return <MinimalFallback url={url} />;

  const { title, description, image, favicon } = ogData;
  const displayTitle = title || hostname;
  const faviconSrc = favicon || `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-gray-100 overflow-hidden hover:border-purple-100 hover:shadow-md transition-all group"
    >
      {image && (
        <div className="overflow-hidden bg-gray-50">
          <img
            src={image}
            alt=""
            loading="lazy"
            className="w-full object-cover max-h-48 group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"; }}
          />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <img
            src={faviconSrc}
            alt=""
            width={14}
            height={14}
            loading="lazy"
            className="rounded shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <span className="text-[11px] font-medium text-gray-400 truncate">{hostname}</span>
        </div>

        {displayTitle && (
          <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
            {displayTitle}
          </p>
        )}

        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </a>
  );
}
