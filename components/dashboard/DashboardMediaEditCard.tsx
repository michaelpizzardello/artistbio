import Image from "next/image"
import type { CSSProperties } from "react"
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd"
import { ChevronDown, ChevronUp, ChevronsUp, GripVertical, MoreHorizontal, Share2, Trash2 } from "lucide-react"
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
  showLabel?: boolean
  toggleChecked: boolean
  toggleLocked?: boolean
  toggleAriaLabel: string
  onEdit: () => void
  onShare: () => void
  onDelete: () => void
  onToggle: () => void
  onMoveToTop: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  moveToTopDisabled: boolean
  moveUpDisabled: boolean
  moveDownDisabled: boolean
  helperText?: string
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
  showLabel = true,
  toggleChecked,
  toggleLocked = false,
  toggleAriaLabel,
  onEdit,
  onShare,
  onDelete,
  onToggle,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  moveToTopDisabled,
  moveUpDisabled,
  moveDownDisabled,
  helperText,
  renderDeleteDropdown,
}: DashboardMediaEditCardProps) {
  return (
    <article
      data-block-key={blockKey}
      className={`relative rounded-2xl border bg-white p-3 shadow-sm transition-[opacity,box-shadow,border-color] duration-200 ${
        isDragging ? "border-[#48603f] opacity-70 shadow-md" : "border-[#dde2d7]"
      }`}
      style={style}
    >
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 sm:grid-cols-[106px_minmax(0,1fr)]">
        <button
          type="button"
          data-drag-handle="true"
          {...dragHandleProps}
          className="touch-none absolute left-4 top-4 z-10 inline-flex h-11 w-11 -translate-x-1 -translate-y-1 cursor-grab items-center justify-center rounded-full border border-[#e3e7de] bg-white text-[#88917f] shadow-sm active:cursor-grabbing"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          aria-label={`Reorder ${label.toLowerCase()} by drag`}
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
          {showLabel ? <p className="text-[11px] uppercase tracking-[0.1em] text-[#6f7868]">{label}</p> : null}
          <button type="button" onClick={onEdit} className="w-full text-left">
            <p className="mt-1 truncate text-lg font-semibold leading-tight text-[#1f251f]">{title}</p>
          </button>
          <p className="mt-1 truncate text-xs text-[#5e6858]">{subline}</p>
          <p className="mt-2 text-sm font-semibold text-[#1f251f]">{meta}</p>
        </div>
        <div className="col-start-2 flex items-end justify-end gap-1.5 self-end">
          <Button type="button" variant="outline" size="sm" onClick={onEdit} className="h-11 px-3">
            Edit
          </Button>
          <DashboardToggleSwitch
            size="sm"
            checked={toggleChecked}
            onToggle={onToggle}
            ariaLabel={toggleAriaLabel}
            disabled={toggleLocked}
          />
          <details className="relative">
            <summary
              className="inline-flex h-11 w-11 list-none items-center justify-center rounded-md border border-[#d6dbd0] text-[#596451] transition hover:border-[#aeb6a5] [&::-webkit-details-marker]:hidden"
              aria-label="More actions"
            >
              <MoreHorizontal className="size-4" />
            </summary>
            <div className="absolute right-0 top-12 z-30 w-44 rounded-xl border border-[#d9ddd3] bg-white p-1 shadow-lg">
              <button type="button" onClick={onShare} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1]">
                <Share2 className="size-4" />
                Share
              </button>
              <button
                type="button"
                onClick={onMoveToTop}
                disabled={moveToTopDisabled}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
              >
                <ChevronsUp className="size-4" />
                Move to top
              </button>
              <button
                type="button"
                onClick={onMoveUp}
                disabled={moveUpDisabled}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
              >
                <ChevronUp className="size-4" />
                Move up
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={moveDownDisabled}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
              >
                <ChevronDown className="size-4" />
                Move down
              </button>
              <button type="button" onClick={onDelete} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1]">
                <Trash2 className="size-4" />
                Delete or archive
              </button>
            </div>
          </details>
        </div>
      </div>
      {toggleLocked ? <p className="mt-2 text-xs text-[#6f7868]">Unsaved draft stays hidden until saved.</p> : null}
      {helperText ? <p className="mt-2 text-xs text-[#4f5b49]">{helperText}</p> : null}
      {renderDeleteDropdown}
    </article>
  )
}
