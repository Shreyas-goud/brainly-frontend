import type { ComponentType, CSSProperties } from "react";
import {
  ChefHat,
  Clapperboard,
  Dumbbell,
  GraduationCap,
  Inbox,
  Laugh,
  Lightbulb,
  MapPin,
  ShoppingBag,
} from "lucide-react";

export type IntentId =
  | "recipes"
  | "workouts"
  | "places"
  | "learn"
  | "shopping"
  | "watch"
  | "ideas"
  | "laughs"
  | "unsorted";

export type IntentConfig = {
  id: IntentId;
  label: string;
  Icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  /** What "done" means for this kind of save. */
  doneVerb: string;
  /** The nudge shown when it comes back. */
  prompt: string;
  /** Tint for the chip and icon. */
  hue: string;
};

export const INTENTS: IntentConfig[] = [
  { id: "recipes", label: "Recipes", Icon: ChefHat, doneVerb: "Cooked it", prompt: "Cook this one this week?", hue: "#E8590C" },
  { id: "workouts", label: "Workouts", Icon: Dumbbell, doneVerb: "Did it", prompt: "Fit this into a session?", hue: "#0B8F6A" },
  { id: "places", label: "Places", Icon: MapPin, doneVerb: "Been there", prompt: "Somewhere to go soon?", hue: "#1C7ED6" },
  { id: "learn", label: "Learn", Icon: GraduationCap, doneVerb: "Learned it", prompt: "Ten minutes to learn this?", hue: "#7048E8" },
  { id: "shopping", label: "Shopping", Icon: ShoppingBag, doneVerb: "Sorted", prompt: "Still want it?", hue: "#C2255C" },
  { id: "watch", label: "Watch", Icon: Clapperboard, doneVerb: "Watched it", prompt: "Watch it tonight?", hue: "#D9480F" },
  { id: "ideas", label: "Ideas", Icon: Lightbulb, doneVerb: "Used it", prompt: "Does this spark something now?", hue: "#E0A100" },
  { id: "laughs", label: "Laughs", Icon: Laugh, doneVerb: "Shared it", prompt: "Worth sending to someone?", hue: "#E64980" },
  { id: "unsorted", label: "Unsorted", Icon: Inbox, doneVerb: "Done with it", prompt: "Why did you save this?", hue: "#868E96" },
];

const MAP = new Map(INTENTS.map((i) => [i.id, i]));

export function getIntent(id: IntentId | undefined | null): IntentConfig {
  return MAP.get(id ?? "unsorted") ?? (MAP.get("unsorted") as IntentConfig);
}

/** Intents a person can pick, without the "unsorted" bucket. */
export const PICKABLE_INTENTS = INTENTS.filter((i) => i.id !== "unsorted");
