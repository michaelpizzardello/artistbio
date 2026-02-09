import Image from "next/image"
import Link from "next/link"
import Container from "@/components/layout/Container"
import type { ArtistExhibition } from "@/lib/artist-profile"

type Props = {
  exhibitions: ArtistExhibition[]
}

type PickHeroLabel = "CURRENT EXHIBITION" | "UPCOMING EXHIBITION" | "PAST EXHIBITION"

function heroLabels(status: PickHeroLabel): { top: string; button: string } {
  if (status === "CURRENT EXHIBITION") return { top: status, button: "View Exhibition" }
  if (status === "UPCOMING EXHIBITION") return { top: status, button: "Learn More" }
  return { top: status, button: "View Exhibition Archive" }
}

function statusFor(exhibition: ArtistExhibition): PickHeroLabel {
  const now = Date.now()
  const start = exhibition.start?.getTime()
  const end = exhibition.end?.getTime()
  if (start !== undefined && start <= now && (end === undefined || end >= now)) return "CURRENT EXHIBITION"
  if (start !== undefined && start > now) return "UPCOMING EXHIBITION"
  return "PAST EXHIBITION"
}

function formatDates(start: Date, end?: Date): string {
  const dateFormat = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  if (!end) return dateFormat.format(start)
  return `${dateFormat.format(start)} - ${dateFormat.format(end)}`
}

function headingParts(args: { title: string; artist?: string; isGroup?: boolean }) {
  if (args.artist && !args.isGroup) {
    return {
      primary: args.artist,
      secondary: args.title,
    }
  }
  return {
    primary: args.title,
    secondary: args.artist,
  }
}

export default function ArtistExhibitions({ exhibitions }: Props) {
  if (!exhibitions.length) return null

  return (
    <section className="w-full py-12 md:py-16">
      <Container>
        <h2 className="typ-section-title mb-8 md:mb-12">Exhibitions</h2>
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-14 md:gap-y-16">
          {exhibitions.map((exhibition) => {
            const labels = heroLabels(statusFor(exhibition))
            const heading = headingParts({
              title: exhibition.title,
              artist: exhibition.artist,
              isGroup: exhibition.isGroup,
            })

            return (
              <article key={exhibition.id} className="group">
                <Link href={`/exhibitions/${exhibition.handle}`} className="block">
                  {exhibition.hero?.url ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                      <Image
                        src={exhibition.hero.url}
                        alt={exhibition.hero.alt || exhibition.title}
                        fill
                        unoptimized
                        sizes="(min-width:768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-neutral-100" />
                  )}

                  <div className="mt-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">{labels.top}</p>
                    <h3 className="mt-2 text-base font-medium leading-snug">
                      <span className="block">{heading.primary}</span>
                      {heading.secondary ? <span className="block text-neutral-500">{heading.secondary}</span> : null}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-600">
                      {exhibition.start ? formatDates(exhibition.start, exhibition.end) : exhibition.summary || ""}
                    </p>
                    {exhibition.location ? <p className="text-sm text-neutral-500">{exhibition.location}</p> : null}
                    <p className="mt-4 inline-flex items-center text-sm">
                      <span className="mr-2">→</span>
                      <span className="underline-offset-4 hover:underline">{labels.button}</span>
                    </p>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
