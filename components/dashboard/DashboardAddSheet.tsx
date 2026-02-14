import { CalendarDays, ImagePlus, Link2, Newspaper, Search } from "lucide-react"

type DashboardAddSheetProps = {
  open: boolean
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  onClose: () => void
  onAddArtwork: () => void
  onAddExhibition: () => void
  onAddLink: () => void
  onAddNews: () => void
}

type AddOption = {
  label: string
  description: string
  icon: typeof ImagePlus
  action: () => void
}

export default function DashboardAddSheet({
  open,
  searchQuery,
  onSearchQueryChange,
  onClose,
  onAddArtwork,
  onAddExhibition,
  onAddLink,
  onAddNews,
}: DashboardAddSheetProps) {
  if (!open) return null

  const options: AddOption[] = [
    {
      label: "Artwork",
      description: "Upload media and publish a work",
      icon: ImagePlus,
      action: onAddArtwork,
    },
    {
      label: "Exhibition",
      description: "Create a show with dates and venue",
      icon: CalendarDays,
      action: onAddExhibition,
    },
    {
      label: "Link",
      description: "Add an external URL",
      icon: Link2,
      action: onAddLink,
    },
    {
      label: "News",
      description: "Post an announcement or update",
      icon: Newspaper,
      action: onAddNews,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add new content"
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[24px] border-t border-[#d7dbcff0] bg-[#f3f4ef] p-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#c8cbc2]" />
        <h2 className="text-base font-semibold text-[#1f251f]">Add</h2>
        <p className="mt-1 text-sm text-[#5a6458]">Choose what you want to create.</p>

        <div className="mt-4 rounded-xl border border-[#d9ddd3] bg-white px-3 py-2.5">
          <label className="flex items-center gap-2 text-[#1f251f]" aria-label="Prefill URL for link or news">
            <Search className="size-[18px] text-[#5d6758]" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#7b8476]"
              placeholder="Paste URL (optional)"
            />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                type="button"
                onClick={option.action}
                className="flex w-full items-center gap-3 rounded-xl border border-[#d7dbd1] bg-white px-3 py-2.5 text-left transition hover:border-[#bfc5b8]"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#edf1e8] text-[#344033]">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#1f251f]">{option.label}</span>
                  <span className="block truncate text-xs text-[#60695c]">{option.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
