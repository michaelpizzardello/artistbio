import { ChevronLeft } from "lucide-react"

type DashboardSectionHeaderProps = {
  title: string
  onBack: () => void
}

export default function DashboardSectionHeader({ title, onBack }: DashboardSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="rounded-full border border-transparent bg-[#f4f5f3] p-2 text-[#1f251f] transition hover:border-[#dfe3db]"
      >
        <ChevronLeft className="size-5" />
      </button>
      <h1 className="text-2xl font-bold text-[#1f251f]">{title}</h1>
    </div>
  )
}
