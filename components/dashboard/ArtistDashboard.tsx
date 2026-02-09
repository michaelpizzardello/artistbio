'use client'

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Binoculars, Plus } from "lucide-react"
import ArtistHero from "@/components/artists/ArtistHero"
import ArtistBioSection from "@/components/artists/ArtistBioSection"
import ArtistArtworks from "@/components/artists/ArtistArtworks"
import ArtistExhibitions from "@/components/artists/ArtistExhibitions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ArtistArtwork, ArtistExhibition } from "@/lib/artist-profile"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type ProfileForm = {
  username: string
  name: string
  nationality: string
  birthYear: string
  bioHtml: string
  coverUrl: string
  coverAlt: string
}

type ArtworkForm = {
  id: string
  title: string
  year: string
  medium: string
  imageUrl: string
  imageAlt: string
  availableForSale: boolean
  priceLabel: string
}

type ExhibitionForm = {
  id: string
  title: string
  artist: string
  location: string
  summary: string
  startDate: string
  endDate: string
  imageUrl: string
  imageAlt: string
}

const PROFILE_TABLE = "artist_profiles"
const ARTWORK_TABLE = "artworks"
const EXHIBITION_TABLE = "exhibitions"
const MEDIA_BUCKET = "artist-media"

const emptyProfile: ProfileForm = {
  username: "",
  name: "",
  nationality: "",
  birthYear: "",
  bioHtml: "",
  coverUrl: "",
  coverAlt: "",
}

function tempId(prefix: string) {
  return `${prefix}-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function str(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function bool(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase()
    return lowered === "true" || lowered === "1"
  }
  if (typeof value === "number") return value === 1
  return false
}

function toDateString(value: unknown): string {
  if (!value) return ""
  const raw = String(value)
  const date = new Date(raw)
  if (Number.isNaN(date.valueOf())) return ""
  return date.toISOString().slice(0, 10)
}

function mapProfileRow(row: Record<string, unknown>): ProfileForm {
  return {
    username: str(row.username),
    name: str(row.name || row.display_name),
    nationality: str(row.nationality),
    birthYear: str(row.birth_year),
    bioHtml: str(row.bio_html || row.bio),
    coverUrl: str(row.cover_image || row.cover_url || row.image_url),
    coverAlt: str(row.cover_alt),
  }
}

function mapArtworkRow(row: Record<string, unknown>): ArtworkForm {
  return {
    id: str(row.id) || tempId("artwork"),
    title: str(row.title || row.name),
    year: str(row.year),
    medium: str(row.medium),
    imageUrl: str(row.image_url || row.cover_image),
    imageAlt: str(row.image_alt),
    availableForSale: bool(row.available_for_sale),
    priceLabel: str(row.price_label || row.price),
  }
}

function mapExhibitionRow(row: Record<string, unknown>): ExhibitionForm {
  return {
    id: str(row.id) || tempId("exhibition"),
    title: str(row.title || row.name),
    artist: str(row.artist || row.artist_name),
    location: str(row.location),
    summary: str(row.summary || row.description),
    startDate: toDateString(row.start_date || row.start),
    endDate: toDateString(row.end_date || row.end),
    imageUrl: str(row.hero_image || row.image_url),
    imageAlt: str(row.hero_alt || row.image_alt),
  }
}

export default function ArtistDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile)
  const [artworks, setArtworks] = useState<ArtworkForm[]>([])
  const [exhibitions, setExhibitions] = useState<ExhibitionForm[]>([])

  const loadDashboard = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setLoading(false)
      setError("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
      return
    }

    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !authUser) {
      setLoading(false)
      setUser(null)
      return
    }

    setUser(authUser)

    const [{ data: profileRow }, { data: artworkRows }, { data: exhibitionRows }] = await Promise.all([
      supabase.from(PROFILE_TABLE).select("*").eq("user_id", authUser.id).limit(1).maybeSingle(),
      supabase.from(ARTWORK_TABLE).select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
      supabase
        .from(EXHIBITION_TABLE)
        .select("*")
        .eq("user_id", authUser.id)
        .order("start_date", { ascending: false }),
    ])

    if (profileRow) {
      setProfile(mapProfileRow(profileRow as Record<string, unknown>))
    } else {
      setProfile((previous) => ({
        ...previous,
        username: previous.username || authUser.user_metadata?.username || "",
      }))
    }

    if (Array.isArray(artworkRows)) {
      setArtworks(artworkRows.map((row) => mapArtworkRow(row as Record<string, unknown>)))
    }

    if (Array.isArray(exhibitionRows)) {
      setExhibitions(exhibitionRows.map((row) => mapExhibitionRow(row as Record<string, unknown>)))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadDashboard()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadDashboard])

  const previewArtworks = useMemo<ArtistArtwork[]>(
    () =>
      artworks
        .filter((item) => item.title.trim())
        .map((item) => ({
          id: item.id,
          handle: item.id,
          title: item.title,
          year: item.year || undefined,
          medium: item.medium || undefined,
          availableForSale: item.availableForSale,
          priceLabel: item.availableForSale ? item.priceLabel || "Price on request" : "Sold",
          image: item.imageUrl
            ? {
                url: item.imageUrl,
                alt: item.imageAlt || item.title,
              }
            : undefined,
        })),
    [artworks]
  )

  const previewExhibitions = useMemo<ArtistExhibition[]>(
    () =>
      exhibitions
        .filter((item) => item.title.trim())
        .map((item) => ({
          id: item.id,
          handle: item.id,
          title: item.title,
          artist: item.artist || undefined,
          location: item.location || undefined,
          summary: item.summary || undefined,
          start: item.startDate ? new Date(item.startDate) : undefined,
          end: item.endDate ? new Date(item.endDate) : undefined,
          hero: item.imageUrl
            ? {
                url: item.imageUrl,
                alt: item.imageAlt || item.title,
              }
            : undefined,
        })),
    [exhibitions]
  )

  const saveProfile = async () => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    setSaving(true)
    setError("")
    setNotice("")

    const payload = {
      user_id: user.id,
      username: profile.username.trim(),
      name: profile.name.trim(),
      nationality: profile.nationality.trim() || null,
      birth_year: profile.birthYear.trim() || null,
      bio_html: profile.bioHtml.trim() || null,
      cover_image: profile.coverUrl.trim() || null,
      cover_alt: profile.coverAlt.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from(PROFILE_TABLE)
      .update(payload)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle()

    if (updateError) {
      setSaving(false)
      setError(updateError.message)
      return
    }

    if (!updatedRow) {
      const { data: insertedRow, error: insertError } = await supabase.from(PROFILE_TABLE).insert(payload).select("*").single()
      if (insertError) {
        setSaving(false)
        setError(insertError.message)
        return
      }
      setProfile(mapProfileRow(insertedRow as Record<string, unknown>))
    } else {
      setProfile(mapProfileRow(updatedRow as Record<string, unknown>))
    }

    setSaving(false)
    setNotice("Profile saved.")
  }

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return null

    const fileName = sanitizeFileName(file.name)
    const path = `${user.id}/${folder}/${file.lastModified}-${fileName}`

    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    })

    if (uploadError) {
      setError(uploadError.message)
      return null
    }

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path)
    return data.publicUrl || null
  }

  const uploadProfileCover = async (file: File) => {
    setUploadingField("profile-cover")
    setError("")
    setNotice("")
    const publicUrl = await uploadImage(file, "profile")
    if (publicUrl) {
      setProfile((previous) => ({ ...previous, coverUrl: publicUrl }))
      setNotice("Cover image uploaded.")
    }
    setUploadingField("")
  }

  const uploadArtworkImage = async (index: number, file: File) => {
    setUploadingField(`artwork-${index}`)
    setError("")
    setNotice("")
    const publicUrl = await uploadImage(file, "artworks")
    if (publicUrl) {
      setArtworks((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? { ...item, imageUrl: publicUrl } : item))
      )
      setNotice("Artwork image uploaded.")
    }
    setUploadingField("")
  }

  const uploadExhibitionImage = async (index: number, file: File) => {
    setUploadingField(`exhibition-${index}`)
    setError("")
    setNotice("")
    const publicUrl = await uploadImage(file, "exhibitions")
    if (publicUrl) {
      setExhibitions((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? { ...item, imageUrl: publicUrl } : item))
      )
      setNotice("Exhibition image uploaded.")
    }
    setUploadingField("")
  }

  const saveArtwork = async (index: number) => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const entry = artworks[index]
    if (!entry || !entry.title.trim()) {
      setError("Artwork title is required.")
      return
    }

    setSaving(true)
    setError("")
    setNotice("")

    const payload = {
      user_id: user.id,
      title: entry.title.trim(),
      year: entry.year.trim() || null,
      medium: entry.medium.trim() || null,
      image_url: entry.imageUrl.trim() || null,
      image_alt: entry.imageAlt.trim() || null,
      available_for_sale: entry.availableForSale,
      price_label: entry.priceLabel.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const isTemp = entry.id.startsWith("artwork-temp-")
    if (isTemp) {
      const { data, error: insertError } = await supabase.from(ARTWORK_TABLE).insert(payload).select("*").single()
      if (insertError) {
        setSaving(false)
        setError(insertError.message)
        return
      }
      setArtworks((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? mapArtworkRow(data as Record<string, unknown>) : item))
      )
    } else {
      const { data, error: updateError } = await supabase
        .from(ARTWORK_TABLE)
        .update(payload)
        .eq("id", entry.id)
        .eq("user_id", user.id)
        .select("*")
        .single()

      if (updateError) {
        setSaving(false)
        setError(updateError.message)
        return
      }

      setArtworks((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? mapArtworkRow(data as Record<string, unknown>) : item))
      )
    }

    setSaving(false)
    setNotice("Artwork saved.")
  }

  const saveExhibition = async (index: number) => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const entry = exhibitions[index]
    if (!entry || !entry.title.trim()) {
      setError("Exhibition title is required.")
      return
    }

    setSaving(true)
    setError("")
    setNotice("")

    const payload = {
      user_id: user.id,
      title: entry.title.trim(),
      artist: entry.artist.trim() || null,
      location: entry.location.trim() || null,
      summary: entry.summary.trim() || null,
      start_date: entry.startDate || null,
      end_date: entry.endDate || null,
      hero_image: entry.imageUrl.trim() || null,
      hero_alt: entry.imageAlt.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const isTemp = entry.id.startsWith("exhibition-temp-")
    if (isTemp) {
      const { data, error: insertError } = await supabase.from(EXHIBITION_TABLE).insert(payload).select("*").single()
      if (insertError) {
        setSaving(false)
        setError(insertError.message)
        return
      }
      setExhibitions((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? mapExhibitionRow(data as Record<string, unknown>) : item))
      )
    } else {
      const { data, error: updateError } = await supabase
        .from(EXHIBITION_TABLE)
        .update(payload)
        .eq("id", entry.id)
        .eq("user_id", user.id)
        .select("*")
        .single()

      if (updateError) {
        setSaving(false)
        setError(updateError.message)
        return
      }

      setExhibitions((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? mapExhibitionRow(data as Record<string, unknown>) : item))
      )
    }

    setSaving(false)
    setNotice("Exhibition saved.")
  }

  const deleteArtwork = async (index: number) => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const entry = artworks[index]
    if (!entry) return

    if (!entry.id.startsWith("artwork-temp-")) {
      const { error: deleteError } = await supabase.from(ARTWORK_TABLE).delete().eq("id", entry.id).eq("user_id", user.id)
      if (deleteError) {
        setError(deleteError.message)
        return
      }
    }

    setArtworks((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
    setNotice("Artwork deleted.")
  }

  const deleteExhibition = async (index: number) => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const entry = exhibitions[index]
    if (!entry) return

    if (!entry.id.startsWith("exhibition-temp-")) {
      const { error: deleteError } = await supabase
        .from(EXHIBITION_TABLE)
        .delete()
        .eq("id", entry.id)
        .eq("user_id", user.id)
      if (deleteError) {
        setError(deleteError.message)
        return
      }
    }

    setExhibitions((previous) => previous.filter((_, itemIndex) => itemIndex !== index))
    setNotice("Exhibition deleted.")
  }

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f4ef] px-6 py-12 text-[#182116]">
        <p className="mx-auto max-w-5xl">Loading dashboard...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f3f4ef] px-6 py-12 text-[#182116]">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-black">Artist Dashboard</h1>
          <p className="mt-3 text-[#52604f]">Log in to edit your profile, artworks, and exhibitions.</p>
          <div className="mt-6">
            <Button asChild className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]">
              <Link href="/login">Go to login</Link>
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const displayName = profile.name.trim() || profile.username.trim() || "Artist Name"
  const profilePath = `/u/${profile.username.trim() || "yourname"}`
  const profileUrlLabel = `artistb.io${profilePath}`

  return (
    <main className="min-h-screen bg-[#f3f4ef] px-4 py-8 pb-32 text-[#182116] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">{displayName}</h1>
          <p className="mt-1 text-sm text-[#52604f] md:text-base">{profileUrlLabel}</p>
        </div>
        <Button onClick={signOut} variant="outline" className="rounded-full">
          Log out
        </Button>
      </div>

      {error ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-green-100 px-4 py-2 text-sm text-green-800">{notice}</p> : null}

      <section className="mx-auto mt-6 grid max-w-6xl gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">Profile</h2>
            <div className="mt-4 grid gap-3">
              <Input
                placeholder="Username"
                value={profile.username}
                onChange={(event) => setProfile((previous) => ({ ...previous, username: event.target.value.toLowerCase() }))}
              />
              <Input
                placeholder="Display name"
                value={profile.name}
                onChange={(event) => setProfile((previous) => ({ ...previous, name: event.target.value }))}
              />
              <Input
                placeholder="Nationality"
                value={profile.nationality}
                onChange={(event) => setProfile((previous) => ({ ...previous, nationality: event.target.value }))}
              />
              <Input
                placeholder="Birth year"
                value={profile.birthYear}
                onChange={(event) => setProfile((previous) => ({ ...previous, birthYear: event.target.value }))}
              />
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void uploadProfileCover(file)
                }}
              />
              {profile.coverUrl ? <p className="text-xs text-[#52604f]">Uploaded cover: {profile.coverUrl}</p> : null}
              {uploadingField === "profile-cover" ? <p className="text-xs text-[#52604f]">Uploading cover...</p> : null}
              <Input
                placeholder="Cover image alt text"
                value={profile.coverAlt}
                onChange={(event) => setProfile((previous) => ({ ...previous, coverAlt: event.target.value }))}
              />
              <textarea
                className="min-h-36 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Bio (HTML or plain text)"
                value={profile.bioHtml}
                onChange={(event) => setProfile((previous) => ({ ...previous, bioHtml: event.target.value }))}
              />
              <Button onClick={saveProfile} disabled={saving} className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]">
                Save profile
              </Button>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Artworks</h2>
              <Button
                variant="outline"
                onClick={() =>
                  setArtworks((previous) => [
                    {
                      id: tempId("artwork"),
                      title: "",
                      year: "",
                      medium: "",
                      imageUrl: "",
                      imageAlt: "",
                      availableForSale: true,
                      priceLabel: "",
                    },
                    ...previous,
                  ])
                }
              >
                Add artwork
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {artworks.map((artwork, index) => (
                <div key={artwork.id} className="rounded-xl border border-[#e2e8d9] p-4">
                  <div className="grid gap-2">
                    <Input
                      placeholder="Title"
                      value={artwork.title}
                      onChange={(event) =>
                        setArtworks((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: event.target.value } : item
                          )
                        )
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Year"
                        value={artwork.year}
                        onChange={(event) =>
                          setArtworks((previous) =>
                            previous.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, year: event.target.value } : item
                            )
                          )
                        }
                      />
                      <Input
                        placeholder="Medium"
                        value={artwork.medium}
                        onChange={(event) =>
                          setArtworks((previous) =>
                            previous.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, medium: event.target.value } : item
                            )
                          )
                        }
                      />
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        void uploadArtworkImage(index, file)
                      }}
                    />
                    {artwork.imageUrl ? <p className="text-xs text-[#52604f]">Uploaded image: {artwork.imageUrl}</p> : null}
                    {uploadingField === `artwork-${index}` ? (
                      <p className="text-xs text-[#52604f]">Uploading artwork image...</p>
                    ) : null}
                    <Input
                      placeholder="Image alt"
                      value={artwork.imageAlt}
                      onChange={(event) =>
                        setArtworks((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, imageAlt: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Input
                      placeholder="Price label"
                      value={artwork.priceLabel}
                      onChange={(event) =>
                        setArtworks((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, priceLabel: event.target.value } : item
                          )
                        )
                      }
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-[#52604f]">
                      <input
                        type="checkbox"
                        checked={artwork.availableForSale}
                        onChange={(event) =>
                          setArtworks((previous) =>
                            previous.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, availableForSale: event.target.checked } : item
                            )
                          )
                        }
                      />
                      Available for sale
                    </label>
                    <div className="flex gap-2">
                      <Button onClick={() => void saveArtwork(index)} disabled={saving} className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]">
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => void deleteArtwork(index)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!artworks.length ? <p className="text-sm text-[#52604f]">No artworks yet.</p> : null}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Exhibitions</h2>
              <Button
                variant="outline"
                onClick={() =>
                  setExhibitions((previous) => [
                    {
                      id: tempId("exhibition"),
                      title: "",
                      artist: "",
                      location: "",
                      summary: "",
                      startDate: "",
                      endDate: "",
                      imageUrl: "",
                      imageAlt: "",
                    },
                    ...previous,
                  ])
                }
              >
                Add exhibition
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              {exhibitions.map((exhibition, index) => (
                <div key={exhibition.id} className="rounded-xl border border-[#e2e8d9] p-4">
                  <div className="grid gap-2">
                    <Input
                      placeholder="Title"
                      value={exhibition.title}
                      onChange={(event) =>
                        setExhibitions((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Input
                      placeholder="Artist label"
                      value={exhibition.artist}
                      onChange={(event) =>
                        setExhibitions((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, artist: event.target.value } : item
                          )
                        )
                      }
                    />
                    <Input
                      placeholder="Location"
                      value={exhibition.location}
                      onChange={(event) =>
                        setExhibitions((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, location: event.target.value } : item
                          )
                        )
                      }
                    />
                    <textarea
                      className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                      placeholder="Summary"
                      value={exhibition.summary}
                      onChange={(event) =>
                        setExhibitions((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, summary: event.target.value } : item
                          )
                        )
                      }
                    />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        type="date"
                        placeholder="Start"
                        value={exhibition.startDate}
                        onChange={(event) =>
                          setExhibitions((previous) =>
                            previous.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, startDate: event.target.value } : item
                            )
                          )
                        }
                      />
                      <Input
                        type="date"
                        placeholder="End"
                        value={exhibition.endDate}
                        onChange={(event) =>
                          setExhibitions((previous) =>
                            previous.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, endDate: event.target.value } : item
                            )
                          )
                        }
                      />
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) return
                        void uploadExhibitionImage(index, file)
                      }}
                    />
                    {exhibition.imageUrl ? (
                      <p className="text-xs text-[#52604f]">Uploaded hero image: {exhibition.imageUrl}</p>
                    ) : null}
                    {uploadingField === `exhibition-${index}` ? (
                      <p className="text-xs text-[#52604f]">Uploading exhibition image...</p>
                    ) : null}
                    <Input
                      placeholder="Hero image alt"
                      value={exhibition.imageAlt}
                      onChange={(event) =>
                        setExhibitions((previous) =>
                          previous.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, imageAlt: event.target.value } : item
                          )
                        )
                      }
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => void saveExhibition(index)} disabled={saving} className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]">
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => void deleteExhibition(index)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {!exhibitions.length ? <p className="text-sm text-[#52604f]">No exhibitions yet.</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-[#d8dfce] bg-white/70 p-4 sm:p-6">
          <h2 className="text-xl font-semibold">Public profile preview</h2>
          <div className="overflow-hidden rounded-2xl border border-[#e2e8d9] bg-white">
            <ArtistHero
              name={profile.name || "Artist Name"}
              nationality={profile.nationality || undefined}
              birthYear={profile.birthYear || undefined}
              cover={
                profile.coverUrl
                  ? {
                      url: profile.coverUrl,
                      alt: profile.coverAlt || undefined,
                    }
                  : undefined
              }
            />
            <ArtistBioSection html={profile.bioHtml || "<p>Add your biography to see it here.</p>"} />
            <ArtistArtworks artworks={previewArtworks} />
            <ArtistExhibitions exhibitions={previewExhibitions} />
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
        <div className="flex items-center gap-2 rounded-[28px] border border-[#d5d7d1] bg-white px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={() =>
              setArtworks((previous) => [
                {
                  id: tempId("artwork"),
                  title: "",
                  year: "",
                  medium: "",
                  imageUrl: "",
                  imageAlt: "",
                  availableForSale: true,
                  priceLabel: "",
                },
                ...previous,
              ])
            }
            className="inline-flex min-w-24 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-lg font-medium text-[#1f251f] hover:bg-[#f3f4ef]"
          >
            <Plus className="size-6" />
            Add
          </button>
          <Link
            href={profilePath}
            target="_blank"
            className="inline-flex min-w-24 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-lg font-medium text-[#1f251f] hover:bg-[#f3f4ef]"
          >
            <Binoculars className="size-6" />
            Preview
          </Link>
        </div>
      </div>
    </main>
  )
}
