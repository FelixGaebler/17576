import { cn } from "@/lib/utils"

type Mood = "happy" | "confused" | "sad"

const arms: Record<Mood, string> = {
  happy: "M22 78 q-12 8 -12 22 M98 70 q16 -6 18 -28",
  confused: "M22 72 q-14 -2 -16 -18 M98 72 q14 -2 16 -18",
  sad: "M22 76 q-10 10 -8 26 M98 76 q10 10 8 26",
}

const mouths: Record<Mood, string> = {
  happy: "M50 96 q10 9 20 0",
  confused: "M50 98 q5 -5 10 0 t10 0",
  sad: "M50 100 q10 -8 20 0",
}

/** A friendly letter tile, the 26³ mascot. Decorative only. */
export function TileCharacter({ mood, className }: { mood: Mood; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 140"
      aria-hidden
      className={cn("fill-none stroke-foreground", className)}
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M46 116 v14 h-8 M74 116 v14 h8" />
      <path d={arms[mood]} />
      <rect x="20" y="28" width="80" height="90" rx="22" className="fill-primary" />
      <rect x="32" y="40" width="56" height="18" rx="9" className="fill-background/60 stroke-none" />
      <circle cx="47" cy="78" r="4.5" className="fill-foreground stroke-none" />
      <circle cx="73" cy="78" r="4.5" className="fill-foreground stroke-none" />
      <path d={mouths[mood]} />
      {mood === "confused" && (
        <text x="108" y="26" className="fill-muted-foreground stroke-none text-[28px] font-bold">
          ?
        </text>
      )}
      {mood === "happy" && <path d="M110 18 l4 -6 M118 28 l7 -2 M104 12 l-1 -7" className="stroke-primary" />}
    </svg>
  )
}
