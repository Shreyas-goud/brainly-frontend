import { useEffect, useState } from "react";
import type { OgData } from "../hooks/useContent";
import { LinkPreviewCard } from "./LinkPreviewCard";

interface GitHubCardProps {
  url: string;
  ogData?: OgData | null;
}

interface GitHubRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  owner: { avatar_url: string; login: string };
  html_url: string;
  topics: string[];
  updated_at: string;
}

const REPO_RE = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/?#\s]+)/i;

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded w-3/4" />
      <div className="flex gap-3 mt-3">
        <div className="h-4 bg-gray-100 rounded w-10" />
        <div className="h-4 bg-gray-100 rounded w-10" />
        <div className="h-4 bg-gray-100 rounded w-14" />
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23L7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0z" />
    </svg>
  );
}

export function GitHubCard({ url, ogData }: GitHubCardProps) {
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const match = url.match(REPO_RE);
  const isRepoUrl = Boolean(match);

  useEffect(() => {
    if (!match) {
      setStatus("error");
      return;
    }
    const [, owner, repoName] = match;
    let active = true;
    setStatus("loading");
    fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<GitHubRepo>;
      })
      .then((data) => {
        if (!active) return;
        setRepo(data);
        setStatus("ready");
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [url]);

  // Non-repo GitHub URL or API failed — fall back to OG preview card.
  if (!isRepoUrl || status === "error") {
    return <LinkPreviewCard url={url} ogData={ogData} />;
  }

  if (status === "loading") return <Skeleton />;
  if (!repo) return <LinkPreviewCard url={url} ogData={ogData} />;

  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] ?? "#8b8b8b") : null;

  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-gray-100 p-4 hover:border-purple-100 hover:shadow-md transition-all group"
    >
      {/* Header: avatar + repo name */}
      <div className="flex items-center gap-3 mb-2.5">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          width={32}
          height={32}
          loading="lazy"
          className="rounded-full shrink-0 ring-1 ring-gray-100"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 font-mono leading-tight truncate group-hover:text-purple-700 transition-colors">
            {repo.full_name}
          </p>
          <p className="text-[11px] text-gray-400">github.com</p>
        </div>
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors shrink-0 ml-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>

      {/* Description */}
      {repo.description && (
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
          {repo.description}
        </p>
      )}

      {/* Topics */}
      {repo.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {repo.topics.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {langColor && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: langColor }}
            />
            <span>{repo.language}</span>
          </span>
        )}
        <span className="flex items-center gap-1 text-amber-600">
          <StarIcon />
          {formatCount(repo.stargazers_count)}
        </span>
        <span className="flex items-center gap-1">
          <ForkIcon />
          {formatCount(repo.forks_count)}
        </span>
      </div>
    </a>
  );
}
