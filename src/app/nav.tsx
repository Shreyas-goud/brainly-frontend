import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, Check, CircleCheck, ChevronsUpDown, ListChecks, LogOut, Plus, Search, Share2, Smartphone } from "lucide-react";
import { LogoMark } from "../components/brand/Logo";
import { ThemeSwitch } from "../components/ui/ThemeSwitch";
import { SourceIcon } from "../components/ui/SourceIcon";
import { useAuth } from "../lib/auth/AuthContext";
import { saveSettings, type RunSettings } from "../lib/runApi";
import { appPath } from "../lib/channels";
import { useApps, useCatchUpStatus } from "./navData";
import { useAppData } from "./AppData";
import { cn } from "../lib/cn";

const EASE = [0.16, 1, 0.3, 1] as const;

function SideLink({ to, end, icon, label, trailing }: { to: string; end?: boolean; icon: ReactNode; label: string; trailing?: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[14px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
          isActive ? "font-medium text-ink" : "text-ink-2 hover:bg-surface-2 hover:text-ink"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-lg bg-surface shadow-card ring-1 ring-line"
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
            />
          )}
          <span className="relative flex size-5 shrink-0 items-center justify-center">{icon}</span>
          <span className="relative min-w-0 flex-1 truncate">{label}</span>
          {trailing && <span className="relative shrink-0">{trailing}</span>}
        </>
      )}
    </NavLink>
  );
}

function Count({ n }: { n: number }) {
  if (n === 0) return null;
  return <span className="text-[12.5px] font-normal text-ink-3 tnum">{n}</span>;
}

export function CatchUpBadge({ className }: { className?: string }) {
  const { state, left } = useCatchUpStatus();
  if (state === "done") return <Check className={cn("size-4 text-success", className)} strokeWidth={2.5} aria-label="Done for today" />;
  if (state !== "ready" || left === 0) return null;
  return (
    <span
      className={cn("flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white tnum", className)}
      aria-label={`${left} left`}
    >
      {left}
    </span>
  );
}

/** Desktop navigation: save and search, today's catch-up, everything, then one row per app. */
export function Sidebar() {
  const { modals } = useAppData();
  const { apps, total, done } = useApps();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-bg lg:flex" aria-label="Brainly">
      <Link to="/app" className="flex h-16 shrink-0 items-center gap-2.5 px-5 outline-none">
        <LogoMark className="size-8" />
        <span className="text-[17px] font-semibold tracking-title text-ink">Brainly</span>
      </Link>

      <div className="space-y-2 px-3">
        <button
          type="button"
          onClick={() => modals.openSave()}
          title="Save a link (N)"
          className="flex h-10 w-full items-center gap-2.5 rounded-xl bg-inverse px-3 text-[14px] font-medium text-inverse-ink shadow-card transition-transform active:scale-[0.98]"
        >
          <Plus className="size-[18px]" strokeWidth={2.2} />
          Save a link
          <kbd className="ml-auto rounded-md bg-inverse-ink/15 px-1.5 font-sans text-[11px] text-inverse-ink/70">N</kbd>
        </button>
        <button
          type="button"
          onClick={() => modals.openSearch()}
          className="flex h-9 w-full items-center gap-2.5 rounded-xl bg-surface px-3 text-[13.5px] text-ink-3 ring-1 ring-inset ring-line transition-colors hover:text-ink-2"
        >
          <Search className="size-4" />
          Search
          <kbd className="ml-auto rounded-md bg-surface-2 px-1.5 font-sans text-[11px] text-ink-3 ring-1 ring-inset ring-line">⌘K</kbd>
        </button>
      </div>

      <nav className="mt-5 min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <div className="space-y-0.5">
          <SideLink to="/app/catch-up" icon={<ListChecks className="size-[18px]" />} label="Catch up" trailing={<CatchUpBadge />} />
          <SideLink to="/app" end icon={<Bookmark className="size-[18px]" />} label="All saves" trailing={<Count n={total} />} />
        </div>
        {apps.length > 0 && (
          <>
            <p className="mb-1 mt-6 px-2.5 text-[12px] font-medium text-ink-3">Apps</p>
            <div className="space-y-0.5">
              {apps.map((a) => (
                <SideLink key={a.id} to={appPath(a.id)} icon={<SourceIcon channel={a.id} size="xs" bare />} label={a.label} trailing={<Count n={a.count} />} />
              ))}
            </div>
          </>
        )}
        {done > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <SideLink to="/app/done" icon={<CircleCheck className="size-[18px]" />} label="Done" trailing={<Count n={done} />} />
          </div>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <AccountButton placement="sidebar" />
      </div>
    </aside>
  );
}

/** Phone top bar; the sidebar's job is done by the app chips on the page. */
export function MobileBar() {
  const { modals } = useAppData();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-lg lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link to="/app" className="flex items-center gap-2 outline-none">
          <LogoMark className="size-7" />
          <span className="text-[16px] font-semibold tracking-title">Brainly</span>
        </Link>
        <button
          type="button"
          onClick={() => modals.openSearch()}
          aria-label="Search"
          className="ml-auto flex size-10 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Search className="size-5" />
        </button>
        <AccountButton placement="header" />
      </div>
    </header>
  );
}

/** Phone: the one action that's always there. */
export function SaveFab() {
  const { modals } = useAppData();
  return (
    <button
      type="button"
      onClick={() => modals.openSave()}
      aria-label="Save a link"
      className="fixed bottom-[max(20px,calc(env(safe-area-inset-bottom)+12px))] right-5 z-40 flex size-14 items-center justify-center rounded-2xl bg-inverse text-inverse-ink shadow-float transition-transform active:scale-95 lg:hidden"
    >
      <Plus className="size-6" strokeWidth={2.2} />
    </button>
  );
}

function initials(email: string | null | undefined): string {
  if (!email) return "·";
  const name = email.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name.slice(0, 2) || email[0]).toUpperCase();
}

export function Avatar({ email, className }: { email: string | null | undefined; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2b2b28] to-[#55534c] font-semibold text-white dark:from-[#e9e7e1] dark:to-[#b9b6ad] dark:text-[#121211]",
        className
      )}
    >
      {initials(email)}
    </span>
  );
}

/** The person's avatar; opens the account menu (theme, run settings, capture, share, sign out). */
export function AccountButton({ placement }: { placement: "sidebar" | "header" }) {
  const { me, modals, refreshMe, refreshToday } = useAppData();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function update(fields: Partial<RunSettings>) {
    try {
      await saveSettings(fields);
      await refreshMe();
      if (fields.runSize) refreshToday();
    } catch {
      /* the next open shows the stored value */
    }
  }

  const settings = me?.settings;

  return (
    <div ref={ref} className="relative">
      {placement === "sidebar" ? (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-surface-2"
        >
          <Avatar email={me?.email} className="size-8 text-[12px]" />
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-medium text-ink">{me?.email?.split("@")[0] ?? "You"}</span>
            <span className="block truncate text-[12px] text-ink-3">Settings and sign out</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-ink-3" />
        </button>
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full transition-transform active:scale-95"
        >
          <Avatar email={me?.email} className="size-9 text-[12px]" />
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: placement === "sidebar" ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ duration: 0.2, ease: EASE }}
            className={cn(
              "absolute z-50 w-[280px] rounded-2xl bg-surface p-1.5 shadow-float ring-1 ring-line",
              placement === "sidebar" ? "bottom-full left-0 mb-2 origin-bottom-left" : "right-0 top-full mt-2 origin-top-right"
            )}
          >
            <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
              <Avatar email={me?.email} className="size-9 text-[12px]" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-ink">{me?.email?.split("@")[0] ?? "You"}</p>
                <p className="truncate text-xs text-ink-3">{me?.email ?? ""}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-xl bg-surface-2/60 p-2.5">
              <div>
                <p className="mb-1.5 text-xs text-ink-3">Saves per catch-up</p>
                <div className="flex rounded-lg bg-surface-2 p-0.5">
                  {([3, 5, 7] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update({ runSize: n })}
                      className={cn(
                        "h-7 flex-1 rounded-md text-xs transition-colors tnum",
                        settings?.runSize === n ? "bg-surface font-medium text-ink shadow-card ring-1 ring-line" : "text-ink-3 hover:text-ink"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center justify-between gap-3 text-xs text-ink-3">
                Catch-up ready at
                <input
                  type="time"
                  defaultValue={settings?.ritualTime ?? "20:00"}
                  key={settings?.ritualTime}
                  onBlur={(e) => e.target.value && e.target.value !== settings?.ritualTime && update({ ritualTime: e.target.value })}
                  className="h-7 rounded-md bg-surface px-2 text-xs text-ink ring-1 ring-inset ring-line tnum focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <ThemeSwitch id={`theme-${placement}`} />
            </div>

            <div className="mt-1.5">
              <MenuItem
                icon={<Smartphone className="size-4" />}
                label="Save from your phone"
                onClick={() => {
                  setOpen(false);
                  modals.openCapture();
                }}
              />
              <MenuItem
                icon={<Share2 className="size-4" />}
                label="Share a brain"
                onClick={() => {
                  setOpen(false);
                  modals.openShare();
                }}
              />
              <div className="my-1 h-px bg-line" />
              <MenuItem icon={<LogOut className="size-4" />} label="Sign out" destructive onClick={signOut} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, label, onClick, destructive }: { icon: React.ReactNode; label: string; onClick: () => void; destructive?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] transition-colors",
        destructive ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-surface-2"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** Phones have no sidebar: the apps, and Done, sit in one swipeable row instead. */
export function AppChips() {
  const { apps, total, done } = useApps();
  if (apps.length === 0) return null;
  const chip = (isActive: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] transition-colors",
      isActive ? "bg-inverse font-medium text-inverse-ink" : "bg-surface text-ink-2 ring-1 ring-inset ring-line"
    );
  const n = (v: number) => (v > 0 ? <span className="text-[12px] opacity-60 tnum">{v}</span> : null);
  return (
    <nav aria-label="Apps" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:-mx-6 sm:px-6 lg:hidden">
      <NavLink to="/app" end className={({ isActive }) => chip(isActive)}>
        All
        {n(total)}
      </NavLink>
      {apps.map((a) => (
        <NavLink key={a.id} to={appPath(a.id)} className={({ isActive }) => chip(isActive)}>
          {({ isActive }) => (
            <>
              <SourceIcon channel={a.id} size="xs" bare className={cn(isActive && "[&_*]:!text-current")} />
              {a.label}
              {n(a.count)}
            </>
          )}
        </NavLink>
      ))}
      {done > 0 && (
        <NavLink to="/app/done" className={({ isActive }) => chip(isActive)}>
          <CircleCheck className="size-3.5" />
          Done
          {n(done)}
        </NavLink>
      )}
    </nav>
  );
}
