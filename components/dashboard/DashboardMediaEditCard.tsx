import Image from "next/image"
import type { CSSProperties } from "react"
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd"
import { GripVertical, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import DashboardToggleSwitch from "@/components/dashboard/DashboardToggleSwitch"

type DashboardMediaEditCardProps = {
  blockKey: string
  isDragging: boolean
  dragHandleProps?: DraggableProvidedDragHandleProps | null
  style?: CSSProperties
  label: string
  title: string
  subline: string
  meta: string
  imageUrl: string
  imageAlt: string
  toggleChecked: boolean
  toggleLocked?: boolean
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
  onToggle: () => void
  renderDeleteDropdown: React.ReactNode
}

export default function DashboardMediaEditCard({
  blockKey,
  isDragging,
  dragHandleProps,
  style,
  label,
  title,
  subline,
  meta,
  imageUrl,
  imageAlt,
  toggleChecked,
  toggleLocked = false,
  onEdit,
  onShare,
  onDelete,
  onToggle,
  renderDeleteDropdown,
}: DashboardMediaEditCardProps) {
  return (
    <article
      data-block-key={blockKey}
      className={`relative rounded-2xl border bg-white p-4 shadow-sm transition-[opacity,box-shadow,border-color] duration-200 ${
        isDragging ? "border-[#6a28ff] opacity-70 shadow-md" : "border-[#dde2d7]"
      }`}
      style={style}
    >
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 sm:grid-cols-[106px_minmax(0,1fr)]">
        <button
          type="button"
          data-drag-handle="true"
          {...dragHandleProps}
          className="touch-none absolute left-4 top-4 z-10 inline-flex h-7 w-7 -translate-x-1 -translate-y-1 cursor-grab items-center justify-center rounded-full border border-[#e3e7de] bg-white text-[#88917f] shadow-sm active:cursor-grabbing sm:h-8 sm:w-8"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <GripVertical className="size-4" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="col-start-1 row-span-2 h-24 w-24 overflow-hidden rounded-2xl border border-[#e5e8df] bg-[#f4f6f1] sm:h-[106px] sm:w-[106px]"
        >
          {imageUrl ? (
            <Image src={imageUrl} alt={imageAlt} width={106} height={106} unoptimized className="h-full w-full object-cover" />
          ) : null}
        </button>
        <div className="col-start-2 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#6f7868]">{label}</p>
          <button type="button" onClick={onEdit} className="w-full text-left">
            <p className="mt-1 truncate text-lg font-semibold leading-tight text-[#1f251f]">{title}</p>
          </button>
          <p className="mt-1 truncate text-xs text-[#5e6858]">{subline}</p>
          <p className="mt-2 text-sm font-semibold text-[#1f251f]">{meta}</p>
        </div>
        <div className="col-start-2 flex items-end justify-end gap-1.5 self-end">
          <Button type="button" variant="outline" size="sm" onClick={onEdit} className="h-8 px-3">
            Edit
          </Button>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d6dbd0] text-[#596451] transition hover:border-[#aeb6a5]"
            aria-label={`Share ${label.toLowerCase()}`}
          >
            <Share2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d6dbd0] text-[#596451] transition hover:border-[#aeb6a5]"
            aria-label={`Delete ${label.toLowerCase()}`}
          >
            <Trash2 className="size-3.5" />
          </button>
          <DashboardToggleSwitch size="sm" checked={toggleChecked} onToggle={onToggle} />
        </div>
      </div>
      {toggleLocked ? <p className="mt-2 text-xs text-[#6f7868]">Unsaved draft stays hidden until saved.</p> : null}
      {renderDeleteDropdown}
    </article>
  )
}
