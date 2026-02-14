import Image from "next/image"
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
          <div className="relative size-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
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
          <p className="truncate text-sm font-semibold text-foreground">@{username.trim() || "username"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" onClick={onShareProfile} variant="ghost" className="size-10 p-0 text-foreground hover:bg-transparent">
            <Share2 className="size-5 stroke-[1.9]" />
          </Button>
          <Button type="button" variant="ghost" className="size-10 p-0 text-foreground hover:bg-transparent" aria-label="Notifications">
            <Bell className="size-5 stroke-[1.9]" />
          </Button>
        </div>
      </div>
      <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground">{name.trim() || username.trim() || "Artist Name"}</h1>
      <p className="mt-1.5 text-sm leading-none text-foreground/90">{profileUrlLabel}</p>
    </>
  )
}
