"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Share } from "lucide-react"

type PreviewHeaderProps = {
  label: string
}

export default function PreviewHeader({ label }: PreviewHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push("/app")
  }

  const handleShare = async () => {
    const shareUrl = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: label, url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      // no-op
    }
  }

  return (
    <div className="bg-[#ececec] px-4 py-3">
      <div className="flex w-full items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="inline-flex size-8 items-center justify-center rounded-full text-[#262b2f]"
        >
          <ChevronLeft className="size-6" />
        </button>
        <p className="min-w-0 flex-1 truncate px-1 text-[16px] font-semibold text-[#262b2f]">{label}</p>
        <button
          type="button"
          onClick={() => {
            void handleShare()
          }}
          aria-label="Share preview"
          className="inline-flex size-8 items-center justify-center rounded-full text-[#262b2f]"
        >
          <Share className="size-5" />
        </button>
      </div>
    </div>
  )
}
