import type { ReactNode } from "react"
import Link from "next/link"

type SectionPreviewCardProps = {
  href: string
  label: string
  hasContent: boolean
  emptyMessage: string
  children: ReactNode
}

export default function SectionPreviewCard({ href, label, hasContent, emptyMessage, children }: SectionPreviewCardProps) {
  return (
    <Link href={href} className="group rounded-[1.25rem]">
      <div className="h-72 overflow-hidden rounded-[1.25rem] border border-[#d9ddd3] bg-white">
        {hasContent ? (
          <div className="pointer-events-none relative h-full w-full origin-top-left scale-[0.5] transform">
            <div style={{ transformOrigin: "left top", width: "200%", height: "200%", overflow: "hidden" }}>{children}</div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-[#5d6758]">{emptyMessage}</div>
        )}
      </div>
      <p className="px-2 pt-2 text-base font-semibold text-[#1e2522]">{label}</p>
    </Link>
  )
}
