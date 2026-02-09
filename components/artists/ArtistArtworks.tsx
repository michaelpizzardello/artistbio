import Image from "next/image"
import Link from "next/link"
import Container from "@/components/layout/Container"
import type { ArtistArtwork } from "@/lib/artist-profile"

type Props = {
  artworks: ArtistArtwork[]
}

function ArtworkCard({ artwork }: { artwork: ArtistArtwork }) {
  const href = artwork.exhibitionHandle
    ? `/exhibitions/${artwork.exhibitionHandle}/artworks/${artwork.handle}`
    : null

  return (
    <article className="group">
      {href ? (
        <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          {artwork.image ? (
            <div
              className="relative bg-white"
              style={{
                aspectRatio:
                  artwork.image.width && artwork.image.height
                    ? `${artwork.image.width}/${artwork.image.height}`
                    : "4/5",
              }}
            >
              <Image
                src={artwork.image.url}
                alt={artwork.image.alt || artwork.title}
                fill
                unoptimized
                sizes="(min-width:768px) 50vw, 100vw"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="bg-neutral-100" style={{ aspectRatio: "4/5" }} />
          )}
        </Link>
      ) : artwork.image ? (
        <div
          className="relative bg-white"
          style={{
            aspectRatio:
              artwork.image.width && artwork.image.height ? `${artwork.image.width}/${artwork.image.height}` : "4/5",
          }}
        >
          <Image
            src={artwork.image.url}
            alt={artwork.image.alt || artwork.title}
            fill
            unoptimized
            sizes="(min-width:768px) 50vw, 100vw"
            className="object-contain"
          />
        </div>
      ) : (
        <div className="bg-neutral-100" style={{ aspectRatio: "4/5" }} />
      )}
      <div className="mt-4 flex flex-col gap-2">
        <div>
          {artwork.medium ? (
            <p className="typ-caption uppercase tracking-[0.18em] text-neutral-500">{artwork.medium}</p>
          ) : null}
          <p className="typ-body mt-2 font-medium">
            <span className="italic">{artwork.title}</span>
            {artwork.year ? <span>, {artwork.year}</span> : null}
          </p>
        </div>
        <div className="typ-body-small text-neutral-600">{artwork.priceLabel || "Price on request"}</div>
        <div className="pt-2">
          <button
            type="button"
            className="inline-flex items-center justify-center border border-neutral-300 px-4 py-2 text-sm uppercase tracking-[0.14em] transition hover:border-neutral-900"
          >
            Enquire
          </button>
        </div>
      </div>
    </article>
  )
}

export default function ArtistArtworks({ artworks }: Props) {
  if (!artworks.length) return null

  return (
    <section className="w-full py-12 md:py-16">
      <Container>
        <h2 className="typ-section-title mb-8 md:mb-12">Artworks</h2>
        <div className="grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-2 md:gap-x-14 md:gap-y-16">
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} />
          ))}
        </div>
      </Container>
    </section>
  )
}
