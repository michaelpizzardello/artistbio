'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { DragDropContext, Draggable, Droppable, type DragStart, type DropResult } from "@hello-pangea/dnd"
import { ArchiveX, GripVertical, Trash2, X } from "lucide-react"
import ArtworksMiniPreview from "@/components/dashboard/ArtworksMiniPreview"
import DashboardAddSheet from "@/components/dashboard/DashboardAddSheet"
import DashboardBottomNav from "@/components/dashboard/DashboardBottomNav"
import DashboardMediaEditCard from "@/components/dashboard/DashboardMediaEditCard"
import DashboardProfileHeader from "@/components/dashboard/DashboardProfileHeader"
import DashboardSectionHeader from "@/components/dashboard/DashboardSectionHeader"
import DashboardToggleSwitch from "@/components/dashboard/DashboardToggleSwitch"
import ExhibitionsMiniPreview from "@/components/dashboard/ExhibitionsMiniPreview"
import SectionPreviewCard from "@/components/dashboard/SectionPreviewCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LoadingScreen from "@/components/ui/loading-screen"
import {
  createTempId,
  emptyProfile,
  mapArtworkRow,
  mapExhibitionRow,
  mapProfileRow,
  sanitizeFileName,
} from "@/lib/dashboard/mappers"
import type { ArtworkForm, DashboardSection, ExhibitionForm, LinkForm, NewsForm, ProfileForm } from "@/lib/dashboard/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const PROFILE_TABLE = "artist_profiles"
const ARTWORK_TABLE = "artworks"
const EXHIBITION_TABLE = "exhibitions"
const MEDIA_BUCKET = "artist-media"
const EXHIBITION_DRAFTS_STORAGE_KEY = "dashboard-exhibition-drafts"

function isExhibitionBlank(exhibition: ExhibitionForm): boolean {
  return (
    !exhibition.title.trim() &&
    !exhibition.artist.trim() &&
    !exhibition.location.trim() &&
    !exhibition.summary.trim() &&
    !exhibition.startDate.trim() &&
    !exhibition.endDate.trim() &&
    !exhibition.imageUrl.trim() &&
    !exhibition.imageAlt.trim()
  )
}

export default function ArtistDashboard({ section = "all" }: { section?: DashboardSection }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [, setUploadingField] = useState("")
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [addSearchQuery, setAddSearchQuery] = useState("")
  const [draggingBlockKey, setDraggingBlockKey] = useState("")
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

    const artworkList = Array.isArray(artworkRows) ? artworkRows.map((row) => mapArtworkRow(row as Record<string, unknown>)) : []
    const exhibitionList = Array.isArray(exhibitionRows)
      ? exhibitionRows.map((row) => mapExhibitionRow(row as Record<string, unknown>))
      : []
    const draftStorageKey = `${EXHIBITION_DRAFTS_STORAGE_KEY}:${authUser.id}`
    let exhibitionDrafts: ExhibitionForm[] = []
    try {
      const rawDrafts = window.localStorage.getItem(draftStorageKey)
      if (rawDrafts) {
        const parsed = JSON.parse(rawDrafts) as ExhibitionForm[]
        if (Array.isArray(parsed)) {
          exhibitionDrafts = parsed
            .filter((draft) => typeof draft?.id === "string" && draft.id.startsWith("exhibition-temp-"))
            .filter((draft) => !isExhibitionBlank(draft))
            .map((draft) => ({ ...draft, enabled: false }))
        }
      }
    } catch {
      exhibitionDrafts = []
    }
    const createType = window.sessionStorage.getItem("dashboard-create")
    window.sessionStorage.removeItem("dashboard-create")

    if (createType === "artwork" && section === "artworks") {
      const id = createTempId("artwork")
      setArtworks([
        {
          id,
          title: "",
          year: "",
          medium: "",
          imageUrl: "",
          imageAlt: "",
          availableForSale: true,
          priceLabel: "",
        },
        ...artworkList,
      ])
      setEditingBlockKey(`artwork:${id}`)
    } else {
      setArtworks(artworkList)
    }

    if (createType === "exhibition" && section === "exhibitions") {
      const id = createTempId("exhibition")
      setExhibitions([
        {
          id,
          title: "",
          artist: "",
          location: "",
          summary: "",
          startDate: "",
          endDate: "",
          imageUrl: "",
          imageAlt: "",
          enabled: false,
        },
        ...exhibitionDrafts,
        ...exhibitionList,
      ])
      setEditingBlockKey(`exhibition:${id}`)
    } else {
      setExhibitions([...exhibitionDrafts, ...exhibitionList])
    }

    setLoading(false)
  }, [section])

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

  useEffect(() => {
    if (!expandedDeleteKey) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      const blockContainer = target.closest("[data-block-key]")
      if (blockContainer?.getAttribute("data-block-key") === expandedDeleteKey) return
      setExpandedDeleteKey("")
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [expandedDeleteKey])

  useEffect(() => {
    if (!user) return
    const draftStorageKey = `${EXHIBITION_DRAFTS_STORAGE_KEY}:${user.id}`
    const drafts = exhibitions
      .filter((item) => item.id.startsWith("exhibition-temp-"))
      .filter((item) => !isExhibitionBlank(item))
      .map((item) => ({ ...item, enabled: false }))
    if (drafts.length === 0) {
      window.localStorage.removeItem(draftStorageKey)
      return
    }
    window.localStorage.setItem(draftStorageKey, JSON.stringify(drafts))
  }, [exhibitions, user])

  const visibleBlockKeys = useMemo(() => {
    if (section === "all") return orderedBlockKeys
    const prefix = section === "artworks" ? "artwork:" : "exhibition:"
    return orderedBlockKeys.filter((key) => key.startsWith(prefix))
  }, [orderedBlockKeys, section])

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

  const saveExhibition = async (index: number): Promise<boolean> => {
    if (!user) return false
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return false

    const entry = exhibitions[index]
    if (!entry || !entry.title.trim()) {
      setError("Exhibition title is required.")
      return false
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
        return false
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
        return false
      }

      setExhibitions((previous) =>
        previous.map((item, itemIndex) => (itemIndex === index ? mapExhibitionRow(data as Record<string, unknown>) : item))
      )
    }

    setSaving(false)
    setNotice("Exhibition saved.")
    return true
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

  const createArtworkDraft = useCallback(() => {
    const id = createTempId("artwork")
    setArtworks((previous) => [
      {
        id,
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
    return id
  }, [])

  const createExhibitionDraft = useCallback(() => {
    const id = createTempId("exhibition")
    setExhibitions((previous) => [
      {
        id,
        title: "",
        artist: "",
        location: "",
        summary: "",
        startDate: "",
        endDate: "",
        imageUrl: "",
        imageAlt: "",
        enabled: false,
      },
      ...previous,
    ])
    return id
  }, [])

  const createLinkDraft = () => {
    setLinks((previous) => [
      {
        id: createTempId("link"),
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
        id: createTempId("news"),
        title: "",
        url: addSearchQuery.trim(),
        enabled: true,
      },
      ...previous,
    ])
  }

  const handleDragStart = (start: DragStart) => {
    setDraggingBlockKey(start.draggableId)
  }

  const handleDragEnd = (result: DropResult) => {
    setDraggingBlockKey("")
    const { destination, source } = result
    if (!destination || source.index === destination.index) return
    setOrderedBlockKeys((previous) => {
      const next = [...previous]
      const [item] = next.splice(source.index, 1)
      if (!item) return previous
      next.splice(destination.index, 0, item)
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
    return <LoadingScreen message="Loading dashboard..." />
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

  const profilePath = `/${profile.username.trim() || "yourname"}`
  const previewPath = `/u/${profile.username.trim() || "yourname"}`
  const profileUrlLabel = `artistb.io${profilePath}`
  const sectionTitle = section === "artworks" ? "Artworks" : section === "exhibitions" ? "Exhibitions" : "Artist Dashboard"
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }

    router.push("/app")
  }
  const handleShareProfile = async () => {
    const shareUrl = `${window.location.origin}${profilePath}`
    try {
      if (navigator.share) {
        await navigator.share({ title: profile.name.trim() || profile.username.trim() || "Artist Profile", url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setNotice("Profile link copied.")
    } catch {
      setError("Could not share profile right now.")
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f4ef] px-4 py-8 pb-32 text-[#182116]">
      <div className="mx-auto max-w-6xl">
        {section === "all" ? (
          <DashboardProfileHeader
            coverUrl={profile.coverUrl}
            coverAlt={profile.coverAlt}
            name={profile.name}
            username={profile.username}
            profileUrlLabel={profileUrlLabel}
            onShareProfile={() => {
              void handleShareProfile()
            }}
          />
        ) : (
          <DashboardSectionHeader title={sectionTitle} onBack={handleBack} />
        )}

        {section === "all" ? (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <SectionPreviewCard href="/app/artworks" label="Artworks" hasContent={artworks.length > 0} emptyMessage="No artworks yet">
              <ArtworksMiniPreview artworks={artworks} />
            </SectionPreviewCard>

            <SectionPreviewCard href="/app/exhibitions" label="Exhibitions" hasContent={exhibitions.length > 0} emptyMessage="No exhibitions yet">
              <ExhibitionsMiniPreview exhibitions={exhibitions} />
            </SectionPreviewCard>
          </div>
        ) : null}
      </div>

      {error ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-green-100 px-4 py-2 text-sm text-green-800">{notice}</p> : null}

      {section !== "all" ? (
        <section className="mx-auto mt-6 max-w-6xl space-y-4">
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="dashboard-blocks">
              {(droppableProvided) => (
                <div ref={droppableProvided.innerRef} {...droppableProvided.droppableProps} className="space-y-4">
                  {visibleBlockKeys.map((blockKey, listIndex) => {
                const [type, id] = blockKey.split(":")
                const isDragging = draggingBlockKey === blockKey

                if (type === "artwork") {
                  const index = artworks.findIndex((item) => item.id === id)
                  if (index === -1) return null
                  const artwork = artworks[index]
                  return (
                    <Draggable key={blockKey} draggableId={blockKey} index={listIndex} shouldRespectForcePress={false}>
                      {(draggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          style={draggableProvided.draggableProps.style}
                        >
                          <DashboardMediaEditCard
                            blockKey={blockKey}
                            isDragging={isDragging}
                            dragHandleProps={draggableProvided.dragHandleProps}
                            label="Artwork"
                            title={artwork.title || "Untitled artwork"}
                            subline={`${artwork.year || "No year"} · ${artwork.medium || "No medium"}`}
                            meta={artwork.priceLabel || "Price on request"}
                            imageUrl={artwork.imageUrl}
                            imageAlt={artwork.imageAlt || artwork.title || "Artwork image"}
                            toggleChecked={artwork.availableForSale}
                            onEdit={() => setEditingBlockKey(blockKey)}
                            onShare={() => {
                              void (async () => {
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
                              })()
                            }}
                            onDelete={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}
                            onToggle={() =>
                              setArtworks((previous) =>
                                previous.map((item, i) => (i === index ? { ...item, availableForSale: !item.availableForSale } : item))
                              )
                            }
                            renderDeleteDropdown={renderDeleteDropdown(blockKey)}
                          />
                        </div>
                      )}
                    </Draggable>
                  )
                }

                if (type === "exhibition") {
                  const index = exhibitions.findIndex((item) => item.id === id)
                  if (index === -1) return null
                  const exhibition = exhibitions[index]
                  return (
                    <Draggable key={blockKey} draggableId={blockKey} index={listIndex} shouldRespectForcePress={false}>
                      {(draggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          style={draggableProvided.draggableProps.style}
                        >
                          <DashboardMediaEditCard
                            blockKey={blockKey}
                            isDragging={isDragging}
                            dragHandleProps={draggableProvided.dragHandleProps}
                            label="Exhibition"
                            title={exhibition.title || "Untitled exhibition"}
                            subline={exhibition.location || "No location"}
                            meta={
                              exhibition.startDate || exhibition.endDate
                                ? `${exhibition.startDate || ""}${exhibition.endDate ? ` - ${exhibition.endDate}` : ""}`
                                : "No dates"
                            }
                            imageUrl={exhibition.imageUrl}
                            imageAlt={exhibition.imageAlt || exhibition.title || "Exhibition image"}
                            toggleChecked={!exhibition.id.startsWith("exhibition-temp-") && exhibition.enabled}
                            toggleLocked={exhibition.id.startsWith("exhibition-temp-")}
                            onEdit={() => setEditingBlockKey(blockKey)}
                            onShare={() => {
                              void (async () => {
                                const shareUrl = `${window.location.origin}${profilePath}`
                                try {
                                  if (navigator.share) {
                                    await navigator.share({ title: exhibition.title || "Exhibition", url: shareUrl })
                                  } else {
                                    await navigator.clipboard.writeText(shareUrl)
                                  }
                                  setNotice("Exhibition link copied.")
                                } catch {
                                  setError("Could not share exhibition right now.")
                                }
                              })()
                            }}
                            onDelete={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}
                            onToggle={() =>
                              setExhibitions((previous) =>
                                previous.map((item, i) =>
                                  i === index
                                    ? item.id.startsWith("exhibition-temp-")
                                      ? { ...item, enabled: false }
                                      : { ...item, enabled: !item.enabled }
                                    : item
                                )
                              )
                            }
                            renderDeleteDropdown={renderDeleteDropdown(blockKey)}
                          />
                        </div>
                      )}
                    </Draggable>
                  )
                }

                if (type === "link") {
                  const index = links.findIndex((item) => item.id === id)
                  if (index === -1) return null
                  const item = links[index]
                  return (
                    <Draggable key={blockKey} draggableId={blockKey} index={listIndex} shouldRespectForcePress={false}>
                      {(draggableProvided) => (
                        <article
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          data-block-key={blockKey}
                          className={`rounded-2xl border bg-white p-4 shadow-sm transition-[opacity,box-shadow,border-color] duration-200 ${
                            isDragging ? "border-[#6a28ff] opacity-70 shadow-md" : "border-[#dde2d7]"
                          }`}
                          style={draggableProvided.draggableProps.style}
                        >
                          <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
                            <button
                              type="button"
                              data-drag-handle="true"
                              {...draggableProvided.dragHandleProps}
                              className="touch-none cursor-grab text-[#88917f] active:cursor-grabbing"
                              style={{ cursor: isDragging ? "grabbing" : "grab" }}
                            >
                              <GripVertical className="size-5" />
                            </button>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-[#6f7868]">Link</p>
                              <p className="mt-1 text-xl font-semibold text-[#1f251f]">{item.title || "Untitled link"}</p>
                              <p className="mt-1 break-all text-sm text-[#5e6858]">{item.url || "No URL"}</p>
                            </div>
                            <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
                              <DashboardToggleSwitch
                                checked={item.enabled}
                                onToggle={() =>
                                  setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: !entry.enabled } : entry)))
                                }
                              />
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
                      )}
                    </Draggable>
                  )
                }

                if (type === "news") {
                  const index = newsItems.findIndex((item) => item.id === id)
                  if (index === -1) return null
                  const item = newsItems[index]
                  return (
                    <Draggable key={blockKey} draggableId={blockKey} index={listIndex} shouldRespectForcePress={false}>
                      {(draggableProvided) => (
                        <article
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          data-block-key={blockKey}
                          className={`rounded-2xl border bg-white p-4 shadow-sm transition-[opacity,box-shadow,border-color] duration-200 ${
                            isDragging ? "border-[#6a28ff] opacity-70 shadow-md" : "border-[#dde2d7]"
                          }`}
                          style={draggableProvided.draggableProps.style}
                        >
                          <div className="grid grid-cols-[24px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
                            <button
                              type="button"
                              data-drag-handle="true"
                              {...draggableProvided.dragHandleProps}
                              className="touch-none cursor-grab text-[#88917f] active:cursor-grabbing"
                              style={{ cursor: isDragging ? "grabbing" : "grab" }}
                            >
                              <GripVertical className="size-5" />
                            </button>
                            <div>
                              <p className="text-xs uppercase tracking-[0.12em] text-[#6f7868]">News</p>
                              <p className="mt-1 text-xl font-semibold text-[#1f251f]">{item.title || "Untitled news"}</p>
                              <p className="mt-1 break-all text-sm text-[#5e6858]">{item.url || "No URL"}</p>
                            </div>
                            <div className="col-start-2 flex flex-wrap gap-2 sm:col-start-auto sm:justify-end">
                              <DashboardToggleSwitch
                                checked={item.enabled}
                                onToggle={() =>
                                  setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: !entry.enabled } : entry)))
                                }
                              />
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
                      )}
                    </Draggable>
                  )
                }

                return null
                  })}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>
      ) : null}

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
                    <div data-block-key={editingBlockKey} className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
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
                        <Button
                          onClick={async () => {
                            const saved = await saveArtwork(index)
                            if (saved) {
                              setEditingBlockKey("")
                              setExpandedDeleteKey("")
                              if (section !== "all") {
                                handleBack()
                              }
                            }
                          }}
                          disabled={saving}
                          className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]"
                        >
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
                    <div data-block-key={editingBlockKey} className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
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
                          checked={!item.id.startsWith("exhibition-temp-") && item.enabled}
                          disabled={item.id.startsWith("exhibition-temp-")}
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
                        <Button
                          onClick={async () => {
                            const saved = await saveExhibition(index)
                            if (saved) {
                              setEditingBlockKey("")
                              setExpandedDeleteKey("")
                              if (section !== "all") {
                                handleBack()
                              }
                            }
                          }}
                          disabled={saving}
                          className="rounded-full bg-[#2a3b28] text-white hover:bg-[#223120]"
                        >
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
                    <div data-block-key={editingBlockKey} className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
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
                    <div data-block-key={editingBlockKey} className="space-y-3 rounded-2xl border border-[#dde2d7] bg-white p-4">
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

      <DashboardBottomNav previewPath={previewPath} onAddClick={() => setIsAddSheetOpen(true)} />

      <DashboardAddSheet
        open={isAddSheetOpen}
        searchQuery={addSearchQuery}
        onSearchQueryChange={setAddSearchQuery}
        onClose={() => setIsAddSheetOpen(false)}
        onAddArtwork={() => {
          setIsAddSheetOpen(false)
          if (section === "artworks") {
            const id = createArtworkDraft()
            setEditingBlockKey(`artwork:${id}`)
            return
          }
          window.sessionStorage.setItem("dashboard-create", "artwork")
          router.push("/app/artworks")
        }}
        onAddExhibition={() => {
          setIsAddSheetOpen(false)
          if (section === "exhibitions") {
            const id = createExhibitionDraft()
            setEditingBlockKey(`exhibition:${id}`)
            return
          }
          window.sessionStorage.setItem("dashboard-create", "exhibition")
          router.push("/app/exhibitions")
        }}
        onAddLink={() => {
          createLinkDraft()
          setIsAddSheetOpen(false)
        }}
        onAddNews={() => {
          createNewsDraft()
          setIsAddSheetOpen(false)
        }}
      />
    </main>
  )
}
