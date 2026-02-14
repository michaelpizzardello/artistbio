import type { ReactNode } from "react"
import { ChevronLeft } from "lucide-react"

type DashboardSectionHeaderProps = {
  title: string
  onBack: () => void
  action?: ReactNode
}

export default function DashboardSectionHeader({ title, onBack, action }: DashboardSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-muted text-foreground transition hover:border-border"
        >
          <ChevronLeft className="size-4.5" />
        </button>
        <h1 className="truncate text-xl font-semibold text-foreground">{title}</h1>
      </div>
      {action}
    </div>
  )
}
