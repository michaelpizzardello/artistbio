export type ProfileForm = {
  username: string
  name: string
  nationality: string
  birthYear: string
  bioHtml: string
  coverUrl: string
  coverAlt: string
}

export type ArtworkForm = {
  id: string
  title: string
  year: string
  medium: string
  imageUrl: string
  imageAlt: string
  availableForSale: boolean
  priceLabel: string
}

export type ExhibitionForm = {
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

export type LinkForm = {
  id: string
  title: string
  url: string
  enabled: boolean
}

export type NewsForm = {
  id: string
  title: string
  url: string
  enabled: boolean
}

export type DashboardSection = "all" | "artworks" | "exhibitions"
