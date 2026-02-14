import { notFound } from "next/navigation"
import SettingsDetailView, { type SettingsSection } from "@/components/dashboard/SettingsDetailView"

const validSections = new Set<SettingsSection>(["account", "security", "notifications", "privacy"])

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  if (!validSections.has(section as SettingsSection)) {
    notFound()
  }

  return <SettingsDetailView section={section as SettingsSection} />
}
