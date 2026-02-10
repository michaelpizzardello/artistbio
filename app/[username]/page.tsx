import ArtistHero from "@/components/artists/ArtistHero"
import ArtistBioSection from "@/components/artists/ArtistBioSection"
import ArtistArtworks from "@/components/artists/ArtistArtworks"
import ArtistExhibitions from "@/components/artists/ArtistExhibitions"
import MobileProfileMenu from "@/components/artists/MobileProfileMenu"
import { loadArtistPageData, type ArtistExhibition, type ArtistProfile, type ArtistArtwork } from "@/lib/artist-profile"

type PageProps = {
  params: Promise<{ username: string }>
}

function placeholderData(username: string): {
  artist: ArtistProfile
  artworks: ArtistArtwork[]
  exhibitions: ArtistExhibition[]
} {
  const fallbackName = username
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

  return {
    artist: {
      username,
      handle: username,
      name: fallbackName || "Artist Name",
      about: "Contemporary painter exploring memory and light.",
      bioHtml:
        "<p>This is temporary placeholder content so you can preview the artist page before connecting Supabase data.</p><p>Replace this with the artist biography once your profile table is fully linked.</p>",
      cover: {
        url: "https://picsum.photos/id/1015/1200/1500",
        alt: "Placeholder hero image",
      },
    },
    artworks: [
      {
        id: "placeholder-artwork-1",
        handle: "placeholder-artwork-1",
        title: "Untitled Study I",
        year: "2024",
        medium: "Oil on canvas",
        availableForSale: true,
        priceLabel: "$2,600",
        image: {
          url: "https://picsum.photos/id/1025/1200/1500",
          width: 1200,
          height: 1500,
          alt: "Placeholder artwork 1",
        },
      },
      {
        id: "placeholder-artwork-2",
        handle: "placeholder-artwork-2",
        title: "Night Interior",
        year: "2023",
        medium: "Acrylic on linen",
        availableForSale: false,
        priceLabel: "Sold",
        image: {
          url: "https://picsum.photos/id/1035/1200/1500",
          width: 1200,
          height: 1500,
          alt: "Placeholder artwork 2",
        },
      },
    ],
    exhibitions: [
      {
        id: "placeholder-exhibition-1",
        handle: "placeholder-exhibition-1",
        title: "Transient Light",
        artist: fallbackName || "Artist Name",
        location: "London",
        summary: "A temporary exhibition preview card.",
        start: new Date("2026-01-10"),
        end: new Date("2026-03-02"),
        hero: {
          url: "https://picsum.photos/id/1043/1400/1050",
          alt: "Placeholder exhibition image",
        },
      },
    ],
  }
}

export default async function Page({ params }: PageProps) {
  const { username } = await params
  const loaded = await loadArtistPageData(username)
  const placeholder = placeholderData(username)
  const hasLiveData = Boolean(loaded.artist) || loaded.artworks.length > 0 || loaded.exhibitions.length > 0

  const artist = loaded.artist ?? placeholder.artist
  const artworks = hasLiveData && loaded.artworks.length ? loaded.artworks : placeholder.artworks
  const exhibitions = hasLiveData && loaded.exhibitions.length ? loaded.exhibitions : placeholder.exhibitions

  return (
    <main className="bg-white text-neutral-900">
      <div id="home">
        <ArtistHero name={artist.name} about={artist.about} cover={artist.cover} />
      </div>
      <MobileProfileMenu />
      <div id="bio">
        <ArtistBioSection html={artist.bioHtml} />
      </div>
      <div id="works">
        <ArtistArtworks artworks={artworks} />
      </div>
      <div id="exhibitions">
        <ArtistExhibitions exhibitions={exhibitions} />
      </div>
      <section id="contact" className="px-6 py-10 text-center md:hidden">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">Contact</p>
        <p className="mt-2 text-sm text-neutral-700">Enquiries for {artist.name}</p>
      </section>
    </main>
  )
}
