import Image from "next/image"
import Container from "@/components/layout/Container"

export type ArtistHeroProps = {
  name: string
  about?: string | null
  cover?: {
    url: string
    width?: number
    height?: number
    alt?: string
  } | null
}

export default function ArtistHero({ name, about, cover }: ArtistHeroProps) {
  const displayName = name.trim()
  const trimmedAbout = about?.trim()

  return (
    <section className="relative bg-gradient-to-b from-[var(--colors-grey-default,#f6f6f5)] via-[#fbfbfa] to-white">
      <Container className="flex flex-col items-center gap-y-10 pb-16 pt-6 text-center sm:pt-8">
        {cover?.url ? (
          <figure className="relative flex w-full max-w-[560px] flex-col items-center">
            <div className="relative mx-auto w-full overflow-hidden border border-[var(--colors-grey-dark,#e0e0e0)] bg-white">
              <div className="relative aspect-square w-full">
                <Image
                  src={cover.url}
                  alt={cover.alt || `${displayName} artwork`}
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, (max-width: 1440px) 42vw, 38vw"
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
            {cover.alt ? (
              <figcaption className="mt-4 text-center text-sm uppercase tracking-[0.28em] text-neutral-500">
                {cover.alt}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="flex w-full flex-col items-center">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-light tracking-tight text-neutral-900 sm:text-5xl md:text-6xl">
              {displayName}
            </h1>
            {trimmedAbout ? (
              <div className="mt-4 text-base text-neutral-600 sm:text-lg">
                <p className="whitespace-pre-line">{trimmedAbout}</p>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  )
}
