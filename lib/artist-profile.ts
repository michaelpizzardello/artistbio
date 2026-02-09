import "server-only"

import { createClient } from "@supabase/supabase-js"

type RecordValue = string | number | boolean | null | Record<string, unknown> | unknown[]
export type GenericRecord = Record<string, RecordValue>

export type ArtistProfile = {
  id?: string
  userId?: string
  username: string
  handle: string
  name: string
  nationality?: string
  birthYear?: string
  bioHtml?: string
  cover?: { url: string; alt?: string }
}

export type ArtistArtwork = {
  id: string
  handle: string
  title: string
  year?: string
  medium?: string
  image?: { url: string; width?: number; height?: number; alt?: string }
  availableForSale: boolean
  priceLabel?: string
  exhibitionHandle?: string
}

export type ArtistExhibition = {
  id: string
  handle: string
  title: string
  artist?: string
  location?: string
  summary?: string
  start?: Date
  end?: Date
  isGroup?: boolean
  hero?: { url: string; alt?: string }
}

const PROFILE_TABLES = ["artists", "artist_profiles", "profiles", "users"] as const
const ARTWORK_TABLES = ["artworks", "works", "products"] as const
const EXHIBITION_TABLES = ["exhibitions", "shows"] as const

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function str(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined
  if (typeof value === "number") return String(value)
  return undefined
}

function bool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const v = value.trim().toLowerCase()
    if (v === "true") return true
    if (v === "false") return false
  }
  return undefined
}

function date(value: unknown): Date | undefined {
  const raw = str(value)
  if (!raw) return undefined
  const parsed = new Date(raw)
  return Number.isNaN(parsed.valueOf()) ? undefined : parsed
}

function getStringByKeys(record: GenericRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = str(record[key])
    if (value) return value
  }
  return undefined
}

function getImageByKeys(record: GenericRecord, keys: string[]): { url: string; alt?: string } | undefined {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === "string" && value.startsWith("http")) return { url: value }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>
      const url = str(obj.url) || str(obj.src)
      if (url && url.startsWith("http")) {
        return { url, alt: str(obj.alt) || str(obj.altText) }
      }
    }
  }
  return undefined
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function toParagraphHtml(input?: string): string | undefined {
  if (!input) return undefined
  if (/<[a-z][\s\S]*>/i.test(input)) return input
  const blocks = input
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  if (!blocks.length) return undefined
  return blocks.map((chunk) => `<p>${escapeHtml(chunk).replaceAll("\n", "<br />")}</p>`).join("")
}

async function maybeReadTable(table: string, limit = 120): Promise<GenericRecord[] | null> {
  const client = getServerClient()
  if (!client) return null
  const { data, error } = await client.from(table).select("*").limit(limit)
  if (error || !Array.isArray(data)) return null
  return data as GenericRecord[]
}

function matchesArtistIdentity(record: GenericRecord, artist: ArtistProfile): boolean {
  const recordOwnerIds = [
    getStringByKeys(record, ["user_id", "owner_id", "artist_id", "profile_id"]),
  ]
    .filter(Boolean)
    .map((v) => (v as string).toLowerCase())

  const knownArtistIds = [artist.userId, artist.id]
    .filter(Boolean)
    .map((v) => (v as string).toLowerCase())

  if (recordOwnerIds.length && knownArtistIds.length) {
    if (recordOwnerIds.some((value) => knownArtistIds.includes(value))) return true
  }

  const fields = [
    getStringByKeys(record, ["artist_handle", "artist_slug", "artist_username", "artist"]),
    getStringByKeys(record, ["artist_name", "vendor", "creator", "author"]),
    getStringByKeys(record, ["profile_username", "username"]),
  ]
    .filter(Boolean)
    .map((v) => (v as string).toLowerCase())

  const artistName = artist.name.toLowerCase()
  const artistHandle = artist.handle.toLowerCase()
  const username = artist.username.toLowerCase()

  return fields.some((value) => value === artistHandle || value === username || value === artistName)
}

function mapProfile(record: GenericRecord, username: string): ArtistProfile {
  const handle = getStringByKeys(record, ["handle", "slug", "username"]) || username
  const name = getStringByKeys(record, ["name", "title", "full_name", "display_name"]) || handle
  const bio = getStringByKeys(record, ["bio_html", "bio", "biography", "about", "description", "long_text"])

  return {
    id: getStringByKeys(record, ["id", "uuid"]),
    userId: getStringByKeys(record, ["user_id", "userid", "owner_id"]),
    username,
    handle,
    name,
    nationality: getStringByKeys(record, ["nationality", "country", "origin"]),
    birthYear: getStringByKeys(record, ["birth_year", "birthyear", "birth", "born"]),
    bioHtml: toParagraphHtml(bio),
    cover: getImageByKeys(record, ["coverimage", "cover_image", "hero_image", "image_url", "image"]),
  }
}

function mapArtwork(record: GenericRecord): ArtistArtwork | null {
  const id = getStringByKeys(record, ["id", "uuid", "handle", "slug"])
  const title = getStringByKeys(record, ["title", "name"])
  if (!id || !title) return null

  const sold = bool(record.sold)
  const availableForSaleRaw = bool(record.available_for_sale) ?? bool(record.available)
  const availableForSale = sold === true ? false : availableForSaleRaw ?? true

  const amount = Number(getStringByKeys(record, ["price", "price_amount", "amount"]) || NaN)
  const currency = getStringByKeys(record, ["currency", "currency_code"]) || "USD"
  const hasPrice = !Number.isNaN(amount)
  const priceLabel = !availableForSale
    ? "Sold"
    : hasPrice
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
        }).format(amount)
      : "Price on request"

  return {
    id,
    handle: getStringByKeys(record, ["handle", "slug"]) || id,
    title,
    year: getStringByKeys(record, ["year", "date"]),
    medium: getStringByKeys(record, ["medium", "material"]),
    image: getImageByKeys(record, ["image_url", "featured_image", "thumbnail", "image", "coverimage"]),
    availableForSale,
    priceLabel,
    exhibitionHandle: getStringByKeys(record, ["exhibition_handle", "exhibition_slug"]),
  }
}

function mapExhibition(record: GenericRecord): ArtistExhibition | null {
  const id = getStringByKeys(record, ["id", "uuid", "handle", "slug"])
  const title = getStringByKeys(record, ["title", "name"])
  if (!id || !title) return null

  return {
    id,
    handle: getStringByKeys(record, ["handle", "slug"]) || id,
    title,
    artist: getStringByKeys(record, ["artist", "artist_name"]),
    location: getStringByKeys(record, ["location", "subtitle", "venue"]),
    summary: getStringByKeys(record, ["summary", "teaser", "short_text", "description"]),
    start: date(record.start_date ?? record.start ?? record.startdate),
    end: date(record.end_date ?? record.end ?? record.enddate),
    isGroup: bool(record.is_group ?? record.isgroup),
    hero: getImageByKeys(record, ["hero_image", "cover_image", "image_url", "image", "coverimage"]),
  }
}

async function fetchProfileByUsername(username: string): Promise<ArtistProfile | null> {
  const client = getServerClient()
  if (!client) return null

  for (const table of PROFILE_TABLES) {
    for (const key of ["username", "handle", "slug"]) {
      const { data, error } = await client.from(table).select("*").eq(key, username).limit(1).maybeSingle()
      if (error) continue
      if (data) return mapProfile(data as GenericRecord, username)
    }
  }

  return null
}

export async function loadArtistPageData(username: string): Promise<{
  artist: ArtistProfile | null
  artworks: ArtistArtwork[]
  exhibitions: ArtistExhibition[]
}> {
  const artist = await fetchProfileByUsername(username)
  if (!artist) return { artist: null, artworks: [], exhibitions: [] }

  const artworks: ArtistArtwork[] = []
  for (const table of ARTWORK_TABLES) {
    const rows = await maybeReadTable(table, 200)
    if (!rows) continue
    rows
      .filter((row) => matchesArtistIdentity(row, artist))
      .map(mapArtwork)
      .filter((item): item is ArtistArtwork => Boolean(item))
      .forEach((item) => artworks.push(item))
    if (artworks.length) break
  }

  const exhibitions: ArtistExhibition[] = []
  for (const table of EXHIBITION_TABLES) {
    const rows = await maybeReadTable(table, 120)
    if (!rows) continue
    rows
      .filter((row) => matchesArtistIdentity(row, artist))
      .map(mapExhibition)
      .filter((item): item is ArtistExhibition => Boolean(item))
      .forEach((item) => exhibitions.push(item))
    if (exhibitions.length) break
  }

  return {
    artist,
    artworks,
    exhibitions: exhibitions.sort((a, b) => {
      const aTime = a.start?.getTime() ?? a.end?.getTime() ?? 0
      const bTime = b.start?.getTime() ?? b.end?.getTime() ?? 0
      return bTime - aTime
    }),
  }
}
