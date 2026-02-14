import { Loader2 } from "lucide-react"

type LoadingScreenProps = {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-neutral-50 px-6 py-12 text-neutral-900">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-5 animate-spin text-neutral-500" aria-hidden="true" />
        <p className="text-sm text-neutral-600">{message}</p>
      </div>
    </main>
  )
}
