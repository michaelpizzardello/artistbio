import Link from "next/link"

export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-900">
      <div className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black tracking-tight">Authentication complete</h1>
        <p className="mt-3 text-neutral-600">
          If you just confirmed your email or used social sign in, your account is now ready.
        </p>
        <p className="mt-6">
          <Link href="/app" className="font-semibold text-neutral-900 underline">
            Continue to artist app
          </Link>
        </p>
      </div>
    </main>
  )
}
