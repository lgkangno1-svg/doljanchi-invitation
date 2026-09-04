# invite2.avocadoss.co.kr

Grandparents' acquaintance-facing version of Chaewon's first-birthday invitation.

## Production separation

- Do not modify or redeploy the frozen `invite.avocadoss.co.kr` production invitation.
- This directory is a standalone Cloudflare Pages project.
- Cloudflare Pages **Root directory**: `invite2`
- Framework preset: `None`
- Build command: leave blank
- Build output directory: `.`
- Production branch: `main`
- Custom domain: `invite2.avocadoss.co.kr`

## RSVP

`functions/api/trpc/[[path]].js` proxies same-origin `/api/trpc/*` requests to the existing production invitation API. RSVP submissions therefore appear in the existing invitation admin data. The front end prefixes the RSVP note with `[invite2]` so submissions from this version can be identified.

## Content differences

- Family labels: `아들 강호성`, `며느리 홍주은`, `손녀 강채원`
- Accounts:
  - 강일원 / 국민 / 068-21-0568-486
  - 채미영 / 우리 / 1002-157-198437
- Highlighted notice: `늦어도 10월초 까지 참석여부 부탁합니다`
- Guestbook is intentionally omitted.

## Cloudflare custom domain

After the Pages deployment succeeds, add `invite2.avocadoss.co.kr` under **Pages project > Custom domains**. If the `avocadoss.co.kr` zone is already on the same Cloudflare account, Cloudflare normally creates/validates the DNS record automatically. Confirm HTTPS becomes Active before sharing the URL.
