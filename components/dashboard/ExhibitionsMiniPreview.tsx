import Image from "next/image"
import type { ExhibitionForm } from "@/lib/dashboard/types"

type ExhibitionsMiniPreviewProps = {
  exhibitions: ExhibitionForm[]
}

export default function ExhibitionsMiniPreview({ exhibitions }: ExhibitionsMiniPreviewProps) {
  return (
    <section className="h-full w-full bg-white px-5 py-6">
      <h3 className="mb-5 text-xl font-semibold tracking-tight text-neutral-900">Exhibitions</h3>
      <div className="space-y-5">
        {exhibitions.slice(0, 2).map((exhibition) => (
          <article key={exhibition.id} className="grid grid-cols-[118px_minmax(0,1fr)] gap-4">
            <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
              {exhibition.imageUrl ? (
                <Image
                  src={exhibition.imageUrl}
                  alt={exhibition.imageAlt || exhibition.title || "Exhibition preview"}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Exhibition</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-neutral-900">{exhibition.title || "Untitled exhibition"}</p>
              <p className="mt-1 text-xs text-neutral-600">{exhibition.location || "No location set"}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {exhibition.startDate || exhibition.endDate
                  ? `${exhibition.startDate || ""}${exhibition.endDate ? ` - ${exhibition.endDate}` : ""}`
                  : ""}
              </p>
            </div>
          </article>
        ))}
        {exhibitions.length === 1 ? (
          <div className="rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-600">Add more exhibitions</div>
        ) : null}
      </div>
    </section>
  )
}
