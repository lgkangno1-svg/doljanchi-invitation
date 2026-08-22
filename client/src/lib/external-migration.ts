import { parseMedia, parseMediaList } from "@/lib/invitation-media";

export type ExternalMigrationData = { invitation: Record<string, unknown>; rsvps: unknown[]; guestbook: unknown[] };

export function buildExternalMigrationBackup(data: ExternalMigrationData) {
  const invitation = data.invitation;
  return {
    format: "chaewon-invitation-external-migration/v1",
    generatedAt: new Date().toISOString(),
    invitation,
    rsvps: data.rsvps,
    guestbook: data.guestbook,
    mediaReferences: {
      hero: parseMedia(typeof invitation.heroImageUrl === "string" ? invitation.heroImageUrl : null),
      gallery: parseMediaList(typeof invitation.galleryImageUrls === "string" ? invitation.galleryImageUrls : null),
    },
  };
}

export function downloadExternalMigrationBackup(data: ExternalMigrationData) {
  const backup = buildExternalMigrationBackup(data);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `chaewon-invitation-migration-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
