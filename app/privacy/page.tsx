export default function Page() {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-12 text-neutral-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">artistb.io legal</p>
          <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-neutral-600">Last updated: February 14, 2026</p>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-sm leading-relaxed text-neutral-700">
            artistb.io collects account details, profile content, and usage information needed to provide your public
            artist page and dashboard experience. We only use this data to operate, secure, and improve the platform.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">
            We do not sell personal data. We may process data through trusted infrastructure providers that help us run
            authentication, storage, and analytics services. You can request account deletion by contacting support.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-700">
            This page is a concise policy summary and should be replaced with your final legal text before public launch.
          </p>
        </section>
      </div>
    </main>
  )
}
