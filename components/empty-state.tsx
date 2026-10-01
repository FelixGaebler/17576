import type { ComponentProps, ReactNode } from "react"

import { TileCharacter } from "@/components/tile-character"
import { Card, CardContent } from "@/components/ui/card"

type EmptyStateProps = {
  mood: ComponentProps<typeof TileCharacter>["mood"]
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
}

export function EmptyState({ mood, title, description, children }: EmptyStateProps) {
  return (
    <Card className="text-base">
      <CardContent className="flex flex-col items-center gap-4 py-4 text-center">
        <TileCharacter mood={mood} className="w-24" />
        <div className="space-y-1">
          <p className="text-lg font-semibold">{title}</p>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
        {children && <div className="flex flex-wrap justify-center gap-3">{children}</div>}
      </CardContent>
    </Card>
  )
}
