interface GenericLinkCardProps {
  url: string;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function GenericLinkCard({ url }: GenericLinkCardProps) {
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
        width={32}
        height={32}
        loading="lazy"
        className="rounded-lg shrink-0 bg-gray-100"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-700 truncate">{hostname}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{url}</p>
      </div>
      <svg
        className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}
