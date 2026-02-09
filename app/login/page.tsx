'use client'

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting">("idle")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      return
    }

    setStatus("submitting")
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setStatus("idle")
      setError(signInError.message)
      return
    }

    router.push("/app")
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-lime-100 px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white/90 p-6 shadow-lg">
        <h1 className="text-3xl font-bold text-green-950">Log in</h1>
        <p className="mt-2 text-green-950/80">
          Access your artist profile dashboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {error ? <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-full bg-green-900 text-lg text-white"
          >
            {status === "submitting" ? "Logging in..." : "Log in"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-green-950/80">
          Need an account?{" "}
          <Link href="/signup" className="font-medium underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
