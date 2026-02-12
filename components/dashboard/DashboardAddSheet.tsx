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

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] bg-[#f3f4ef] p-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#c8cbc2]" />
        <div className="rounded-2xl bg-[#e8e9e4] px-4 py-3">
          <label className="flex items-center gap-2 text-[#1f251f]">
            <Search className="size-5" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="w-full bg-transparent text-base outline-none placeholder:text-[#5c6157]"
              placeholder="Paste or search a link"
            />
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button type="button" onClick={onAddArtwork} className="rounded-2xl bg-[#e8e9e4] p-4 text-center">
            <ImagePlus className="mx-auto size-7 text-[#6a28ff]" />
            <p className="mt-2 text-sm font-semibold text-[#1f251f]">Artwork</p>
          </button>
          <button type="button" onClick={onAddExhibition} className="rounded-2xl bg-[#e8e9e4] p-4 text-center">
            <CalendarDays className="mx-auto size-7 text-[#6a28ff]" />
            <p className="mt-2 text-sm font-semibold text-[#1f251f]">Exhibitions</p>
          </button>
          <button type="button" onClick={onAddLink} className="rounded-2xl bg-[#e8e9e4] p-4 text-center">
            <Link2 className="mx-auto size-7 text-[#6a28ff]" />
            <p className="mt-2 text-sm font-semibold text-[#1f251f]">Link</p>
          </button>
          <button type="button" onClick={onAddNews} className="rounded-2xl bg-[#e8e9e4] p-4 text-center">
            <Newspaper className="mx-auto size-7 text-[#6a28ff]" />
            <p className="mt-2 text-sm font-semibold text-[#1f251f]">News</p>
          </button>
        </div>
      </div>
    </div>
  )
}
