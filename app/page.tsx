'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useMemo, useState } from "react"

export default function Page() {
  const [usernameInput, setUsernameInput] = useState("")

  const signupHref = useMemo(() => {
    const value = usernameInput.trim().toLowerCase()
    if (!value) return "/signup"

    const cleaned = value.replace(/^https?:\/\/(www\.)?/i, "").replace(/^artistb\.io\//i, "").replace(/^@/, "")
    const username = cleaned.split("/")[0]
    if (!username) return "/signup"

    return `/signup?username=${encodeURIComponent(username)}`
  }, [usernameInput])

  return (
    <main className="min-h-screen w-full bg-neutral-50 text-neutral-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <p className="text-xl font-black tracking-tight">artistb.io</p>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" className="rounded-full border border-border bg-background">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-full bg-neutral-900 text-white hover:bg-neutral-800">
            <Link href="/signup">Sign up free</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-12 pt-6">
        <div className="max-w-2xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">Built for independent artists</p>
          <h1 className="mt-4 text-balance text-4xl font-black leading-[0.95] tracking-tight text-neutral-900 sm:text-5xl">
            Publish a profile that feels gallery-ready.
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600">
            Manage your bio, artworks, exhibitions, and announcements in one calm dashboard, then share one clean link.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <label htmlFor="landing-username" className="text-sm font-medium text-neutral-700">
              Start with your URL
            </label>
            <Input
              id="landing-username"
              className="h-12 rounded-2xl bg-neutral-50 px-5 text-base"
              placeholder="artistb.io/yourname"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
            />
            <Button asChild className="h-12 rounded-2xl bg-neutral-900 text-base text-white hover:bg-neutral-800">
              <Link href={signupHref}>Claim your profile</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
