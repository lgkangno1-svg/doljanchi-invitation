import { describe, expect, it } from "vitest";
import { buildExternalMigrationBackup } from "../client/src/lib/external-migration";
import { externalMediaUrl } from "./storage";

describe("external hosting preparation", () => {
  it("keeps invitation, RSVP, guestbook, and media references in an external migration snapshot", () => {
    const backup = buildExternalMigrationBackup({ invitation: { heroImageUrl: '{"kind":"image","url":"/manus-storage/hero.jpg","fileName":"hero.jpg"}', galleryImageUrls: '[{"kind":"video","url":"/manus-storage/gallery.mp4","fileName":"gallery.mp4"}]' }, rsvps: [{ name: "강호성" }], guestbook: [{ authorName: "NGUYEN HONG NGOC" }] });
    expect(backup.format).toBe("chaewon-invitation-external-migration/v1");
    expect(backup.rsvps).toHaveLength(1);
    expect(backup.guestbook).toHaveLength(1);
    expect(backup.mediaReferences.hero?.url).toBe("/manus-storage/hero.jpg");
    expect(backup.mediaReferences.gallery[0]?.url).toBe("/manus-storage/gallery.mp4");
  });

  it("builds a stable public URL for external S3/R2 media", () => {
    expect(externalMediaUrl("https://media.invite.avocadoss.co.kr/", "/invitations/1/photo.jpg")).toBe("https://media.invite.avocadoss.co.kr/invitations/1/photo.jpg");
  });
});
