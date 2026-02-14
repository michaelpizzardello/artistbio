import Link from "next/link"
import { CalendarRange, Ellipsis, House, Image as ImageIcon, UserRound } from "lucide-react"

type DashboardBottomNavProps = {
  activeTab: "home" | "artworks" | "exhibitions" | "profile" | null
  onMoreClick: () => void
}

function navButtonClass(active: boolean): string {
  return `inline-flex h-full flex-col items-center justify-center gap-1 rounded-xl px-1 transition ${
    active ? "text-[#1f251f]" : "text-[#5a6257] hover:bg-[#f3f4ef]"
  }`
}

function navLabelClass(active: boolean): string {
  return `text-[10px] font-semibold leading-none ${active ? "text-[#1f251f]" : "text-[#5a6257]"}`
}

export default function DashboardBottomNav({ activeTab, onMoreClick }: DashboardBottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d5d7d1] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <nav aria-label="Dashboard navigation" className="mx-auto grid h-16 w-full max-w-md grid-cols-5 gap-1 px-2 pb-safe">
        <Link href="/app" aria-current={activeTab === "home" ? "page" : undefined} className={navButtonClass(activeTab === "home")}>
          <House className="size-5" />
          <span className={navLabelClass(activeTab === "home")}>Home</span>
        </Link>
        <Link
          href="/app/artworks"
          aria-current={activeTab === "artworks" ? "page" : undefined}
          className={navButtonClass(activeTab === "artworks")}
        >
          <ImageIcon className="size-5" />
          <span className={navLabelClass(activeTab === "artworks")}>Artworks</span>
        </Link>
        <Link
          href="/app/exhibitions"
          aria-current={activeTab === "exhibitions" ? "page" : undefined}
          className={navButtonClass(activeTab === "exhibitions")}
        >
          <CalendarRange className="size-5" />
          <span className={navLabelClass(activeTab === "exhibitions")}>Exhibitions</span>
        </Link>
        <Link
          href="/app/profile"
          aria-current={activeTab === "profile" ? "page" : undefined}
          className={navButtonClass(activeTab === "profile")}
        >
          <UserRound className="size-5" />
          <span className={navLabelClass(activeTab === "profile")}>Profile</span>
        </Link>
        <button type="button" onClick={onMoreClick} className={navButtonClass(activeTab === null)} aria-label="Open more options">
          <Ellipsis className="size-5" />
          <span className={navLabelClass(activeTab === null)}>More</span>
        </button>
      </nav>
    </div>
  )
}
