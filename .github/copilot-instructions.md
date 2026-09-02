# Production invitation is frozen

The live site `invite.avocadoss.co.kr` must remain unchanged unless the repository owner explicitly asks to modify this invitation in the current task.

Production is pinned to commit `fb901585f065adbe70210c45a7449c5aaa600a9a`.

Do not propose or apply edits to the public invitation UI, styles, media, invitation-related API/data behavior, Docker configuration, or deployment workflow as part of generic refactors, audits, repository-wide cleanups, design rollouts, migrations, dependency updates, or multi-repository tasks.

For broad tasks, skip this repository. Read-only review is allowed.

Do not change `.github/workflows/deploy.yml`, re-enable deployment on push, or change the frozen production SHA unless the owner explicitly requests an invitation change.

Follow `AGENTS.md` as the authoritative freeze policy.
