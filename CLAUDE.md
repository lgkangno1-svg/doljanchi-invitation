# Live Invitation Freeze

`invite.avocadoss.co.kr` and `invite2.avocadoss.co.kr` are frozen production sites.

Approved production commit for `invite`: `e1a25f6647d0d86de12808ecdfba07b2572a184a`.
`invite2.avocadoss.co.kr` (`invite2/`) is also strictly frozen.

Do not change this repository's invitation UI, media, invitation APIs/data behavior, Docker/deployment configuration, `.github/workflows/deploy.yml`, or `invite2/` files unless the owner explicitly asks to modify that specific invitation in the current task.

Generic requests such as "fix all repositories", "audit everything", "improve all sites", "apply the new design everywhere", dependency cleanup, refactoring, migration, or automated maintenance do not authorize changes here. Skip this repository for broad multi-repository work.

The deploy workflow is deliberately manual-only and pinned to the approved SHA. Never re-enable automatic push deployment or update the pinned SHA without an explicit owner request.

Read-only inspection is allowed. Report proposed changes instead of applying them when explicit authorization is absent.

See `AGENTS.md` for the full freeze policy.
