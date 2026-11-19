const KEY = "brainly:pendingLink";

/** Remembers a link typed on the landing page so the app can open it after sign-in. */
export function setPendingLink(link: string) {
  try {
    sessionStorage.setItem(KEY, link);
  } catch {
    /* storage blocked: the visitor just pastes it again */
  }
}

export function takePendingLink(): string | null {
  try {
    const link = sessionStorage.getItem(KEY);
    if (link) sessionStorage.removeItem(KEY);
    return link;
  } catch {
    return null;
  }
}
