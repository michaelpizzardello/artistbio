import Link from "next/link"
import { Binoculars, Plus } from "lucide-react"

type DashboardBottomNavProps = {
  previewPath: string
  onAddClick: () => void
}

export default function DashboardBottomNav({ previewPath, onAddClick }: DashboardBottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d5d7d1] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto grid h-12 w-full max-w-md grid-cols-2 px-3">
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[#1f251f] hover:bg-[#f3f4ef]"
          aria-label="Add"
        >
          <Plus className="size-6" />
          <span className="text-[10px] font-medium leading-none">Add</span>
        </button>
        <Link
          href={previewPath}
          className="inline-flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[#1f251f] hover:bg-[#f3f4ef]"
          aria-label="Preview"
        >
          <Binoculars className="size-6" />
          <span className="text-[10px] font-medium leading-none">Preview</span>
        </Link>
      </div>
    </div>
  )
}
