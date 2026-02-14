"use client"

import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import LoadingScreen from "@/components/ui/loading-screen"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const MEDIA_BUCKET = "artist-media"
const PROFILE_TABLE = "artist_profiles"
const usernameRegex = /^[a-z0-9._]{3,24}$/

export type ProfileEditSection = "identity" | "about" | "cv" | "links"

type ProfileForm = {
  username: string
  name: string
  about: string
  nationality: string
  birthYear: string
  coverUrl: string
  coverAlt: string
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error"

const emptyProfile: ProfileForm = {
  username: "",
  name: "",
  about: "",
  nationality: "",
  birthYear: "",
  coverUrl: "",
  coverAlt: "",
}

function str(value: unknown): string {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_")
}

function normalizeUsername(value: string): string {
  return value.toLowerCase().trim().replace(/^@/, "")
}

const sectionMeta: Record<ProfileEditSection, { title: string }> = {
  identity: {
    title: "Identity",
  },
  about: {
    title: "About",
  },
  cv: {
    title: "CV",
  },
  links: {
    title: "Links & Contact",
  },
}

export default function EditProfileEditor({ section }: { section: ProfileEditSection }) {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [initialUsername, setInitialUsername] = useState("")
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usernameCheckTimeoutRef = useRef<number | null>(null)
  const usernameCheckRequestRef = useRef(0)

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) {
        setError("Missing Supabase configuration.")
        setLoading(false)
        return
      }

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        setError("Must be logged in to edit a profile.")
        setLoading(false)
        return
      }

      setUser(authUser)

      const { data: profileRow } = await supabase
        .from(PROFILE_TABLE)
        .select("*")
        .eq("user_id", authUser.id)
        .limit(1)
        .maybeSingle()

      const nextProfile: ProfileForm = profileRow
        ? {
            username: normalizeUsername(str(profileRow.username || authUser.user_metadata?.username)),
            name: str(profileRow.name || authUser.user_metadata?.full_name || authUser.email),
            about: str(profileRow.about || profileRow.tagline || profileRow.bio_html || profileRow.bio),
            nationality: str(profileRow.nationality),
            birthYear: str(profileRow.birth_year),
            coverUrl: str(profileRow.cover_image || profileRow.cover_url),
            coverAlt: str(profileRow.cover_alt),
          }
        : {
            username: normalizeUsername(str(authUser.user_metadata?.username)),
            name: str(authUser.user_metadata?.full_name || authUser.email),
            about: "",
            nationality: "",
            birthYear: "",
            coverUrl: "",
            coverAlt: "",
          }

      setProfile(nextProfile)
      setInitialUsername(nextProfile.username)
      setLoading(false)
    }

    const timeoutId = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    return () => {
      if (usernameCheckTimeoutRef.current) {
        window.clearTimeout(usernameCheckTimeoutRef.current)
      }
    }
  }, [])

  const checkUsernameAvailability = async (candidate: string) => {
    if (!user) return
    const normalized = normalizeUsername(candidate)
    if (!normalized || normalized === initialUsername) {
      setUsernameStatus("idle")
      return
    }
    if (!usernameRegex.test(normalized)) {
      setUsernameStatus("invalid")
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setUsernameStatus("error")
      return
    }

    const requestId = ++usernameCheckRequestRef.current
    setUsernameStatus("checking")

    const { data, error: usernameCheckError } = await supabase
      .from(PROFILE_TABLE)
      .select("user_id")
      .eq("username", normalized)
      .neq("user_id", user.id)
      .limit(1)

    if (requestId !== usernameCheckRequestRef.current) return

    if (usernameCheckError) {
      setUsernameStatus("error")
      return
    }

    if (Array.isArray(data) && data.length > 0) {
      setUsernameStatus("taken")
      return
    }

    setUsernameStatus("available")
  }

  const scheduleUsernameCheck = (candidate: string) => {
    if (usernameCheckTimeoutRef.current) {
      window.clearTimeout(usernameCheckTimeoutRef.current)
    }

    usernameCheckTimeoutRef.current = window.setTimeout(() => {
      void checkUsernameAvailability(candidate)
    }, 350)
  }

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase || !user) return null
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
    setUploading(true)
    setError("")
    setNotice("")
    const publicUrl = await uploadImage(file, "profile")
    if (publicUrl) {
      setProfile((previous) => ({
        ...previous,
        coverUrl: publicUrl,
        coverAlt: file.name,
      }))
      setNotice("Profile image uploaded.")
    }
    setUploading(false)
  }

  const saveProfile = async () => {
    if (!user) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase is not configured.")
      return
    }

    if (section === "identity") {
      const normalizedUsername = normalizeUsername(profile.username)
      if (!usernameRegex.test(normalizedUsername)) {
        setError("Choose a valid username (3-24 chars, lowercase letters, numbers, dots or underscores).")
        setUsernameStatus("invalid")
        return
      }
      if (usernameStatus === "checking") {
        setError("Wait until username availability check finishes.")
        return
      }
      if (usernameStatus === "taken") {
        setError("This username is already taken.")
        return
      }
    }

    setSaving(true)
    setError("")
    setNotice("")

    const payload = {
      user_id: user.id,
      username: normalizeUsername(profile.username),
      name: profile.name.trim(),
      nationality: profile.nationality.trim() || null,
      birth_year: profile.birthYear.trim() || null,
      bio_html: profile.about.trim() || null,
      cover_image: profile.coverUrl.trim() || null,
      cover_alt: profile.coverAlt.trim() || null,
    }

    const { error: upsertError } = await supabase.from(PROFILE_TABLE).upsert(payload, {
      onConflict: "user_id",
      ignoreDuplicates: false,
    })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }

    setInitialUsername(payload.username)
    if (section === "identity") {
      setUsernameStatus("idle")
    }
    setNotice(`${sectionMeta[section].title} saved.`)
    setSaving(false)
  }

  if (loading) {
    return <LoadingScreen message="Loading profile..." />
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/edit-profile")}
              aria-label="Back to edit profile sections"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground"
            >
              <ChevronLeft className="size-5" />
            </button>
            <h1 className="text-2xl font-semibold tracking-tight">{sectionMeta[section].title}</h1>
          </div>
          {section !== "links" ? (
            <Button onClick={saveProfile} disabled={saving} className="h-10 rounded-xl bg-foreground px-4 text-background hover:bg-foreground/90">
              {saving ? "Saving..." : "Save"}
            </Button>
          ) : null}
        </header>

        {section === "identity" ? (
          <section className="mt-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border bg-muted">
                {profile.coverUrl ? (
                  <Image src={profile.coverUrl} alt="Profile cover" fill className="object-cover" sizes="64px" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{profile.name || "Artist Name"}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Change profile photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    void uploadProfileCover(file)
                  }}
                />
                {uploading ? <p className="mt-1 text-xs text-muted-foreground">Uploading...</p> : null}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="profile-name">
                  Name
                </label>
                <Input
                  id="profile-name"
                  placeholder="Name"
                  className="h-11 rounded-xl bg-background"
                  value={profile.name}
                  onChange={(event) => setProfile((previous) => ({ ...previous, name: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="profile-username">
                  Username
                </label>
                <Input
                  id="profile-username"
                  placeholder="username"
                  className="h-11 rounded-xl bg-background"
                  value={profile.username}
                  onChange={(event) => {
                    const next = normalizeUsername(event.target.value)
                    setProfile((previous) => ({ ...previous, username: next }))
                    setError("")
                    setNotice("")

                    if (!next || next === initialUsername) {
                      setUsernameStatus("idle")
                      return
                    }
                    if (!usernameRegex.test(next)) {
                      setUsernameStatus("invalid")
                      return
                    }
                    scheduleUsernameCheck(next)
                  }}
                  onBlur={() => {
                    void checkUsernameAvailability(profile.username)
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">artistb.io/{profile.username || "yourname"}</p>
                {usernameStatus === "checking" ? <p className="mt-1 text-xs text-muted-foreground">Checking availability...</p> : null}
                {usernameStatus === "available" ? <p className="mt-1 text-xs text-green-700">Username is available.</p> : null}
                {usernameStatus === "taken" ? <p className="mt-1 text-xs text-red-700">Username is already taken.</p> : null}
                {usernameStatus === "invalid" ? (
                  <p className="mt-1 text-xs text-red-700">Use 3-24 lowercase letters, numbers, dots, or underscores.</p>
                ) : null}
                {usernameStatus === "error" ? <p className="mt-1 text-xs text-red-700">Could not check username right now.</p> : null}
              </div>
            </div>
          </section>
        ) : null}

        {section === "about" ? (
          <section className="mt-6">
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="profile-about">
              Bio
            </label>
            <textarea
              id="profile-about"
              placeholder="Write a short bio for your profile"
              value={profile.about}
              maxLength={500}
              rows={6}
              onChange={(event) =>
                setProfile((previous) => ({
                  ...previous,
                  about: event.target.value.slice(0, 500),
                }))
              }
              className="flex min-h-[220px] w-full rounded-xl border border-border bg-background px-4 py-3 text-base leading-relaxed shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]"
            />
            <p className="mt-2 text-xs text-muted-foreground">{profile.about.length}/500</p>
          </section>
        ) : null}

        {section === "cv" ? (
          <section className="mt-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="profile-nationality">
                  Nationality
                </label>
                <Input
                  id="profile-nationality"
                  placeholder="Nationality"
                  className="h-11 rounded-xl bg-background"
                  value={profile.nationality}
                  onChange={(event) => setProfile((previous) => ({ ...previous, nationality: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="profile-birth-year">
                  Birth year
                </label>
                <Input
                  id="profile-birth-year"
                  inputMode="numeric"
                  placeholder="1989"
                  className="h-11 rounded-xl bg-background"
                  value={profile.birthYear}
                  onChange={(event) => setProfile((previous) => ({ ...previous, birthYear: event.target.value }))}
                />
              </div>
            </div>
          </section>
        ) : null}

        {section === "links" ? (
          <section className="mt-6 space-y-2">
            <Link href="/app/news-links" className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-foreground">News & Links</span>
                <span className="block text-sm text-muted-foreground">Manage link blocks and published posts</span>
              </span>
              <span className="text-muted-foreground">&gt;</span>
            </Link>
            <Link href="/app/enquiries" className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-foreground">Enquiries</span>
                <span className="block text-sm text-muted-foreground">Choose where contact messages are handled</span>
              </span>
              <span className="text-muted-foreground">&gt;</span>
            </Link>
          </section>
        ) : null}

        {error ? <p className="mt-4 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="mt-4 rounded-xl bg-green-100 px-4 py-2 text-sm text-green-800">{notice}</p> : null}
      </div>
    </main>
  )
}
