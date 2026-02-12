import Image from "next/image"
import Link from "next/link"
import { Bell, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type DashboardProfileHeaderProps = {
  coverUrl: string
  coverAlt: string
  name: string
  username: string
  profileUrlLabel: string
  onShareProfile: () => void
}

export default function DashboardProfileHeader({
  coverUrl,
  coverAlt,
  name,
  username,
  profileUrlLabel,
  onShareProfile,
}: DashboardProfileHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative size-[37px] shrink-0 overflow-hidden rounded-full border border-[#eceee8] bg-[#eef1e9]">
            {coverUrl ? (
              <Image
                src={coverUrl}
                alt={coverAlt || `${name.trim() || username.trim() || "Artist"} profile image`}
                fill
                className="object-cover"
                sizes="37px"
              />
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-[37px] min-w-0 rounded-full border border-[#cfcfcb] bg-transparent px-3 py-1 text-[14px] leading-none font-semibold tracking-[-0.005em] text-[#242b24] shadow-none"
          >
            Try Pro for free
          </Button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" onClick={onShareProfile} variant="ghost" className="size-11 p-0 text-[#1f2622] hover:bg-transparent">
            <Share2 className="size-6 stroke-[1.9]" />
          </Button>
          <Button type="button" variant="ghost" className="size-11 p-0 text-[#1f2622] hover:bg-transparent" aria-label="Notifications">
            <Bell className="size-6 stroke-[1.9]" />
          </Button>
        </div>
      </div>
      <h1 className="mt-4 text-[30px] font-black leading-[0.95] tracking-[-0.03em] text-[#1e2522]">{name.trim() || username.trim() || "Artist Name"}</h1>
      <p className="mt-3 text-[18px] leading-none tracking-[-0.02em] text-[#2a312c]">{profileUrlLabel}</p>
      <Button asChild type="button" variant="outline" className="mt-5 h-8 rounded-full border-[#cfcfcb] px-3 text-xs font-semibold text-[#242b24]">
        <Link href="/edit-profile">Edit profile</Link>
      </Button>
    </>
  )
}
