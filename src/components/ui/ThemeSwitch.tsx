import { motion } from "motion/react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../../lib/theme";
import { cn } from "../../lib/cn";

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "Auto", Icon: Monitor },
];

export function ThemeSwitch({ className, id = "theme" }: { className?: string; id?: string }) {
  const { preference, setPreference } = useTheme();
  return (
    <div role="radiogroup" aria-label="Theme" className={cn("flex rounded-lg bg-surface-2 p-0.5", className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const on = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setPreference(value)}
            className={cn(
              "relative flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md text-xs transition-colors",
              on ? "text-ink" : "text-ink-3 hover:text-ink"
            )}
          >
            {on && (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 rounded-md bg-surface shadow-card ring-1 ring-line"
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              />
            )}
            <Icon className="relative size-3.5" />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
