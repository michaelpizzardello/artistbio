"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, SquarePen, TextCursorInput, UserRound } from "lucide-react"

const sections = [
  {
    href: "/edit-profile/identity",
    title: "Identity",
    icon: UserRound,
  },
  {
    href: "/edit-profile/about",
    title: "About",
    icon: TextCursorInput,
  },
  {
    href: "/edit-profile/cv",
    title: "CV",
    icon: SquarePen,
  },
  {
    href: "/edit-profile/links",
    title: "Links & Contact",
    icon: SquarePen,
  },
]

export default function EditProfileOverview() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/app/profile")}
            aria-label="Go back"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h1 className="text-xl font-semibold">Edit profile</h1>
        </header>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          {sections.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 items-center justify-between gap-3 px-4 py-3 ${index !== 0 ? "border-t border-border" : ""}`}
            >
              <span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-foreground">
                <item.icon className="size-4 shrink-0 text-muted-foreground" />
                <span>{item.title}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </section>
      </div>
    </main>
  )
}
