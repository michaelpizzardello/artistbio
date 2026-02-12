import Image from "next/image"
import type { ArtworkForm } from "@/lib/dashboard/types"

type ArtworksMiniPreviewProps = {
  artworks: ArtworkForm[]
}

export default function ArtworksMiniPreview({ artworks }: ArtworksMiniPreviewProps) {
  return (
    <section className="h-full w-full bg-white px-5 py-6">
      <h3 className="mb-5 text-[24px] font-semibold tracking-[-0.02em] text-neutral-900">Artworks</h3>
      <div className="grid grid-cols-2 gap-5">
        {artworks.slice(0, 2).map((artwork) => (
          <article key={artwork.id}>
            <div className="relative overflow-hidden bg-[#f3f4ef]" style={{ aspectRatio: "4/5" }}>
              {artwork.imageUrl ? (
                <Image
                  src={artwork.imageUrl}
                  alt={artwork.imageAlt || artwork.title || "Artwork preview"}
                  fill
                  sizes="220px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="mt-3">
              <p className="truncate text-[11px] uppercase tracking-[0.14em] text-neutral-500">{artwork.medium || "Artwork"}</p>
              <p className="mt-1 truncate text-[14px] font-medium text-neutral-900">
                <span className="italic">{artwork.title || "Untitled"}</span>
                {artwork.year ? <span>, {artwork.year}</span> : null}
              </p>
              <p className="mt-1 truncate text-[12px] text-neutral-600">{artwork.priceLabel || "Price on request"}</p>
            </div>
          </article>
        ))}
        {artworks.length === 1 ? (
          <div className="flex items-center justify-center bg-[#f6f7f3]" style={{ aspectRatio: "4/5" }}>
            <p className="text-[12px] text-[#5d6758]">Add more artworks</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
