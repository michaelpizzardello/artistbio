'use client'

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import {
  ArchiveX,
  Binoculars,
  CalendarDays,
  GripVertical,
  ImagePlus,
  Link2,
  Newspaper,
  Plus,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  enabled: boolean
}

type LinkForm = {
  id: string
  title: string
  url: string
  enabled: boolean
}

type NewsForm = {
  id: string
  title: string
  url: string
  enabled: boolean
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
    enabled: true,
  }
}

export default function ArtistDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState("")
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [addSearchQuery, setAddSearchQuery] = useState("")
  const [draggingBlockKey, setDraggingBlockKey] = useState("")
  const [touchDropBlockKey, setTouchDropBlockKey] = useState("")
  const [editingBlockKey, setEditingBlockKey] = useState("")
  const [expandedDeleteKey, setExpandedDeleteKey] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile)
  const [artworks, setArtworks] = useState<ArtworkForm[]>([])
  const [exhibitions, setExhibitions] = useState<ExhibitionForm[]>([])
  const [links, setLinks] = useState<LinkForm[]>([])
  const [newsItems, setNewsItems] = useState<NewsForm[]>([])
  const [orderedBlockKeys, setOrderedBlockKeys] = useState<string[]>([])

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

  const allBlockKeys = useMemo(
    () => [
      ...artworks.map((item) => `artwork:${item.id}`),
      ...exhibitions.map((item) => `exhibition:${item.id}`),
      ...links.map((item) => `link:${item.id}`),
      ...newsItems.map((item) => `news:${item.id}`),
    ],
    [artworks, exhibitions, links, newsItems]
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrderedBlockKeys((previous) => {
        const filtered = previous.filter((key) => allBlockKeys.includes(key))
        const missing = allBlockKeys.filter((key) => !filtered.includes(key))
        return [...filtered, ...missing]
      })
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [allBlockKeys])

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

  const saveArtwork = async (
    index: number,
    overrides?: Partial<ArtworkForm>,
    options?: { showNotice?: boolean; clearMessages?: boolean }
  ): Promise<boolean> => {
    if (!user) return false
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    const entry = artworks[index]
    const nextEntry = entry ? { ...entry, ...overrides } : undefined
    if (!nextEntry || !nextEntry.title.trim()) {
      setError("Artwork title is required.")
      return false
    }

    setSaving(true)
    if (options?.clearMessages !== false) {
      setError("")
      setNotice("")
    }

    const payload = {
      user_id: user.id,
      title: nextEntry.title.trim(),
      year: nextEntry.year.trim() || null,
      medium: nextEntry.medium.trim() || null,
      image_url: nextEntry.imageUrl.trim() || null,
      image_alt: nextEntry.imageAlt.trim() || null,
      available_for_sale: nextEntry.availableForSale,
      price_label: nextEntry.priceLabel.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const isTemp = nextEntry.id.startsWith("artwork-temp-")
    if (isTemp) {
      const { data, error: insertError } = await supabase.from(ARTWORK_TABLE).insert(payload).select("*").single()
      if (insertError) {
        setSaving(false)
        setError(insertError.message)
        return false
      }
      setArtworks((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? mapArtworkRow(data as Record<string, unknown>) : item))
      )
    } else {
      const { data, error: updateError } = await supabase
        .from(ARTWORK_TABLE)
        .update(payload)
        .eq("id", nextEntry.id)
        .eq("user_id", user.id)
        .select("*")
        .single()

      if (updateError) {
        setSaving(false)
        setError(updateError.message)
        return false
      }

      setArtworks((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? mapArtworkRow(data as Record<string, unknown>) : item))
      )
    }

    setSaving(false)
    if (options?.showNotice !== false) {
      setNotice("Artwork saved.")
    }
    return true
  }

  const uploadArtworkImage = async (index: number, file: File) => {
    setUploadingField(`artwork-${index}`)
    setError("")
    setNotice("")
    const publicUrl = await uploadImage(file, "artworks")
    if (!publicUrl) {
      setUploadingField("")
      return
    }

    const entry = artworks[index]
    if (!entry) {
      setUploadingField("")
      setError("Could not find artwork to attach image.")
      return
    }

    setArtworks((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? { ...item, imageUrl: publicUrl } : item))
    )

    if (!entry.title.trim()) {
      setNotice("Artwork image uploaded. Add a title and press Save to store it in the database.")
      setUploadingField("")
      return
    }

    const saved = await saveArtwork(index, { imageUrl: publicUrl }, { showNotice: false, clearMessages: false })
    if (saved) {
      setNotice("Artwork image uploaded and saved.")
    } else {
      setNotice("Artwork image uploaded, but database save failed. Press Save to retry.")
    }
    setUploadingField("")
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

  const createArtworkDraft = () => {
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

  const createExhibitionDraft = () => {
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
        enabled: true,
      },
      ...previous,
    ])
  }

  const createLinkDraft = () => {
    setLinks((previous) => [
      {
        id: tempId("link"),
        title: "",
        url: addSearchQuery.trim(),
        enabled: true,
      },
      ...previous,
    ])
  }

  const createNewsDraft = () => {
    setNewsItems((previous) => [
      {
        id: tempId("news"),
        title: "",
        url: addSearchQuery.trim(),
        enabled: true,
      },
      ...previous,
    ])
  }

  const moveBlock = (fromKey: string, toKey: string) => {
    if (fromKey === toKey) return
    setOrderedBlockKeys((previous) => {
      const from = previous.indexOf(fromKey)
      const to = previous.indexOf(toKey)
      if (from < 0 || to < 0) return previous
      const next = [...previous]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const archiveBlock = async (blockKey: string) => {
    const [type, id] = blockKey.split(":")
    if (!type || !id) return

    if (type === "artwork") {
      const index = artworks.findIndex((item) => item.id === id)
      if (index < 0) return
      setArtworks((previous) => previous.map((item, i) => (i === index ? { ...item, availableForSale: false } : item)))
      setNotice("Artwork archived. Save to keep changes.")
      return
    }

    if (type === "exhibition") {
      const index = exhibitions.findIndex((item) => item.id === id)
      if (index < 0) return
      setExhibitions((previous) => previous.map((item, i) => (i === index ? { ...item, enabled: false } : item)))
      setNotice("Exhibition archived. Save to keep changes.")
      return
    }

    if (type === "link") {
      const index = links.findIndex((item) => item.id === id)
      if (index < 0) return
      setLinks((previous) => previous.map((item, i) => (i === index ? { ...item, enabled: false } : item)))
      setNotice("Link archived.")
      return
    }

    if (type === "news") {
      const index = newsItems.findIndex((item) => item.id === id)
      if (index < 0) return
      setNewsItems((previous) => previous.map((item, i) => (i === index ? { ...item, enabled: false } : item)))
      setNotice("News item archived.")
    }
  }

  const deleteBlockForever = async (blockKey: string) => {
    const [type, id] = blockKey.split(":")
    if (!type || !id) return

    if (type === "artwork") {
      const index = artworks.findIndex((item) => item.id === id)
      if (index >= 0) await deleteArtwork(index)
      return
    }

    if (type === "exhibition") {
      const index = exhibitions.findIndex((item) => item.id === id)
      if (index >= 0) await deleteExhibition(index)
      return
    }

    if (type === "link") {
      setLinks((previous) => previous.filter((item) => item.id !== id))
      setNotice("Link deleted.")
      return
    }

    if (type === "news") {
      setNewsItems((previous) => previous.filter((item) => item.id !== id))
      setNotice("News item deleted.")
    }
  }

  const handleTouchDragStart = (blockKey: string) => {
    setDraggingBlockKey(blockKey)
    setTouchDropBlockKey(blockKey)
  }

  const handleTouchDragMove = (event: React.TouchEvent) => {
    if (!draggingBlockKey) return
    event.preventDefault()
    const touch = event.touches[0]
    const target = document
      .elementFromPoint(touch.clientX, touch.clientY)
      ?.closest<HTMLElement>("[data-block-key]")
    const nextKey = target?.dataset.blockKey || ""
    if (nextKey) setTouchDropBlockKey(nextKey)
  }

  const handleTouchDragEnd = () => {
    if (draggingBlockKey && touchDropBlockKey) {
      moveBlock(draggingBlockKey, touchDropBlockKey)
    }
    setDraggingBlockKey("")
    setTouchDropBlockKey("")
  }

  const renderDeleteDropdown = (blockKey: string) => {
    const isOpen = expandedDeleteKey === blockKey

    return (
      <div
        aria-hidden={!isOpen}
        className={`w-full overflow-hidden transition-all duration-300 ease-out ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{
          maxHeight: isOpen ? "22rem" : "0px",
          opacity: isOpen ? 1 : 0,
          marginTop: isOpen ? "0.75rem" : "0px",
        }}
      >
        <div className="relative border-y border-[#d6dacd] bg-[#e3e5de] px-3 py-1.5">
          <p className="text-center text-[10px] font-medium tracking-[0.08em] text-[#3d433a]">Delete</p>
          <button
            type="button"
            onClick={() => setExpandedDeleteKey("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3d433a]"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={() => {
              void deleteBlockForever(blockKey)
              setExpandedDeleteKey("")
            }}
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-[#cbd1c2] bg-white px-3 py-2 text-sm font-semibold text-[#1f251f]"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
          <button
            type="button"
            onClick={() => {
              void archiveBlock(blockKey)
              setExpandedDeleteKey("")
            }}
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-[#7a3df2] px-3 py-2 text-sm font-semibold text-white"
          >
            <ArchiveX className="size-4" />
            Archive
          </button>
          <p className="min-w-0 break-words px-1 text-[11px] leading-snug text-[#5e6858]">Delete forever.</p>
          <p className="min-w-0 break-words px-1 text-[11px] leading-snug text-[#5e6858]">
            Reduce clutter, keep your insights and restore anytime.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#f3f4ef] px-6 py-12 text-[#182116]">
        <p className="mx-auto max-w-5xl">Loading dashboard...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-[#f3f4ef] px-6 py-12 text-[#182116]">
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

  const profilePath = `/u/${profile.username.trim() || "yourname"}`
  const profileUrlLabel = `artistb.io${profilePath}`

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f4ef] px-4 py-8 pb-32 text-[#182116] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">{profile.name.trim() || profile.username.trim() || "Artist Name"}</h1>
          <p className="mt-1 text-sm text-[#52604f] md:text-base">{profileUrlLabel}</p>
        </div>
        <Button onClick={signOut} variant="outline" className="rounded-full">
          Log out
        </Button>
      </div>

      {error ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-green-100 px-4 py-2 text-sm text-green-800">{notice}</p> : null}

      <section className="mx-auto mt-6 max-w-6xl space-y-4">
        <div className="rounded-2xl border border-[#dde2d7] bg-white p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[96px_1fr_auto] md:items-center">
            <div className="size-20 rounded-full border border-[#e5e8de] bg-[#f5f7f2]" />
            <div>
              <p className="text-3xl font-bold tracking-tight">@{profile.username || "yourname"}</p>
              <p className="mt-1 text-sm text-[#5f6758]">{profileUrlLabel}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveProfile} disabled={saving} className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]">
                Save
              </Button>
              <Button onClick={signOut} variant="outline" className="rounded-full">
                Log out
              </Button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
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
          </div>
          {profile.coverUrl ? <p className="mt-2 break-all text-xs text-[#52604f]">Profile image: {profile.coverUrl}</p> : null}
          {uploadingField === "profile-cover" ? <p className="mt-1 text-xs text-[#52604f]">Uploading profile image...</p> : null}
        </div>

        {orderedBlockKeys.map((blockKey) => {
          const [type, id] = blockKey.split(":")
          const isDragging = draggingBlockKey === blockKey

          if (type === "artwork") {
            const index = artworks.findIndex((item) => item.id === id)
            if (index === -1) return null
            const artwork = artworks[index]
            return (
              <article
                key={blockKey}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveBlock(draggingBlockKey, blockKey)}
                data-block-key={blockKey}
                className={`relative rounded-2xl border bg-white p-4 shadow-sm ${
                  isDragging || touchDropBlockKey === blockKey ? "border-[#6a28ff]" : "border-[#dde2d7]"
                }`}
              >
                <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 sm:grid-cols-[106px_minmax(0,1fr)]">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggingBlockKey(blockKey)}
                    onDragEnd={() => setDraggingBlockKey("")}
                    onTouchStart={() => handleTouchDragStart(blockKey)}
                    onTouchMove={handleTouchDragMove}
                    onTouchEnd={handleTouchDragEnd}
                    className="touch-none absolute left-4 top-4 z-10 inline-flex h-7 w-7 -translate-x-1 -translate-y-1 items-center justify-center rounded-full border border-[#e3e7de] bg-white text-[#88917f] shadow-sm sm:h-8 sm:w-8"
                  >
                    <GripVertical className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBlockKey(blockKey)}
                    className="col-start-1 row-span-2 h-24 w-24 overflow-hidden rounded-2xl border border-[#e5e8df] bg-[#f4f6f1] sm:h-[106px] sm:w-[106px]"
                  >
                    {artwork.imageUrl ? (
                      <Image
                        src={artwork.imageUrl}
                        alt={artwork.imageAlt || artwork.title || "Artwork image"}
                        width={106}
                        height={106}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </button>
                  <div className="col-start-2 min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-[#6f7868]">Artwork</p>
                    <button type="button" onClick={() => setEditingBlockKey(blockKey)} className="w-full text-left">
                      <p className="mt-1 truncate text-lg font-semibold leading-tight text-[#1f251f]">
                        {artwork.title || "Untitled artwork"}
                      </p>
                    </button>
                    <p className="mt-1 truncate text-xs text-[#5e6858]">{artwork.year || "No year"} · {artwork.medium || "No medium"}</p>
                    <p className="mt-2 text-sm font-semibold text-[#1f251f]">{artwork.priceLabel || "Price on request"}</p>
                  </div>
                  <div className="col-start-2 flex items-end justify-end gap-1.5 self-end">
                    <button
                      type="button"
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}${profilePath}`
                        try {
                          if (navigator.share) {
                            await navigator.share({ title: artwork.title || "Artwork", url: shareUrl })
                          } else {
                            await navigator.clipboard.writeText(shareUrl)
                          }
                          setNotice("Artwork link copied.")
                        } catch {
                          setError("Could not share artwork right now.")
                        }
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d6dbd0] text-[#596451] transition hover:border-[#aeb6a5]"
                      aria-label="Share artwork"
                    >
                      <Share2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d6dbd0] text-[#596451] transition hover:border-[#aeb6a5]"
                      aria-label="Delete artwork"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setArtworks((previous) =>
                          previous.map((item, i) => (i === index ? { ...item, availableForSale: !item.availableForSale } : item))
                        )
                      }
                      className={`h-7 w-11 rounded-full border px-1 transition ${
                        artwork.availableForSale ? "border-green-700 bg-green-700" : "border-[#c7ccbf] bg-[#cfd4c7]"
                      }`}
                    >
                      <span className={`block size-5 rounded-full bg-white transition ${artwork.availableForSale ? "ml-auto" : ""}`} />
                    </button>
                  </div>
                </div>
                {renderDeleteDropdown(blockKey)}
              </article>
            )
          }

          if (type === "exhibition") {
            const index = exhibitions.findIndex((item) => item.id === id)
            if (index === -1) return null
            const exhibition = exhibitions[index]
            return (
              <article
                key={blockKey}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveBlock(draggingBlockKey, blockKey)}
                data-block-key={blockKey}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  isDragging || touchDropBlockKey === blockKey ? "border-[#6a28ff]" : "border-[#dde2d7]"
                }`}
              >
                <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggingBlockKey(blockKey)}
                    onDragEnd={() => setDraggingBlockKey("")}
                    onTouchStart={() => handleTouchDragStart(blockKey)}
                    onTouchMove={handleTouchDragMove}
                    onTouchEnd={handleTouchDragEnd}
                    className="touch-none text-[#88917f]"
                  >
                    <GripVertical className="size-5" />
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#6f7868]">Exhibition</p>
                    <p className="mt-1 text-xl font-semibold text-[#1f251f]">{exhibition.title || "Untitled exhibition"}</p>
                    <p className="mt-1 text-sm text-[#5e6858]">{exhibition.location || "No location"}</p>
                  </div>
                  <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExhibitions((previous) => previous.map((item, i) => (i === index ? { ...item, enabled: !item.enabled } : item)))
                      }
                      className={`h-9 w-14 rounded-full border px-1 transition ${
                        exhibition.enabled ? "border-green-700 bg-green-700" : "border-[#c7ccbf] bg-[#cfd4c7]"
                      }`}
                    >
                      <span className={`block size-6 rounded-full bg-white transition ${exhibition.enabled ? "ml-auto" : ""}`} />
                    </button>
                    <Button variant="outline" onClick={() => setEditingBlockKey(blockKey)}>
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {renderDeleteDropdown(blockKey)}
              </article>
            )
          }

          if (type === "link") {
            const index = links.findIndex((item) => item.id === id)
            if (index === -1) return null
            const item = links[index]
            return (
              <article
                key={blockKey}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveBlock(draggingBlockKey, blockKey)}
                data-block-key={blockKey}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  isDragging || touchDropBlockKey === blockKey ? "border-[#6a28ff]" : "border-[#dde2d7]"
                }`}
              >
                <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggingBlockKey(blockKey)}
                    onDragEnd={() => setDraggingBlockKey("")}
                    onTouchStart={() => handleTouchDragStart(blockKey)}
                    onTouchMove={handleTouchDragMove}
                    onTouchEnd={handleTouchDragEnd}
                    className="touch-none text-[#88917f]"
                  >
                    <GripVertical className="size-5" />
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#6f7868]">Link</p>
                    <p className="mt-1 text-xl font-semibold text-[#1f251f]">{item.title || "Untitled link"}</p>
                    <p className="mt-1 break-all text-sm text-[#5e6858]">{item.url || "No URL"}</p>
                  </div>
                  <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: !entry.enabled } : entry)))
                      }
                      className={`h-9 w-14 rounded-full border px-1 transition ${
                        item.enabled ? "border-green-700 bg-green-700" : "border-[#c7ccbf] bg-[#cfd4c7]"
                      }`}
                    >
                      <span className={`block size-6 rounded-full bg-white transition ${item.enabled ? "ml-auto" : ""}`} />
                    </button>
                    <Button variant="outline" onClick={() => setEditingBlockKey(blockKey)}>
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {renderDeleteDropdown(blockKey)}
              </article>
            )
          }

          if (type === "news") {
            const index = newsItems.findIndex((item) => item.id === id)
            if (index === -1) return null
            const item = newsItems[index]
            return (
              <article
                key={blockKey}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => moveBlock(draggingBlockKey, blockKey)}
                data-block-key={blockKey}
                className={`rounded-2xl border bg-white p-4 shadow-sm ${
                  isDragging || touchDropBlockKey === blockKey ? "border-[#6a28ff]" : "border-[#dde2d7]"
                }`}
              >
                <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggingBlockKey(blockKey)}
                    onDragEnd={() => setDraggingBlockKey("")}
                    onTouchStart={() => handleTouchDragStart(blockKey)}
                    onTouchMove={handleTouchDragMove}
                    onTouchEnd={handleTouchDragEnd}
                    className="touch-none text-[#88917f]"
                  >
                    <GripVertical className="size-5" />
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[#6f7868]">News</p>
                    <p className="mt-1 text-xl font-semibold text-[#1f251f]">{item.title || "Untitled news"}</p>
                    <p className="mt-1 break-all text-sm text-[#5e6858]">{item.url || "No URL"}</p>
                  </div>
                  <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: !entry.enabled } : entry)))
                      }
                      className={`h-9 w-14 rounded-full border px-1 transition ${
                        item.enabled ? "border-green-700 bg-green-700" : "border-[#c7ccbf] bg-[#cfd4c7]"
                      }`}
                    >
                      <span className={`block size-6 rounded-full bg-white transition ${item.enabled ? "ml-auto" : ""}`} />
                    </button>
                    <Button variant="outline" onClick={() => setEditingBlockKey(blockKey)}>
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {renderDeleteDropdown(blockKey)}
              </article>
            )
          }

          return null
        })}
      </section>

      {editingBlockKey ? (
        <div className="fixed inset-0 z-50 overflow-x-hidden bg-[#f3f4ef]">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dde2d7] bg-[#f3f4ef] px-4 py-3">
              <h2 className="text-xl font-semibold text-[#1f251f]">Edit Block</h2>
              <button
                type="button"
                onClick={() => {
                  setEditingBlockKey("")
                  setExpandedDeleteKey("")
                }}
                className="rounded-full border border-[#cfd4c7] px-4 py-1.5 text-sm font-medium text-[#1f251f]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4">
              {(() => {
                const [type, id] = editingBlockKey.split(":")

                if (type === "artwork") {
                  const index = artworks.findIndex((item) => item.id === id)
                  if (index < 0) return null
                  const item = artworks[index]
                  return (
                    <div className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
                      <Input
                        placeholder="Artwork title"
                        value={item.title}
                        onChange={(event) =>
                          setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                        }
                      />
                      <Input
                        placeholder="Year"
                        value={item.year}
                        onChange={(event) =>
                          setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, year: event.target.value } : entry)))
                        }
                      />
                      <Input
                        placeholder="Medium"
                        value={item.medium}
                        onChange={(event) =>
                          setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, medium: event.target.value } : entry)))
                        }
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) return
                          void uploadArtworkImage(index, file)
                        }}
                      />
                      <Input
                        placeholder="Image alt"
                        value={item.imageAlt}
                        onChange={(event) =>
                          setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, imageAlt: event.target.value } : entry)))
                        }
                      />
                      <Input
                        placeholder="Price label"
                        value={item.priceLabel}
                        onChange={(event) =>
                          setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, priceLabel: event.target.value } : entry)))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-[#52604f]">
                        <input
                          type="checkbox"
                          checked={item.availableForSale}
                          onChange={(event) =>
                            setArtworks((previous) =>
                              previous.map((entry, i) => (i === index ? { ...entry, availableForSale: event.target.checked } : entry))
                            )
                          }
                        />
                        Visible
                      </label>
                      <div className="flex gap-2">
                        <Button onClick={() => void saveArtwork(index)} disabled={saving} className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]">
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setExpandedDeleteKey(expandedDeleteKey === editingBlockKey ? "" : editingBlockKey)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {renderDeleteDropdown(editingBlockKey)}
                    </div>
                  )
                }

                if (type === "exhibition") {
                  const index = exhibitions.findIndex((item) => item.id === id)
                  if (index < 0) return null
                  const item = exhibitions[index]
                  return (
                    <div className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
                      <Input
                        placeholder="Exhibition title"
                        value={item.title}
                        onChange={(event) =>
                          setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                        }
                      />
                      <Input
                        placeholder="Artist label"
                        value={item.artist}
                        onChange={(event) =>
                          setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, artist: event.target.value } : entry)))
                        }
                      />
                      <Input
                        placeholder="Location"
                        value={item.location}
                        onChange={(event) =>
                          setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, location: event.target.value } : entry)))
                        }
                      />
                      <div className="grid gap-2 md:grid-cols-2">
                        <Input
                          type="date"
                          value={item.startDate}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, startDate: event.target.value } : entry)))
                          }
                        />
                        <Input
                          type="date"
                          value={item.endDate}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, endDate: event.target.value } : entry)))
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
                      <Input
                        placeholder="Hero image alt"
                        value={item.imageAlt}
                        onChange={(event) =>
                          setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, imageAlt: event.target.value } : entry)))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-[#52604f]">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: event.target.checked } : entry)))
                          }
                        />
                        Visible
                      </label>
                      <textarea
                        className="min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                        placeholder="Summary"
                        value={item.summary}
                        onChange={(event) =>
                          setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, summary: event.target.value } : entry)))
                        }
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => void saveExhibition(index)} disabled={saving} className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]">
                          Save
                        </Button>
                        <Button variant="outline" onClick={() => setExpandedDeleteKey(expandedDeleteKey === editingBlockKey ? "" : editingBlockKey)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {renderDeleteDropdown(editingBlockKey)}
                    </div>
                  )
                }

                if (type === "link") {
                  const index = links.findIndex((item) => item.id === id)
                  if (index < 0) return null
                  const item = links[index]
                  return (
                    <div className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
                      <Input
                        placeholder="Link title"
                        value={item.title}
                        onChange={(event) =>
                          setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                        }
                      />
                      <Input
                        placeholder="https://..."
                        value={item.url}
                        onChange={(event) =>
                          setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry)))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-[#52604f]">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(event) =>
                            setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: event.target.checked } : entry)))
                          }
                        />
                        Visible
                      </label>
                      <Button variant="outline" onClick={() => setExpandedDeleteKey(expandedDeleteKey === editingBlockKey ? "" : editingBlockKey)}>
                        <Trash2 className="size-4" />
                      </Button>
                      {renderDeleteDropdown(editingBlockKey)}
                    </div>
                  )
                }

                if (type === "news") {
                  const index = newsItems.findIndex((item) => item.id === id)
                  if (index < 0) return null
                  const item = newsItems[index]
                  return (
                    <div className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
                      <Input
                        placeholder="News headline"
                        value={item.title}
                        onChange={(event) =>
                          setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                        }
                      />
                      <Input
                        placeholder="Source link"
                        value={item.url}
                        onChange={(event) =>
                          setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry)))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-[#52604f]">
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(event) =>
                            setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: event.target.checked } : entry)))
                          }
                        />
                        Visible
                      </label>
                      <Button variant="outline" onClick={() => setExpandedDeleteKey(expandedDeleteKey === editingBlockKey ? "" : editingBlockKey)}>
                        <Trash2 className="size-4" />
                      </Button>
                      {renderDeleteDropdown(editingBlockKey)}
                    </div>
                  )
                }

                return null
              })()}
            </div>
          </div>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
        <div className="flex items-center gap-2 rounded-[28px] border border-[#d5d7d1] bg-white px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
          <button
            type="button"
            onClick={() => setIsAddSheetOpen(true)}
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

      {isAddSheetOpen ? (
        <div className="fixed inset-0 z-50 bg-black/35" onClick={() => setIsAddSheetOpen(false)}>
          <div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[28px] bg-[#f3f4ef] p-4 pb-8 shadow-[0_-10px_30px_rgba(0,0,0,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[#c8cbc2]" />
            <div className="rounded-2xl bg-[#e8e9e4] px-4 py-3">
              <label className="flex items-center gap-2 text-[#1f251f]">
                <Search className="size-5" />
                <input
                  value={addSearchQuery}
                  onChange={(event) => setAddSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-base outline-none placeholder:text-[#5c6157]"
                  placeholder="Paste or search a link"
                />
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  createArtworkDraft()
                  setIsAddSheetOpen(false)
                }}
                className="rounded-2xl bg-[#e8e9e4] p-4 text-center"
              >
                <ImagePlus className="mx-auto size-7 text-[#6a28ff]" />
                <p className="mt-2 text-sm font-semibold text-[#1f251f]">Artwork</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  createExhibitionDraft()
                  setIsAddSheetOpen(false)
                }}
                className="rounded-2xl bg-[#e8e9e4] p-4 text-center"
              >
                <CalendarDays className="mx-auto size-7 text-[#6a28ff]" />
                <p className="mt-2 text-sm font-semibold text-[#1f251f]">Exhibitions</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  createLinkDraft()
                  setIsAddSheetOpen(false)
                }}
                className="rounded-2xl bg-[#e8e9e4] p-4 text-center"
              >
                <Link2 className="mx-auto size-7 text-[#6a28ff]" />
                <p className="mt-2 text-sm font-semibold text-[#1f251f]">Link</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  createNewsDraft()
                  setIsAddSheetOpen(false)
                }}
                className="rounded-2xl bg-[#e8e9e4] p-4 text-center"
              >
                <Newspaper className="mx-auto size-7 text-[#6a28ff]" />
                <p className="mt-2 text-sm font-semibold text-[#1f251f]">News</p>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
