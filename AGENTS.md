# PRODUCTION INVITATION FREEZE — DO NOT MODIFY

This repository serves the live first-birthday invitation at `invite.avocadoss.co.kr`.

## Absolute rule for AI agents

The owner-approved production invitation is frozen at commit:

`fb901585f065adbe70210c45a7449c5aaa600a9a`

Do **not** modify, refactor, restyle, optimize, migrate, clean up, rename, regenerate, or otherwise alter the public invitation or its deployment unless the repository owner explicitly asks to change this invitation in the current task.

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

At minimum, do not change:
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

The production deploy workflow is intentionally manual-only and pinned to the exact approved commit SHA. Do not re-enable push-based deployment and do not change the pinned SHA on your own.

## Allowed work

Read-only inspection is allowed. If you identify a problem, report it without changing production unless the owner explicitly requests the change.

## Owner override

Only an explicit owner request in the active conversation/task to modify the live invitation overrides this freeze. Never infer permission from a generic maintenance request.
