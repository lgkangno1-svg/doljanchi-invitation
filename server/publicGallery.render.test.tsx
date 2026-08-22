import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const gallery = [
  { url: "/manus-storage/chaewon-lace-portrait-enhanced_d7bb26ce.png", kind: "image" as const, mimeType: "image/png", fileName: "chaewon-lace-portrait-enhanced.png" },
  { url: "/manus-storage/chaewon-blossom-smile_5fda8c96.webp", kind: "image" as const, mimeType: "image/webp", fileName: "chaewon-blossom-smile.webp" },
  { url: "/manus-storage/chaewon-blossom-smile-close_91503bc2.webp", kind: "image" as const, mimeType: "image/webp", fileName: "chaewon-blossom-smile-close.webp" },
  { url: "/manus-storage/chaewon-blossom-knit_72c5ef3a.webp", kind: "image" as const, mimeType: "image/webp", fileName: "chaewon-blossom-knit.webp" },
];

const invitation = { id: 1, babyName: "채원", fatherName: "강호성", motherName: "NGUYEN HONG NGOC", invitationTitle: "초대합니다", greeting: "반갑습니다", eventDate: "2026. 10. 18 SUN", eventTime: "12:00 PM", venueName: "코트야드 메리어트 서울 명동\n3층 한양 1+2홀", venueAddress: "서울특별시 중구 남대문로 9", parkingInfo: "주차 안내", heroImageUrl: JSON.stringify({ url: "/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png", kind: "image", mimeType: "image/png", fileName: "chaewon-hotel-hero.png" }), galleryImageUrls: JSON.stringify(gallery), accountInfo: "강호성 | 카카오뱅크 3333-19-8058955" };

vi.mock("wouter", () => ({ useRoute: () => [true, { slug: "invite-peach-ribbon-x7k2p" }] }));
vi.mock("../client/src/lib/trpc", () => ({ trpc: { invitation: { get: { useQuery: () => ({ data: invitation }) }, guestbook: { useQuery: () => ({ data: [], refetch: () => undefined }) }, addGuestbook: { useMutation: () => ({ mutate: () => undefined, isPending: false }) }, addRsvp: { useMutation: () => ({ mutate: () => undefined, isPending: false }) } } } }));

describe("public curated gallery rendering", () => {
  it("renders the fixed cake hero followed by all five curated photos in their intended order", async () => {
    vi.stubGlobal("React", React);
    const { default: Home } = await import("../client/src/pages/Home");
    const html = renderToStaticMarkup(createElement(Home));
    const sources = Array.from(html.matchAll(/src="([^"?]+)(?:\?[^\"]*)?"/g), match => match[1]).filter(source => source.includes("/manus-storage/"));
    expect(sources).toEqual([
      "/manus-storage/chaewon-first-birthday-bgm_af29a8dc.mp3",
      "/manus-storage/invitations/1/1787323479492-chaewon-hotel-hero_a7c0aa2c.png",
      ...gallery.map(item => item.url),
    ]);
    expect(html).toContain("gallery-portrait");
    expect(html).toContain("seasonal-transition-media");
    expect(html).toContain("gallery-blossom-close");
    expect(html).toContain("gallery-blossom");
    const sourceInSlot = (slot: string) => html.match(new RegExp(`<div[^>]*class="(?:[^"]*\\s)?${slot}(?:\\s[^"]*)?"[^>]*>[\\s\\S]*?<img[^>]*src="([^"]+)"`))?.[1];
    expect(sourceInSlot("gallery-portrait")).toBe(gallery[0].url);
    expect(sourceInSlot("seasonal-transition-media")).toBe(gallery[1].url);
    expect(sourceInSlot("gallery-blossom-close")).toBe(gallery[2].url);
    expect(sourceInSlot("gallery-blossom")).toBe(gallery[3].url);
  });
});
