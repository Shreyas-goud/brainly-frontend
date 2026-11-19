import { useEffect, useState } from "react";
import { GitFork, Star } from "lucide-react";
import type { OgData } from "../hooks/useContent";
import { compactNumber } from "../lib/format";
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

export const LANGUAGE_COLORS: Record<string, string> = {
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

export function GitHubCard({ url, ogData }: GitHubCardProps) {
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const match = url.match(REPO_RE);
  const owner = match?.[1];
  const name = match?.[2]?.replace(/\.git$/, "");

  useEffect(() => {
    if (!owner || !name) {
      setStatus("error");
      return;
    }
    let active = true;
    setStatus("loading");
    fetch(`https://api.github.com/repos/${owner}/${name}`, {
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
      .catch(() => active && setStatus("error"));
    return () => {
      active = false;
    };
  }, [owner, name]);

  if (!match || status === "error") return <LinkPreviewCard url={url} ogData={ogData} />;

  if (status === "loading" || !repo) {
    return (
      <div className="space-y-2.5" aria-hidden="true">
        <div className="flex items-center gap-2.5">
          <div className="skeleton size-8 rounded-lg" />
          <div className="skeleton h-3.5 w-1/2 rounded" />
        </div>
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    );
  }

  const langColor = repo.language ? (LANGUAGE_COLORS[repo.language] ?? "#8b8b8b") : null;

  return (
    <a href={repo.html_url} target="_blank" rel="noreferrer" className="group/inner block">
      <div className="flex items-center gap-2.5">
        <img
          src={repo.owner.avatar_url}
          alt=""
          width={32}
          height={32}
          loading="lazy"
          className="size-8 shrink-0 rounded-lg ring-1 ring-line"
        />
        <p className="min-w-0 truncate font-mono text-[13px] text-ink-2">
          {repo.owner.login}/<span className="font-semibold text-ink">{repo.full_name.split("/")[1]}</span>
        </p>
      </div>

      {repo.description && (
        <p className="mt-2.5 line-clamp-3 text-[13.5px] leading-relaxed text-ink-2 text-pretty">{repo.description}</p>
      )}

      {repo.topics?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {repo.topics.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-accent-soft px-2 py-0.5 text-[11.5px] font-medium text-accent-ink">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-[13px] text-ink-3 tnum">
        {langColor && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: langColor }} />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <Star className="size-3.5" />
          {compactNumber(repo.stargazers_count)}
        </span>
        <span className="inline-flex items-center gap-1">
          <GitFork className="size-3.5" />
          {compactNumber(repo.forks_count)}
        </span>
      </div>
    </a>
  );
}
