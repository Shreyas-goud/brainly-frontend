import { useEffect, useState } from "react";

export function useElapsedSince(since: number | null, intervalMs = 500): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (since == null) {
      setElapsed(0);
      return;
    }
    setElapsed(Date.now() - since);
    const id = window.setInterval(() => {
      setElapsed(Date.now() - since);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [since, intervalMs]);

  return elapsed;
}

export function progressiveSubmitMessage(elapsedMs: number, verb: string): string {
  if (elapsedMs < 2_000) return `${verb}…`;
  if (elapsedMs < 8_000) return "Connecting to the server…";
  return "The server is waking up — this can take up to a minute on the first request.";
}
