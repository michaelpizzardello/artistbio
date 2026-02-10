"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const MEDIA_BUCKET = "artist-media"

type ProfileForm = {
  username: string
  name: string
  coverUrl: string
  coverAlt: string
}

const emptyProfile: ProfileForm = {
  username: "",
  name: "",
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

export default function EditProfilePage() {
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        .from("artist_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .limit(1)
        .maybeSingle()

      if (profileRow) {
        setProfile({
          username: str(profileRow.username || authUser.user_metadata?.username),
          name: str(profileRow.name || authUser.user_metadata?.full_name || authUser.email),
          coverUrl: str(profileRow.cover_image || profileRow.cover_url),
          coverAlt: str(profileRow.cover_alt),
        })
      } else {
        setProfile({
          username: str(authUser.user_metadata?.username),
          name: str(authUser.user_metadata?.full_name || authUser.email),
          coverUrl: "",
          coverAlt: "",
        })
      }

      setLoading(false)
    }

    const timeoutId = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [])

  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase || !user) return null
    const fileName = sanitizeFileName(file.name)
    const path = `${user.id}/${folder}/${file.lastModified}-${fileName}`
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: true,
    })
    if (error) {
      setError(error.message)
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

    setSaving(true)
    setError("")
    setNotice("")

    const payload = {
      user_id: user.id,
      username: profile.username.trim(),
      name: profile.name.trim(),
      cover_image: profile.coverUrl.trim() || null,
      cover_alt: profile.coverAlt.trim() || null,
    }

    const { error: upsertError } = await supabase.from("artist_profiles").upsert(payload, {
      onConflict: "user_id",
      ignoreDuplicates: false,
    })

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setNotice("Profile saved.")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-8 text-[#1f251f]">
        <p className="mx-auto max-w-lg text-center text-sm text-[#6b755f]">Loading profile...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-[#1f251f]">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-transparent bg-[#f4f5f3] p-2 text-[#1f251f] transition hover:border-[#dfe3db]"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="text-2xl font-bold">Edit profile</h1>
        </div>

          <div className="mt-10 flex flex-col items-center gap-2">
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
              Edit picture or avatar
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

        {error ? <p className="mt-4 rounded-xl bg-red-100 px-4 py-2 text-sm text-red-700">{error}</p> : null}
        {notice ? <p className="mt-4 rounded-xl bg-green-100 px-4 py-2 text-sm text-green-800">{notice}</p> : null}

        <div className="mt-8 space-y-4">
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
              placeholder="Username"
              value={profile.username}
              onChange={(event) => setProfile((previous) => ({ ...previous, username: event.target.value }))}
            />
          </div>
        </div>

        <Button
          onClick={saveProfile}
          disabled={saving}
          className="mt-8 w-full rounded-full bg-[#1f251f] text-white shadow-sm shadow-[#0b100b]/10"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </main>
  )
}
