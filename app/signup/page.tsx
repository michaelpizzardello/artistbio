'use client'

import Link from "next/link"
import { FormEvent, Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type FormState = {
  email: string
  username: string
  password: string
  confirmPassword: string
}

const initialFormState: FormState = {
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernameRegex = /^[a-z0-9._]{3,24}$/
type Step = "username" | "method" | "credentials"

function SignupPageContent() {
  const searchParams = useSearchParams()
  const usernameFromQuery = (searchParams.get("username") || "").toLowerCase().trim()
  const normalizedQueryUsername = usernameFromQuery.replace(/^@/, "")
  const hasValidQueryUsername = usernameRegex.test(normalizedQueryUsername)

  const [form, setForm] = useState<FormState>({
    ...initialFormState,
    username: hasValidQueryUsername ? normalizedQueryUsername : "",
  })
  const [step, setStep] = useState<Step>(hasValidQueryUsername ? "method" : "username")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle")

  const isEmailValid = emailRegex.test(form.email)
  const isUsernameValid = usernameRegex.test(form.username)
  const isPasswordValid = form.password.length >= 8
  const passwordsMatch = form.password === form.confirmPassword

  const canSubmit =
    isEmailValid &&
    isUsernameValid &&
    isPasswordValid &&
    passwordsMatch &&
    agreedToTerms &&
    status !== "submitting"

  const goToMethodStep = () => {
    setError("")
    if (!isUsernameValid) {
      setError("Choose a valid username (3-24 chars, lowercase letters, numbers, dots or underscores).")
      return
    }
    setStep("method")
  }

  const goToCredentialsStep = () => {
    setError("")
    setStep("credentials")
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!isEmailValid) {
      setError("Enter a valid email address.")
      return
    }

    if (!isUsernameValid) {
      setError("Username must be 3-24 chars: lowercase letters, numbers, dots, or underscores.")
      return
    }

    if (!isPasswordValid) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (!passwordsMatch) {
      setError("Passwords do not match.")
      return
    }

    if (!agreedToTerms) {
      setError("You need to accept the terms to continue.")
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
        return
      }

      setStatus("submitting")
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: form.username,
          },
        },
      })

      if (signUpError) {
        setStatus("idle")
        setError(signUpError.message)
        return
      }

      setStatus("success")
    } catch {
      setStatus("idle")
      setError("Something went wrong. Please try again.")
    }
  }

  const continueLabel = status === "submitting" ? "Creating account..." : "Continue"

  return (
    <main className="min-h-screen bg-[#f3f4ef] px-4 py-10 text-[#182116]">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-10">
          <Link href="/" className="text-4xl font-black tracking-tight">
            artistb.io
          </Link>
        </div>

        <h1 className="text-balance text-center text-4xl font-black leading-tight text-[#151a13] sm:text-5xl">
          Claim @{form.username || "yourname"} on artistb.io
        </h1>
        <p className="mt-4 text-center text-2xl text-[#5a6255]">
          {step === "username" ? "Pick your username first" : "Sign up for free"}
        </p>

        <div className="mt-4 text-center text-sm font-medium text-[#5a6255]">
          Step {step === "username" ? "1" : step === "method" ? "2" : "3"} of 3
        </div>

        {step === "username" ? (
          <div className="mt-12 space-y-4">
            <label className="sr-only" htmlFor="username">
              Username
            </label>
            <Input
              id="username"
              placeholder="Username (letters, numbers, dots or underscores)"
              autoComplete="username"
              className="h-14 rounded-2xl border-0 bg-[#e8ebe2] px-5 text-lg shadow-none"
              value={form.username}
              onChange={(event) => {
                setForm((previous) => ({ ...previous, username: event.target.value.toLowerCase() }))
                setError("")
                setStatus("idle")
              }}
              required
            />
            <Button
              type="button"
              onClick={goToMethodStep}
              className="h-14 w-full rounded-2xl bg-[#2a3b28] text-lg font-semibold text-white hover:bg-[#223120]"
            >
              Continue
            </Button>
          </div>
        ) : null}

        {step === "method" ? (
          <div className="mt-12 space-y-3">
            <Button
              type="button"
              onClick={goToCredentialsStep}
              className="h-14 w-full rounded-2xl bg-[#2a3b28] text-lg font-semibold text-white hover:bg-[#223120]"
            >
              Continue with email
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("username")}
              className="w-full text-base text-[#52604f] hover:bg-transparent hover:text-[#1f2c1d]"
            >
              Back
            </Button>
          </div>
        ) : null}

        {step === "credentials" ? (
          <form onSubmit={handleSubmit} className="mt-12 space-y-4">
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Email"
              autoComplete="email"
              className="h-14 rounded-2xl border-0 bg-[#e8ebe2] px-5 text-lg shadow-none"
              value={form.email}
              onChange={(event) => {
                setForm((previous) => ({ ...previous, email: event.target.value }))
                setError("")
                setStatus("idle")
              }}
              required
            />

            <label className="sr-only" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Password (8+ characters)"
              autoComplete="new-password"
              className="h-14 rounded-2xl border-0 bg-[#e8ebe2] px-5 text-lg shadow-none"
              value={form.password}
              onChange={(event) => {
                setForm((previous) => ({ ...previous, password: event.target.value }))
                setError("")
                setStatus("idle")
              }}
              required
            />

            <label className="sr-only" htmlFor="confirm-password">
              Confirm password
            </label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm password"
              autoComplete="new-password"
              className="h-14 rounded-2xl border-0 bg-[#e8ebe2] px-5 text-lg shadow-none"
              value={form.confirmPassword}
              onChange={(event) => {
                setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))
                setError("")
                setStatus("idle")
              }}
              required
            />

            <div className="mt-2 rounded-xl border border-[#d4d8cf] bg-[#f8f9f6] p-4 text-sm leading-relaxed text-[#535d50]">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(event) => setAgreedToTerms(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#a4ab9f]"
                />
                <span>
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="font-medium text-[#283d26] underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-[#283d26] underline">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-14 w-full rounded-2xl bg-[#2a3b28] text-lg font-semibold text-white hover:bg-[#223120] disabled:bg-[#c8cec4] disabled:text-[#8c9587]"
            >
              {continueLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep("method")}
              className="w-full text-base text-[#52604f] hover:bg-transparent hover:text-[#1f2c1d]"
            >
              Back
            </Button>
          </form>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        ) : null}

        {status === "success" ? (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Check your email to confirm your account and finish signup.
          </p>
        ) : null}

        <p className="mt-8 text-center text-lg text-[#5c6558]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#2d4530] underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}

function SignupPageFallback() {
  return (
    <main className="min-h-screen bg-[#f3f4ef] px-4 py-10 text-[#182116]">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-10">
          <Link href="/" className="text-4xl font-black tracking-tight">
            artistb.io
          </Link>
        </div>
        <p className="text-center text-lg text-[#5a6255]">Loading signup…</p>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageContent />
    </Suspense>
  )
}
