'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { DragDropContext, Draggable, Droppable, type DragStart, type DropResult } from "@hello-pangea/dnd"
import { ArchiveX, ChevronDown, ChevronUp, ChevronsUp, Eye, GripVertical, MoreHorizontal, Plus, Trash2, X } from "lucide-react"
import DashboardAddSheet from "@/components/dashboard/DashboardAddSheet"
import DashboardBottomNav from "@/components/dashboard/DashboardBottomNav"
import DashboardMediaEditCard from "@/components/dashboard/DashboardMediaEditCard"
import DashboardMoreSheet from "@/components/dashboard/DashboardMoreSheet"
import DashboardProfileHeader from "@/components/dashboard/DashboardProfileHeader"
import DashboardSectionHeader from "@/components/dashboard/DashboardSectionHeader"
import DashboardToggleSwitch from "@/components/dashboard/DashboardToggleSwitch"
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
const LINK_DRAFTS_STORAGE_KEY = "dashboard-link-drafts"
const NEWS_DRAFTS_STORAGE_KEY = "dashboard-news-drafts"

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

function isLinkBlank(link: LinkForm): boolean {
  return !link.title.trim() && !link.url.trim()
}

function isNewsBlank(news: NewsForm): boolean {
  return !news.title.trim() && !news.url.trim()
}

export default function ArtistDashboard({ section = "all" }: { section?: DashboardSection }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState("")
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false)
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
    const exhibitionDraftStorageKey = `${EXHIBITION_DRAFTS_STORAGE_KEY}:${authUser.id}`
    const linkDraftStorageKey = `${LINK_DRAFTS_STORAGE_KEY}:${authUser.id}`
    const newsDraftStorageKey = `${NEWS_DRAFTS_STORAGE_KEY}:${authUser.id}`
    let exhibitionDrafts: ExhibitionForm[] = []
    let linkDrafts: LinkForm[] = []
    let newsDrafts: NewsForm[] = []
    try {
      const rawDrafts = window.localStorage.getItem(exhibitionDraftStorageKey)
      if (rawDrafts) {
        const parsed = JSON.parse(rawDrafts) as ExhibitionForm[]
        if (Array.isArray(parsed)) {
          exhibitionDrafts = parsed
            .filter((draft) => typeof draft?.id === "string" && draft.id.startsWith("exhibition-temp-"))
            .filter((draft) => !isExhibitionBlank(draft))
            .map((draft) => ({ ...draft, enabled: false }))
        }
      }

      const rawLinkDrafts = window.localStorage.getItem(linkDraftStorageKey)
      if (rawLinkDrafts) {
        const parsed = JSON.parse(rawLinkDrafts) as LinkForm[]
        if (Array.isArray(parsed)) {
          linkDrafts = parsed
            .filter((draft) => typeof draft?.id === "string" && draft.id.startsWith("link-temp-"))
            .filter((draft) => !isLinkBlank(draft))
            .map((draft) => ({ ...draft, enabled: true }))
        }
      }

      const rawNewsDrafts = window.localStorage.getItem(newsDraftStorageKey)
      if (rawNewsDrafts) {
        const parsed = JSON.parse(rawNewsDrafts) as NewsForm[]
        if (Array.isArray(parsed)) {
          newsDrafts = parsed
            .filter((draft) => typeof draft?.id === "string" && draft.id.startsWith("news-temp-"))
            .filter((draft) => !isNewsBlank(draft))
            .map((draft) => ({ ...draft, enabled: true }))
        }
      }
    } catch {
      exhibitionDrafts = []
      linkDrafts = []
      newsDrafts = []
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

    if (section === "news-links") {
      const nextLinks = [...linkDrafts]
      const nextNewsItems = [...newsDrafts]

      if (createType === "link") {
        const id = createTempId("link")
        nextLinks.unshift({ id, title: "", url: "", enabled: true })
        setLinks(nextLinks)
        setNewsItems(nextNewsItems)
        setEditingBlockKey(`link:${id}`)
      } else if (createType === "news") {
        const id = createTempId("news")
        nextNewsItems.unshift({ id, title: "", url: "", enabled: true })
        setLinks(nextLinks)
        setNewsItems(nextNewsItems)
        setEditingBlockKey(`news:${id}`)
      } else {
        setLinks(nextLinks)
        setNewsItems(nextNewsItems)
      }
    } else {
      setLinks([])
      setNewsItems([])
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

  useEffect(() => {
    if (!user) return

    const linkDraftStorageKey = `${LINK_DRAFTS_STORAGE_KEY}:${user.id}`
    const newsDraftStorageKey = `${NEWS_DRAFTS_STORAGE_KEY}:${user.id}`

    const linkDrafts = links
      .filter((item) => item.id.startsWith("link-temp-"))
      .filter((item) => !isLinkBlank(item))
      .map((item) => ({ ...item, enabled: true }))
    const newsDrafts = newsItems
      .filter((item) => item.id.startsWith("news-temp-"))
      .filter((item) => !isNewsBlank(item))
      .map((item) => ({ ...item, enabled: true }))

    if (linkDrafts.length === 0) {
      window.localStorage.removeItem(linkDraftStorageKey)
    } else {
      window.localStorage.setItem(linkDraftStorageKey, JSON.stringify(linkDrafts))
    }

    if (newsDrafts.length === 0) {
      window.localStorage.removeItem(newsDraftStorageKey)
    } else {
      window.localStorage.setItem(newsDraftStorageKey, JSON.stringify(newsDrafts))
    }
  }, [links, newsItems, user])

  const visibleBlockKeys = useMemo(() => {
    if (section === "all") return orderedBlockKeys
    if (section === "artworks") {
      return orderedBlockKeys.filter((key) => key.startsWith("artwork:"))
    }
    if (section === "exhibitions") {
      return orderedBlockKeys.filter((key) => key.startsWith("exhibition:"))
    }
    if (section === "news-links") {
      return orderedBlockKeys.filter((key) => key.startsWith("link:") || key.startsWith("news:"))
    }
    return []
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
    const id = createTempId("link")
    setLinks((previous) => [
      {
        id,
        title: "",
        url: addSearchQuery.trim(),
        enabled: true,
      },
      ...previous,
    ])
    return id
  }

  const createNewsDraft = () => {
    const id = createTempId("news")
    setNewsItems((previous) => [
      {
        id,
        title: "",
        url: addSearchQuery.trim(),
        enabled: true,
      },
      ...previous,
    ])
    return id
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

  const moveBlockInVisibleList = useCallback(
    (blockKey: string, direction: "up" | "down") => {
      setOrderedBlockKeys((previous) => {
        const visible = visibleBlockKeys.filter((key) => previous.includes(key))
        const sourceVisibleIndex = visible.indexOf(blockKey)
        if (sourceVisibleIndex < 0) return previous

        const targetVisibleIndex = direction === "up" ? sourceVisibleIndex - 1 : sourceVisibleIndex + 1
        if (targetVisibleIndex < 0 || targetVisibleIndex >= visible.length) return previous

        const targetBlockKey = visible[targetVisibleIndex]
        const sourceIndex = previous.indexOf(blockKey)
        const targetIndex = previous.indexOf(targetBlockKey)

        if (sourceIndex < 0 || targetIndex < 0) return previous

        const next = [...previous]
        next.splice(sourceIndex, 1)
        next.splice(targetIndex, 0, blockKey)
        return next
      })
    },
    [visibleBlockKeys]
  )

  const moveBlockToTop = useCallback(
    (blockKey: string) => {
      setOrderedBlockKeys((previous) => {
        const visible = visibleBlockKeys.filter((key) => previous.includes(key))
        const firstVisibleKey = visible[0]
        if (!firstVisibleKey || firstVisibleKey === blockKey) return previous

        const sourceIndex = previous.indexOf(blockKey)
        const targetIndex = previous.indexOf(firstVisibleKey)
        if (sourceIndex < 0 || targetIndex < 0) return previous

        const next = [...previous]
        next.splice(sourceIndex, 1)
        next.splice(targetIndex, 0, blockKey)
        return next
      })
    },
    [visibleBlockKeys]
  )

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
            className="inline-flex min-w-0 items-center justify-center gap-2 rounded-full bg-[#2a3b28] px-3 py-2 text-sm font-semibold text-white"
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
  const sectionTitle =
    section === "artworks"
      ? "Artworks"
      : section === "exhibitions"
        ? "Exhibitions"
        : section === "profile"
          ? "Profile"
          : section === "news-links"
            ? "News & Links"
            : section === "enquiries"
              ? "Enquiries"
              : section === "settings"
                ? "Settings"
                : "Artist Dashboard"
  const activePrimaryTab =
    section === "all"
      ? "home"
      : section === "artworks"
        ? "artworks"
        : section === "exhibitions"
          ? "exhibitions"
          : section === "profile"
            ? "profile"
            : null
  const isListSection = section === "artworks" || section === "exhibitions" || section === "news-links"
  const pendingDraftCount =
    artworks.filter((item) => item.id.startsWith("artwork-temp-")).length +
    exhibitions.filter((item) => item.id.startsWith("exhibition-temp-")).length +
    links.filter((item) => item.id.startsWith("link-temp-")).length +
    newsItems.filter((item) => item.id.startsWith("news-temp-")).length
  const recentUpdates = [
    ...artworks.slice(0, 2).map((item) => ({
      id: `artwork-${item.id}`,
      label: "Artwork",
      title: item.title || "Untitled artwork",
    })),
    ...exhibitions.slice(0, 2).map((item) => ({
      id: `exhibition-${item.id}`,
      label: "Exhibition",
      title: item.title || "Untitled exhibition",
    })),
  ].slice(0, 4)
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
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-[#dce1d7] bg-white p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="font-medium text-[#283227]">{pendingDraftCount} drafts</p>
                <p className="text-[#5f695c]">{artworks.length} artworks</p>
                <p className="text-[#5f695c]">{exhibitions.length} exhibitions</p>
              </div>
              {recentUpdates.length ? (
                <div className="mt-4 border-t border-[#e5e9e1] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6a7565]">Recent activity</p>
                  <ul className="mt-2 space-y-2">
                    {recentUpdates.map((item) => (
                      <li key={item.id} className="flex items-center justify-between border-b border-[#edf1ea] py-2 text-sm text-[#273226] last:border-b-0">
                        <span className="truncate">{item.title}</span>
                        <span className="ml-2 shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#62705f]">
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}

        {section === "profile" ? (
          <section className="mt-6 space-y-3">
            <div className="grid gap-3">
              <Link href="/edit-profile/identity" className="rounded-2xl border border-[#dce1d7] bg-white p-4">
                <p className="text-sm font-semibold text-[#1f251f]">Identity</p>
                <p className="mt-1 text-sm text-[#5a6757]">Name, username, and profile image</p>
              </Link>
              <Link href="/edit-profile/about" className="rounded-2xl border border-[#dce1d7] bg-white p-4">
                <p className="text-sm font-semibold text-[#1f251f]">About</p>
                <p className="mt-1 text-sm text-[#5a6757]">Bio and short personal statement</p>
              </Link>
              <Link href="/edit-profile/cv" className="rounded-2xl border border-[#dce1d7] bg-white p-4">
                <p className="text-sm font-semibold text-[#1f251f]">CV</p>
                <p className="mt-1 text-sm text-[#5a6757]">Career history and milestones</p>
              </Link>
              <Link href="/edit-profile/links" className="rounded-2xl border border-[#dce1d7] bg-white p-4">
                <p className="text-sm font-semibold text-[#1f251f]">Links & Contact</p>
                <p className="mt-1 text-sm text-[#5a6757]">Social links and enquiry channels</p>
              </Link>
            </div>
          </section>
        ) : null}

        {section === "enquiries" ? (
          <section className="mt-6 rounded-2xl border border-[#dce1d7] bg-white p-5">
            <h2 className="text-base font-semibold text-[#1f251f]">Inbox is quiet</h2>
            <p className="mt-2 text-sm text-[#586252]">
              Messages from collectors and curators will appear here with status tracking once enquiry capture is enabled.
            </p>
          </section>
        ) : null}

        {section === "settings" ? (
          <section className="mt-6 space-y-3">
            <div className="rounded-2xl border border-[#dce1d7] bg-white p-4">
              <p className="text-sm font-semibold text-[#1f251f]">Account details</p>
              <p className="mt-1 text-sm text-[#5a6757]">Manage account email and profile ownership.</p>
            </div>
            <div className="rounded-2xl border border-[#dce1d7] bg-white p-4">
              <p className="text-sm font-semibold text-[#1f251f]">Password & security</p>
              <p className="mt-1 text-sm text-[#5a6757]">Security settings and sign-in controls.</p>
            </div>
            <div className="rounded-2xl border border-[#dce1d7] bg-white p-4">
              <p className="text-sm font-semibold text-[#1f251f]">Notifications</p>
              <p className="mt-1 text-sm text-[#5a6757]">Choose what updates you receive.</p>
            </div>
            <div className="rounded-2xl border border-[#dce1d7] bg-white p-4">
              <p className="text-sm font-semibold text-[#1f251f]">Privacy & visibility</p>
              <p className="mt-1 text-sm text-[#5a6757]">Control public visibility and discovery.</p>
            </div>
            <div className="rounded-2xl border border-dashed border-[#dce1d7] bg-white p-4">
              <p className="text-sm font-semibold text-[#1f251f]">Billing</p>
              <p className="mt-1 text-sm text-[#5a6757]">Billing controls are staged and will be enabled in a later release.</p>
            </div>
          </section>
        ) : null}

        {section === "news-links" ? (
          <section className="mt-6 rounded-2xl border border-[#dce1d7] bg-white p-4">
            <p className="text-xs text-[#667262]">
              Draft items save locally on this device while server publishing for News &amp; Links is being completed.
            </p>
          </section>
        ) : null}
      </div>

      {error ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="mx-auto mt-4 max-w-6xl rounded-xl bg-green-100 px-4 py-2 text-sm text-green-800">{notice}</p> : null}

      {isListSection ? (
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
                            showLabel={section !== "artworks"}
                            toggleChecked={artwork.availableForSale}
                            toggleAriaLabel={`Visibility for ${artwork.title || "untitled artwork"}`}
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
                            onMoveToTop={() => moveBlockToTop(blockKey)}
                            onMoveUp={() => moveBlockInVisibleList(blockKey, "up")}
                            onMoveDown={() => moveBlockInVisibleList(blockKey, "down")}
                            moveToTopDisabled={listIndex === 0}
                            moveUpDisabled={listIndex === 0}
                            moveDownDisabled={listIndex === visibleBlockKeys.length - 1}
                            helperText={uploadingField === `artwork-${index}` ? "Uploading image..." : undefined}
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
                            showLabel={section !== "exhibitions"}
                            toggleChecked={!exhibition.id.startsWith("exhibition-temp-") && exhibition.enabled}
                            toggleLocked={exhibition.id.startsWith("exhibition-temp-")}
                            toggleAriaLabel={`Visibility for ${exhibition.title || "untitled exhibition"}`}
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
                            onMoveToTop={() => moveBlockToTop(blockKey)}
                            onMoveUp={() => moveBlockInVisibleList(blockKey, "up")}
                            onMoveDown={() => moveBlockInVisibleList(blockKey, "down")}
                            moveToTopDisabled={listIndex === 0}
                            moveUpDisabled={listIndex === 0}
                            moveDownDisabled={listIndex === visibleBlockKeys.length - 1}
                            helperText={uploadingField === `exhibition-${index}` ? "Uploading image..." : undefined}
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
                              className="touch-none inline-flex h-11 w-11 cursor-grab items-center justify-center rounded-full border border-[#d6dbd0] text-[#88917f] active:cursor-grabbing"
                              style={{ cursor: isDragging ? "grabbing" : "grab" }}
                              aria-label="Reorder link by drag"
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
                                ariaLabel={`Visibility for ${item.title || "untitled link"}`}
                                onToggle={() =>
                                  setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: !entry.enabled } : entry)))
                                }
                              />
                              <Button variant="outline" className="h-11" onClick={() => setEditingBlockKey(blockKey)}>
                                Edit
                              </Button>
                              <details className="relative">
                                <summary
                                  className="inline-flex h-11 w-11 list-none items-center justify-center rounded-md border border-[#d6dbd0] text-[#596451] transition hover:border-[#aeb6a5] [&::-webkit-details-marker]:hidden"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal className="size-4" />
                                </summary>
                                <div className="absolute right-0 top-12 z-30 w-44 rounded-xl border border-[#d9ddd3] bg-white p-1 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => moveBlockToTop(blockKey)}
                                    disabled={listIndex === 0}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
                                  >
                                    <ChevronsUp className="size-4" />
                                    Move to top
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveBlockInVisibleList(blockKey, "up")}
                                    disabled={listIndex === 0}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
                                  >
                                    <ChevronUp className="size-4" />
                                    Move up
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveBlockInVisibleList(blockKey, "down")}
                                    disabled={listIndex === visibleBlockKeys.length - 1}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
                                  >
                                    <ChevronDown className="size-4" />
                                    Move down
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1]"
                                  >
                                    <Trash2 className="size-4" />
                                    Delete or archive
                                  </button>
                                </div>
                              </details>
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
                              className="touch-none inline-flex h-11 w-11 cursor-grab items-center justify-center rounded-full border border-[#d6dbd0] text-[#88917f] active:cursor-grabbing"
                              style={{ cursor: isDragging ? "grabbing" : "grab" }}
                              aria-label="Reorder news item by drag"
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
                                ariaLabel={`Visibility for ${item.title || "untitled news item"}`}
                                onToggle={() =>
                                  setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, enabled: !entry.enabled } : entry)))
                                }
                              />
                              <Button variant="outline" className="h-11" onClick={() => setEditingBlockKey(blockKey)}>
                                Edit
                              </Button>
                              <details className="relative">
                                <summary
                                  className="inline-flex h-11 w-11 list-none items-center justify-center rounded-md border border-[#d6dbd0] text-[#596451] transition hover:border-[#aeb6a5] [&::-webkit-details-marker]:hidden"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal className="size-4" />
                                </summary>
                                <div className="absolute right-0 top-12 z-30 w-44 rounded-xl border border-[#d9ddd3] bg-white p-1 shadow-lg">
                                  <button
                                    type="button"
                                    onClick={() => moveBlockToTop(blockKey)}
                                    disabled={listIndex === 0}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
                                  >
                                    <ChevronsUp className="size-4" />
                                    Move to top
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveBlockInVisibleList(blockKey, "up")}
                                    disabled={listIndex === 0}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
                                  >
                                    <ChevronUp className="size-4" />
                                    Move up
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveBlockInVisibleList(blockKey, "down")}
                                    disabled={listIndex === visibleBlockKeys.length - 1}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1] disabled:opacity-45"
                                  >
                                    <ChevronDown className="size-4" />
                                    Move down
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedDeleteKey(expandedDeleteKey === blockKey ? "" : blockKey)}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-[#30402f] hover:bg-[#f4f6f1]"
                                  >
                                    <Trash2 className="size-4" />
                                    Delete or archive
                                  </button>
                                </div>
                              </details>
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`artwork-title-${item.id}`}>
                          Title
                        </label>
                        <Input
                          id={`artwork-title-${item.id}`}
                          placeholder="Untitled"
                          value={item.title}
                          onChange={(event) =>
                            setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`artwork-year-${item.id}`}>
                          Year
                        </label>
                        <Input
                          id={`artwork-year-${item.id}`}
                          placeholder="2026"
                          value={item.year}
                          onChange={(event) =>
                            setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, year: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`artwork-medium-${item.id}`}>
                          Medium
                        </label>
                        <Input
                          id={`artwork-medium-${item.id}`}
                          placeholder="Oil on canvas"
                          value={item.medium}
                          onChange={(event) =>
                            setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, medium: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`artwork-image-${item.id}`}>
                          Artwork image
                        </label>
                        <Input
                          id={`artwork-image-${item.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            void uploadArtworkImage(index, file)
                          }}
                        />
                        {uploadingField === `artwork-${index}` ? <p className="text-xs text-[#4f5b49]">Uploading image...</p> : null}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`artwork-alt-${item.id}`}>
                          Image alt text
                        </label>
                        <Input
                          id={`artwork-alt-${item.id}`}
                          placeholder="Describe the artwork image"
                          value={item.imageAlt}
                          onChange={(event) =>
                            setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, imageAlt: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`artwork-price-${item.id}`}>
                          Price label
                        </label>
                        <Input
                          id={`artwork-price-${item.id}`}
                          placeholder="Price on request"
                          value={item.priceLabel}
                          onChange={(event) =>
                            setArtworks((previous) => previous.map((entry, i) => (i === index ? { ...entry, priceLabel: event.target.value } : entry)))
                          }
                        />
                      </div>
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
                        <Button asChild variant="outline" className="h-11 w-11 p-0" aria-label="Open preview">
                          <Link href={previewPath} aria-label="Open preview">
                            <Eye className="size-4" />
                          </Link>
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`exhibition-title-${item.id}`}>
                          Title
                        </label>
                        <Input
                          id={`exhibition-title-${item.id}`}
                          placeholder="Exhibition title"
                          value={item.title}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`exhibition-artist-${item.id}`}>
                          Artist label
                        </label>
                        <Input
                          id={`exhibition-artist-${item.id}`}
                          placeholder="Artist label"
                          value={item.artist}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, artist: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`exhibition-location-${item.id}`}>
                          Location
                        </label>
                        <Input
                          id={`exhibition-location-${item.id}`}
                          placeholder="City, venue"
                          value={item.location}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, location: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <label
                            className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]"
                            htmlFor={`exhibition-start-${item.id}`}
                          >
                            Start date
                          </label>
                          <Input
                            id={`exhibition-start-${item.id}`}
                            type="date"
                            value={item.startDate}
                            onChange={(event) =>
                              setExhibitions((previous) =>
                                previous.map((entry, i) => (i === index ? { ...entry, startDate: event.target.value } : entry))
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]"
                            htmlFor={`exhibition-end-${item.id}`}
                          >
                            End date
                          </label>
                          <Input
                            id={`exhibition-end-${item.id}`}
                            type="date"
                            value={item.endDate}
                            onChange={(event) =>
                              setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, endDate: event.target.value } : entry)))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`exhibition-image-${item.id}`}>
                          Hero image
                        </label>
                        <Input
                          id={`exhibition-image-${item.id}`}
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (!file) return
                            void uploadExhibitionImage(index, file)
                          }}
                        />
                        {uploadingField === `exhibition-${index}` ? <p className="text-xs text-[#4f5b49]">Uploading image...</p> : null}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`exhibition-alt-${item.id}`}>
                          Hero image alt text
                        </label>
                        <Input
                          id={`exhibition-alt-${item.id}`}
                          placeholder="Describe the hero image"
                          value={item.imageAlt}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, imageAlt: event.target.value } : entry)))
                          }
                        />
                      </div>
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`exhibition-summary-${item.id}`}>
                          Summary
                        </label>
                        <textarea
                          id={`exhibition-summary-${item.id}`}
                          className="min-h-24 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                          placeholder="Write a short summary"
                          value={item.summary}
                          onChange={(event) =>
                            setExhibitions((previous) => previous.map((entry, i) => (i === index ? { ...entry, summary: event.target.value } : entry)))
                          }
                        />
                      </div>
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
                        <Button asChild variant="outline" className="h-11 w-11 p-0" aria-label="Open preview">
                          <Link href={previewPath} aria-label="Open preview">
                            <Eye className="size-4" />
                          </Link>
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`link-title-${item.id}`}>
                          Link title
                        </label>
                        <Input
                          id={`link-title-${item.id}`}
                          placeholder="Article title"
                          value={item.title}
                          onChange={(event) =>
                            setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`link-url-${item.id}`}>
                          URL
                        </label>
                        <Input
                          id={`link-url-${item.id}`}
                          placeholder="https://example.com"
                          value={item.url}
                          onChange={(event) =>
                            setLinks((previous) => previous.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry)))
                          }
                        />
                      </div>
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
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`news-title-${item.id}`}>
                          News headline
                        </label>
                        <Input
                          id={`news-title-${item.id}`}
                          placeholder="Headline"
                          value={item.title}
                          onChange={(event) =>
                            setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, title: event.target.value } : entry)))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#556151]" htmlFor={`news-url-${item.id}`}>
                          Source URL
                        </label>
                        <Input
                          id={`news-url-${item.id}`}
                          placeholder="https://example.com"
                          value={item.url}
                          onChange={(event) =>
                            setNewsItems((previous) => previous.map((entry, i) => (i === index ? { ...entry, url: event.target.value } : entry)))
                          }
                        />
                      </div>
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

      {!editingBlockKey ? (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2">
          <Button asChild type="button" variant="outline" className="h-12 w-12 rounded-full border-[#cad1c2] bg-white/95 p-0" aria-label="Open preview">
            <Link href={previewPath} aria-label="Open preview">
              <Eye className="size-5" />
            </Link>
          </Button>
          <Button
            type="button"
            onClick={() => setIsAddSheetOpen(true)}
            aria-label="Add"
            className="h-12 w-12 rounded-full bg-[#2a3b28] p-0 text-white shadow-lg shadow-[#162113]/20 hover:bg-[#223120]"
          >
            <Plus className="size-5" />
          </Button>
        </div>
      ) : null}

      <DashboardBottomNav activeTab={activePrimaryTab} onMoreClick={() => setIsMoreSheetOpen(true)} />
      <DashboardMoreSheet open={isMoreSheetOpen} onClose={() => setIsMoreSheetOpen(false)} />

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
          setIsAddSheetOpen(false)
          if (section === "news-links") {
            const id = createLinkDraft()
            setEditingBlockKey(`link:${id}`)
            return
          }
          window.sessionStorage.setItem("dashboard-create", "link")
          router.push("/app/news-links")
        }}
        onAddNews={() => {
          setIsAddSheetOpen(false)
          if (section === "news-links") {
            const id = createNewsDraft()
            setEditingBlockKey(`news:${id}`)
            return
          }
          window.sessionStorage.setItem("dashboard-create", "news")
          router.push("/app/news-links")
        }}
      />
    </main>
  )
}
