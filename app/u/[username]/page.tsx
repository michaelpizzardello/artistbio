import ArtistPage from "@/app/[username]/page"
import PreviewHeader from "@/components/dashboard/PreviewHeader"

type PageProps = {
  params: Promise<{ username: string }>
}

export default async function PreviewPage({ params }: PageProps) {
  const { username } = await params
  return (
    <div className="min-h-screen bg-[#ececec]">
      <PreviewHeader label={`artistb.io/${username}`} />
      <div className="overflow-hidden rounded-t-[2rem] bg-white">
        <ArtistPage params={Promise.resolve({ username })} />
      </div>
    </div>
  )
}
