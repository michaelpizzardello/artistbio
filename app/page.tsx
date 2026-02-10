import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-lime-300">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-xl font-semibold">artistb.io</div>

        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" className="rounded-full bg-white/70">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="rounded-full bg-black text-white hover:bg-black/90">
            <Link href="/signup">Sign up free</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="max-w-xl">
          <h1 className="text-5xl font-extrabold leading-tight text-green-950">
            A link in bio for artists.
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-green-950/80">
            A clean artist page with bio, artworks, exhibitions, news, and CV.
          </p>

          <div className="mt-8 flex flex-col gap-4">
            <Input
              className="h-14 rounded-2xl bg-white px-5 text-lg"
              placeholder="artistb.io/yourname"
            />
            <Button asChild className="h-14 rounded-2xl bg-green-900 text-lg hover:bg-green-900/90">
              <Link href="/signup">Get started for free</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
