# Production invitations are frozen

The live sites `invite.avocadoss.co.kr` and `invite2.avocadoss.co.kr` (`invite2/`) must remain unchanged unless the repository owner explicitly asks to modify them in the current task.

Production is pinned to commit `e1a25f6647d0d86de12808ecdfba07b2572a184a` for `invite.avocadoss.co.kr`, and `invite2/` is independently frozen for `invite2.avocadoss.co.kr`.

Do not propose or apply edits to either invitation's UI, styles, media, invitation-related API/data behavior, Docker configuration, or deployment workflow (`deploy.yml`, `invite2/`, Cloudflare Pages `chaewon-invite2`) as part of generic refactors, audits, repository-wide cleanups, design rollouts, migrations, dependency updates, or multi-repository tasks.

For broad tasks, skip this repository. Read-only review is allowed.

Do not change `.github/workflows/deploy.yml`, re-enable deployment on push, or change the frozen production SHA unless the owner explicitly requests an invitation change.

Follow `AGENTS.md` as the authoritative freeze policy.
