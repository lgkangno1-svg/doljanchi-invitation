# PRODUCTION INVITATION FREEZE — DO NOT MODIFY

This repository serves two live production first-birthday invitations:
1. Main invitation at `invite.avocadoss.co.kr`
2. Grandparents' acquaintance invitation at `invite2.avocadoss.co.kr` (`invite2/`)

## Absolute rule for AI agents

The owner-approved production invitation is frozen at commit:

`e1a25f6647d0d86de12808ecdfba07b2572a184a`

Additionally, the grandparents' acquaintance invitation (`invite2/`, deployed at `invite2.avocadoss.co.kr` on Cloudflare Pages project `chaewon-invite2`) is completely **FROZEN**.

Do **not** modify, refactor, restyle, optimize, migrate, clean up, rename, regenerate, or otherwise alter either public invitation or their deployments unless the repository owner explicitly asks to change that specific invitation in the current task.

This rule applies even when a task asks to:
- audit or fix all repositories,
- improve code quality globally,
- update dependencies or deployment configuration,
- redesign multiple sites,
- apply an AI-generated design system,
- remove dead code,
- standardize media/assets,
- perform automated migrations.

For such broad tasks, this repository must be treated as **read-only and skipped** unless the owner explicitly names `doljanchi-invitation` or `invite.avocadoss.co.kr` and requests a change.

## Protected production surfaces

At minimum, do not change for `invite.avocadoss.co.kr`:
- `client/src/pages/Home.tsx`
- `client/src/index.css`
- `client/src/components/**`
- `client/src/lib/**` when used by the public invitation
- `client/public/manus-storage/**`
- invitation-related server/API/database behavior
- `Dockerfile`
- `docker-compose.yml`
- `.github/workflows/deploy.yml`
- the frozen production revision or branch

At minimum, do not change for `invite2.avocadoss.co.kr`:
- `invite2/index.html`
- `invite2/styles.css`
- `invite2/app.js`
- `invite2/_headers`
- `invite2/functions/**`
- Cloudflare Pages project `chaewon-invite2` settings, deployments, or custom domain bindings
- DNS record for `invite2.avocadoss.co.kr`

The production deploy workflow is intentionally manual-only and pinned to the exact approved commit SHA. Do not re-enable push-based deployment and do not change the pinned SHA on your own.

## Allowed work

Read-only inspection is allowed. If you identify a problem, report it without changing production unless the owner explicitly requests the change.

## Owner override

Only an explicit owner request in the active conversation/task targeting a specific invitation (`invite` or `invite2`) overrides this freeze. Never infer permission from a generic maintenance request.
