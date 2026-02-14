"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ChevronLeft } from "lucide-react"
import DashboardToggleSwitch from "@/components/dashboard/DashboardToggleSwitch"

export type SettingsSection = "account" | "security" | "notifications" | "privacy"

const SETTINGS_STORAGE_KEY = "dashboard-settings-detail"

const sectionMeta: Record<SettingsSection, { title: string; description: string }> = {
  account: {
    title: "Account details",
    description: "Identity and profile ownership",
  },
  security: {
    title: "Password & security",
    description: "Sign-in and protection controls",
  },
  notifications: {
    title: "Notifications",
    description: "Choose what updates you receive",
  },
  privacy: {
    title: "Privacy & visibility",
    description: "Public profile discovery preferences",
  },
}

type SettingsState = {
  enquiryNotifications: boolean
  productUpdates: boolean
  profileVisibility: boolean
}

const defaultSettingsState: SettingsState = {
  enquiryNotifications: true,
  productUpdates: false,
  profileVisibility: true,
}

export default function SettingsDetailView({ section }: { section: SettingsSection }) {
  const router = useRouter()
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") return defaultSettingsState
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return defaultSettingsState

    try {
      const parsed = JSON.parse(raw) as Partial<SettingsState>
      return {
        enquiryNotifications:
          typeof parsed.enquiryNotifications === "boolean"
            ? parsed.enquiryNotifications
            : defaultSettingsState.enquiryNotifications,
        productUpdates: typeof parsed.productUpdates === "boolean" ? parsed.productUpdates : defaultSettingsState.productUpdates,
        profileVisibility:
          typeof parsed.profileVisibility === "boolean" ? parsed.profileVisibility : defaultSettingsState.profileVisibility,
      }
    } catch {
      return defaultSettingsState
    }
  })

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/app/settings")}
            aria-label="Back to settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground"
          >
            <ChevronLeft className="size-4.5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{sectionMeta[section].title}</h1>
            <p className="text-sm text-muted-foreground">{sectionMeta[section].description}</p>
          </div>
        </header>

        {section === "account" ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <Link href="/edit-profile/identity" className="flex min-h-14 items-center px-4 py-3 text-sm font-medium text-foreground">
              Edit identity
            </Link>
            <Link href="/edit-profile/about" className="flex min-h-14 items-center border-t border-border px-4 py-3 text-sm font-medium text-foreground">
              Edit public bio
            </Link>
          </section>
        ) : null}

        {section === "security" ? (
          <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex min-h-14 items-center border-b border-border px-4 py-3">
              <p className="text-sm text-muted-foreground">Password updates are handled in your auth flow.</p>
            </div>
            <Link href="/login" className="flex min-h-14 items-center px-4 py-3 text-sm font-medium text-foreground">
              Open sign in settings
            </Link>
          </section>
        ) : null}

        {section === "notifications" ? (
          <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Enquiry notifications</p>
                <p className="text-sm text-muted-foreground">Alert me about new enquiries</p>
              </div>
              <DashboardToggleSwitch
                checked={settings.enquiryNotifications}
                onToggle={() =>
                  setSettings((previous) => ({ ...previous, enquiryNotifications: !previous.enquiryNotifications }))
                }
                ariaLabel="Toggle enquiry notifications"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Product updates</p>
                <p className="text-sm text-muted-foreground">Receive release and feature updates</p>
              </div>
              <DashboardToggleSwitch
                checked={settings.productUpdates}
                onToggle={() => setSettings((previous) => ({ ...previous, productUpdates: !previous.productUpdates }))}
                ariaLabel="Toggle product updates"
              />
            </div>
          </section>
        ) : null}

        {section === "privacy" ? (
          <section className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Public profile visibility</p>
                <p className="text-sm text-muted-foreground">Allow profile discovery via direct URL</p>
              </div>
              <DashboardToggleSwitch
                checked={settings.profileVisibility}
                onToggle={() => setSettings((previous) => ({ ...previous, profileVisibility: !previous.profileVisibility }))}
                ariaLabel="Toggle profile visibility"
              />
            </div>
            <p className="text-xs text-muted-foreground">Advanced privacy controls are planned for a later release.</p>
          </section>
        ) : null}
      </div>
    </main>
  )
}
