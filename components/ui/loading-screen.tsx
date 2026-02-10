import { Loader2 } from "lucide-react"

type LoadingScreenProps = {
  message?: string
}

export default function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#f3f4ef] px-6 py-12 text-[#182116]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="size-5 animate-spin text-[#52604f]" aria-hidden="true" />
        <p className="text-sm text-[#52604f]">{message}</p>
      </div>
    </main>
  )
}
