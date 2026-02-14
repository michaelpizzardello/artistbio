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
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-[#f4f5f3] text-[#1f251f] transition hover:border-[#dfe3db]"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="truncate text-2xl font-bold text-[#1f251f]">{title}</h1>
      </div>
      {action}
    </div>
  )
}
