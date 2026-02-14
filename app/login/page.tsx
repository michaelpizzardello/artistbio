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
    <main className="flex min-h-screen flex-col items-center bg-neutral-50 px-6 py-10 text-neutral-900">
      <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black tracking-tight">Log in</h1>
        <p className="mt-2 text-neutral-600">Access your artist profile dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-sm font-medium text-neutral-700">
              Email
            </label>
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              className="h-11 rounded-xl bg-neutral-50"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-sm font-medium text-neutral-700">
              Password
            </label>
            <Input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              className="h-11 rounded-xl bg-neutral-50"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? <p className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <Button type="submit" disabled={status === "submitting"} className="h-11 rounded-xl bg-neutral-900 text-base text-white hover:bg-neutral-800">
            {status === "submitting" ? "Logging in..." : "Log in"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-neutral-600">
          Need an account?{" "}
          <Link href="/signup" className="font-medium underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  )
}
