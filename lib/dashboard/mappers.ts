import type { ArtworkForm, ExhibitionForm, ProfileForm } from "@/lib/dashboard/types"

export const emptyProfile: ProfileForm = {
  username: "",
  name: "",
  nationality: "",
  birthYear: "",
  bioHtml: "",
  coverUrl: "",
  coverAlt: "",
}

export function createTempId(prefix: string) {
  return `${prefix}-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function sanitizeFileName(name: string): string {
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

export function mapProfileRow(row: Record<string, unknown>): ProfileForm {
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

export function mapArtworkRow(row: Record<string, unknown>): ArtworkForm {
  return {
    id: str(row.id) || createTempId("artwork"),
    title: str(row.title || row.name),
    year: str(row.year),
    medium: str(row.medium),
    imageUrl: str(row.image_url || row.cover_image),
    imageAlt: str(row.image_alt),
    availableForSale: bool(row.available_for_sale),
    priceLabel: str(row.price_label || row.price),
  }
}

export function mapExhibitionRow(row: Record<string, unknown>): ExhibitionForm {
  return {
    id: str(row.id) || createTempId("exhibition"),
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
