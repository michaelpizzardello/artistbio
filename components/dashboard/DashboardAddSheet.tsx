"use client"

import { useEffect, useRef } from "react"
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
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusFirstControl = () => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])"
      )
      firstFocusable?.focus()
    }

    focusFirstControl()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab") return

      const container = dialogRef.current
      if (!container) return

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true")

      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open, onClose])

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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Add new content"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] border-t border-border bg-card p-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <h2 className="text-base font-semibold text-foreground">Add</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose what you want to create.</p>

        <div className="mt-4 rounded-xl border border-border bg-background px-3 py-2.5">
          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground" htmlFor="add-sheet-url">
            Optional URL prefill
          </label>
          <div className="flex items-center gap-2 text-foreground">
            <Search className="size-[18px] text-muted-foreground" />
            <input
              id="add-sheet-url"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Paste URL for link or news"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {options.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.label}
                type="button"
                onClick={option.action}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left transition hover:border-foreground/25"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
