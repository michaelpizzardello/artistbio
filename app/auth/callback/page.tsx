import Link from "next/link"

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f3f4ef] px-6 py-12 text-[#182116]">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-black">Authentication complete</h1>
        <p className="mt-3 text-[#4f584b]">
          If you just confirmed your email or used social sign in, your account is now ready.
        </p>
        <p className="mt-6">
          <Link href="/app" className="font-semibold text-[#2d4530] underline">
            Continue to artist app
          </Link>
        </p>
      </div>
    </main>
  )
}
