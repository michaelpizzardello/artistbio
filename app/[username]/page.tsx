import ArtistHero from "@/components/artists/ArtistHero"
import ArtistBioSection from "@/components/artists/ArtistBioSection"
import ArtistArtworks from "@/components/artists/ArtistArtworks"
import ArtistExhibitions from "@/components/artists/ArtistExhibitions"
import MobileProfileMenu from "@/components/artists/MobileProfileMenu"
import { loadArtistPageData, type ArtistProfile } from "@/lib/artist-profile"

type PageProps = {
  params: Promise<{ username: string }>
}

function placeholderArtist(username: string): ArtistProfile {
  const fallbackName = username
    .split(/[._-]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

  return {
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
  }
}

export default async function Page({ params }: PageProps) {
  const { username } = await params
  const loaded = await loadArtistPageData(username)
  const placeholder = placeholderArtist(username)

  const artist = loaded.artist ?? placeholder
  const artworks = loaded.artworks
  const exhibitions = loaded.exhibitions

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
