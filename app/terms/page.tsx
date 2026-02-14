export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">artistb.io legal</p>
          <h1 className="text-4xl font-black tracking-tight">Terms of Service</h1>
          <p className="text-sm text-neutral-600">Last updated: February 14, 2026</p>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-sm leading-relaxed text-neutral-700">
            By using artistb.io, you agree to use the service lawfully and to publish only content you are authorized
            to share. You are responsible for profile accuracy, rights clearance, and communications sent through your
            public page.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">
            We may suspend accounts that violate platform terms, abuse service infrastructure, or attempt to compromise
            user security. Service features may change as the product evolves.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">
            This page is a concise terms summary and should be replaced with your final legal agreement before public
            launch.
          </p>
        </section>
      </div>
    </main>
  )
}
