import { notFound } from "next/navigation"
import EditProfileEditor, { type ProfileEditSection } from "@/components/dashboard/EditProfileEditor"

const validSections = new Set<ProfileEditSection>(["identity", "about", "cv", "links"])

export default async function EditProfileSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  if (!validSections.has(section as ProfileEditSection)) {
    notFound()
  }

  return <EditProfileEditor section={section as ProfileEditSection} />
}
