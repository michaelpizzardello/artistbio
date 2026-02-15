import type { CSSProperties } from "react"
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd"
import { ChevronDown, ChevronUp, ChevronsUp, GripVertical, MoreHorizontal, Pencil, Share2, Trash2, X } from "lucide-react"
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
  isActionsOpen: boolean
  onActionsOpenChange: (open: boolean) => void
  helperText?: string
  renderDeleteDropdown: React.ReactNode
}

function toSupabaseThumbUrl(url: string, size: number): string {
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (!parsed.pathname.includes("/storage/v1/object/public/")) return url

    const objectPath = parsed.pathname.replace("/storage/v1/object/public/", "")
    return `${parsed.origin}/storage/v1/render/image/public/${objectPath}?width=${size}&height=${size}&resize=cover&quality=70`
  } catch {
    return url
  }
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
  isActionsOpen,
  onActionsOpenChange,
  helperText,
  renderDeleteDropdown,
}: DashboardMediaEditCardProps) {
  return (
    <article
      data-block-key={blockKey}
      className={`rounded-2xl border bg-card p-3 shadow-sm transition-[opacity,box-shadow,border-color] duration-200 ${
        isDragging ? "border-primary opacity-75 shadow-md" : "border-border"
      }`}
      style={style}
    >
      <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-2.5">
        <button
          type="button"
          data-drag-handle="true"
          {...dragHandleProps}
          className="touch-none mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground active:cursor-grabbing"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          aria-label={`Reorder ${label.toLowerCase()} by drag`}
        >
          <GripVertical className="size-3.5" />
        </button>

        <div className="min-w-0">
          {showLabel ? <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</p> : null}

          <div className="mt-0.5 flex items-start gap-2">
            <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
              <p className="truncate text-lg font-semibold leading-tight text-foreground">{title}</p>
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label={`Edit ${label.toLowerCase()}`}
            >
              <Pencil className="size-3.5" />
            </button>
          </div>

          <p className="mt-1 truncate text-sm text-muted-foreground">{subline}</p>

          <div className="mt-2.5 grid grid-cols-[64px_minmax(0,1fr)] gap-2.5">
            <button
              type="button"
              onClick={onEdit}
              className="h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted"
              aria-label={`Edit ${label.toLowerCase()} image`}
            >
              {imageUrl ? <img src={toSupabaseThumbUrl(imageUrl, 128)} alt={imageAlt} width={64} height={64} loading="lazy" decoding="async" className="h-full w-full object-cover" /> : null}
            </button>
            <div className="min-w-0 self-center">
              <p className="truncate text-base font-semibold text-foreground">{meta}</p>
              {helperText ? <p className="mt-0.5 text-xs text-muted-foreground">{helperText}</p> : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label={`Share ${label.toLowerCase()}`}
          >
            <Share2 className="size-3.5" />
          </button>
          <DashboardToggleSwitch size="xs" checked={toggleChecked} onToggle={onToggle} ariaLabel={toggleAriaLabel} disabled={toggleLocked} />
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="More actions"
            aria-expanded={isActionsOpen}
            onClick={() => onActionsOpenChange(!isActionsOpen)}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </div>
      </div>

      {toggleLocked ? <p className="mt-2 text-xs text-muted-foreground">Unsaved draft stays hidden until saved.</p> : null}

      {isActionsOpen ? (
        <>
          <button type="button" className="fixed inset-0 z-50 bg-black/20" aria-label="Close actions" onClick={() => onActionsOpenChange(false)} />
          <div className="fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-md rounded-t-2xl border border-border bg-card p-2 shadow-[0_-10px_30px_rgba(0,0,0,0.18)]">
            <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={() => onActionsOpenChange(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground"
                aria-label="Close actions"
              >
                <X className="size-4" />
              </button>
            </div>
            <button type="button" onClick={() => { onShare(); onActionsOpenChange(false) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted">
              <Share2 className="size-4" />
              Share
            </button>
            <button
              type="button"
              onClick={() => { onMoveToTop(); onActionsOpenChange(false) }}
              disabled={moveToTopDisabled}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-45"
            >
              <ChevronsUp className="size-4" />
              Move to top
            </button>
            <button
              type="button"
              onClick={() => { onMoveUp(); onActionsOpenChange(false) }}
              disabled={moveUpDisabled}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-45"
            >
              <ChevronUp className="size-4" />
              Move up
            </button>
            <button
              type="button"
              onClick={() => { onMoveDown(); onActionsOpenChange(false) }}
              disabled={moveDownDisabled}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-45"
            >
              <ChevronDown className="size-4" />
              Move down
            </button>
            <button type="button" onClick={() => { onDelete(); onActionsOpenChange(false) }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground hover:bg-muted">
              <Trash2 className="size-4" />
              Delete or archive
            </button>
          </div>
        </>
      ) : null}

      {renderDeleteDropdown}
    </article>
  )
}
