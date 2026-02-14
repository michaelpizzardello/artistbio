"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Mail, Newspaper, Settings, X } from "lucide-react"

type DashboardMoreSheetProps = {
  open: boolean
  onClose: () => void
}

export default function DashboardMoreSheet({ open, onClose }: DashboardMoreSheetProps) {
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

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="More dashboard sections"
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] bg-[#f3f4ef] p-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#1f251f]">More</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d5d8cf] bg-white text-[#1f251f]"
            aria-label="Close more menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-2">
          <Link
            href="/app/news-links"
            onClick={onClose}
            className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d7dacf] bg-white px-4 py-3 text-[#1f251f]"
          >
            <Newspaper className="size-5 text-[#4d5749]" />
            <span className="text-sm font-semibold">News &amp; Links</span>
          </Link>
          <Link
            href="/app/enquiries"
            onClick={onClose}
            className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d7dacf] bg-white px-4 py-3 text-[#1f251f]"
          >
            <Mail className="size-5 text-[#4d5749]" />
            <span className="text-sm font-semibold">Enquiries</span>
          </Link>
          <Link
            href="/app/settings"
            onClick={onClose}
            className="flex min-h-12 items-center gap-3 rounded-xl border border-[#d7dacf] bg-white px-4 py-3 text-[#1f251f]"
          >
            <Settings className="size-5 text-[#4d5749]" />
            <span className="text-sm font-semibold">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
