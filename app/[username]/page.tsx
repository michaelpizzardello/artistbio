import ArtistHero from "@/components/artists/ArtistHero"
import ArtistBioSection from "@/components/artists/ArtistBioSection"
import ArtistArtworks from "@/components/artists/ArtistArtworks"
import ArtistExhibitions from "@/components/artists/ArtistExhibitions"
import MobileProfileMenu from "@/components/artists/MobileProfileMenu"
import { loadArtistPageData } from "@/lib/artist-profile"

type PageProps = {
  params: Promise<{ username: string }>
}

export default async function Page({ params }: PageProps) {
  const { username } = await params
  const loaded = await loadArtistPageData(username)
  const artist = loaded.artist
  const artworks = loaded.artworks
  const exhibitions = loaded.exhibitions

  if (!artist) {
    return (
      <main className="min-h-screen bg-white px-6 py-12 text-neutral-900">
        <section className="mx-auto max-w-xl rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center">
          <p className="typ-section-title">Profile unavailable</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">This artist page is not published yet.</h1>
          <p className="mt-3 text-sm text-neutral-600">
            Check the username and try again, or come back after the artist finishes publishing their profile.
          </p>
        </section>
      </main>
    )
  }

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
