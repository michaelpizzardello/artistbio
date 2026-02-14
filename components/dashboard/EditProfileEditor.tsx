"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
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

const sectionMeta: Record<ProfileEditSection, { title: string; description: string }> = {
  identity: {
    title: "Identity",
    description: "Profile photo, display name, and username.",
  },
  about: {
    title: "About",
    description: "Short profile statement shown on your public page.",
  },
  cv: {
    title: "CV",
    description: "Career context such as nationality and birth year.",
  },
  links: {
    title: "Links & Contact",
    description: "Manage public links and enquiry pathways.",
  },
}

const sectionOrder: ProfileEditSection[] = ["identity", "about", "cv", "links"]

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

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
      return
    }
    router.push("/app")
  }

  if (loading) {
    return <LoadingScreen message="Loading profile..." />
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#1f251f]">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-[#f4f5f3] text-[#1f251f] transition hover:border-[#dfe3db]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h1 className="text-2xl font-bold">Edit profile</h1>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Profile sections">
          {sectionOrder.map((sectionId) => {
            const isActive = sectionId === section
            return (
              <Link
                key={sectionId}
                href={sectionId === "identity" ? "/edit-profile" : `/edit-profile/${sectionId}`}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? "border-[#2a3b28] bg-[#2a3b28] text-white"
                    : "border-[#d9ddd3] bg-white text-[#4d5849]"
                }`}
              >
                {sectionMeta[sectionId].title}
              </Link>
            )
          })}
        </nav>

        <section className="mt-6 rounded-2xl border border-[#e1e4dd] bg-[#fafbf8] p-4">
          <h2 className="text-lg font-semibold text-[#1f251f]">{sectionMeta[section].title}</h2>
          <p className="mt-1 text-sm text-[#5a6557]">{sectionMeta[section].description}</p>
        </section>

        {section === "identity" ? (
          <div className="mt-8 space-y-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-[#e0e2df] bg-[#f1f3f0]">
                {profile.coverUrl ? (
                  <Image src={profile.coverUrl} alt="Profile cover" fill className="object-cover" sizes="96px" />
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-semibold text-[#3b463c] underline-offset-4 transition hover:text-[#1f251f] active:text-[#1f251f]"
              >
                Change profile image
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
              {uploading ? <p className="text-xs text-[#6b755f]">Uploading…</p> : null}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d766b]">Name</p>
              <Input
                placeholder="Name"
                value={profile.name}
                onChange={(event) => setProfile((previous) => ({ ...previous, name: event.target.value }))}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d766b]">Username</p>
              <Input
                placeholder="username"
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
              <p className="mt-1 text-xs text-[#5f695c]">artistb.io/{profile.username || "yourname"}</p>
              {usernameStatus === "checking" ? <p className="mt-1 text-xs text-[#5f695c]">Checking availability…</p> : null}
              {usernameStatus === "available" ? <p className="mt-1 text-xs text-green-700">Username is available.</p> : null}
              {usernameStatus === "taken" ? <p className="mt-1 text-xs text-red-700">Username is already taken.</p> : null}
              {usernameStatus === "invalid" ? (
                <p className="mt-1 text-xs text-red-700">Use 3-24 lowercase letters, numbers, dots, or underscores.</p>
              ) : null}
              {usernameStatus === "error" ? <p className="mt-1 text-xs text-red-700">Could not check username right now.</p> : null}
            </div>
          </div>
        ) : null}

        {section === "about" ? (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d766b]">About</p>
            <textarea
              placeholder="A short multiline tagline for your profile"
              value={profile.about}
              maxLength={500}
              rows={6}
              onChange={(event) =>
                setProfile((previous) => ({
                  ...previous,
                  about: event.target.value.slice(0, 500),
                }))
              }
              className="flex min-h-[144px] w-full rounded-md border border-[#dfe3db] bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-[#99a194] focus-visible:border-[#a9b3a4] focus-visible:ring-[3px] focus-visible:ring-[#e7ece3]"
            />
            <p className="mt-1 text-xs text-[#6b755f]">{profile.about.length}/500</p>
          </div>
        ) : null}

        {section === "cv" ? (
          <div className="mt-8 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d766b]">Nationality</p>
              <Input
                placeholder="Nationality"
                value={profile.nationality}
                onChange={(event) => setProfile((previous) => ({ ...previous, nationality: event.target.value }))}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6d766b]">Birth year</p>
              <Input
                inputMode="numeric"
                placeholder="1989"
                value={profile.birthYear}
                onChange={(event) => setProfile((previous) => ({ ...previous, birthYear: event.target.value }))}
              />
            </div>
          </div>
        ) : null}

        {section === "links" ? (
          <section className="mt-8 rounded-2xl border border-[#dfe3db] bg-[#f8f9f6] p-4">
            <h3 className="text-base font-semibold text-[#1f251f]">Manage links in dashboard</h3>
            <p className="mt-2 text-sm text-[#5a6557]">
              Public links and news posts are managed in the `News & Links` dashboard section.
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href="/app/news-links">Open News & Links</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/app/enquiries">Open Enquiries</Link>
              </Button>
            </div>
          </section>
        ) : null}

        {section !== "links" ? (
          <Button
            onClick={saveProfile}
            disabled={saving}
            className="mt-8 w-full rounded-full bg-[#1f251f] text-white shadow-sm shadow-[#0b100b]/10"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        ) : null}

        {error ? <p className="mt-4 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="mt-4 rounded-xl bg-green-100 px-4 py-2 text-sm text-green-800">{notice}</p> : null}
      </div>
    </main>
  )
}
