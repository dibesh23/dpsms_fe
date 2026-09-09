# Delivery and release process

Open feature PRs against `staging`. The protected checks are `lint`, `type-check`, `tests`, `npm-audit`, and `contract-review`. API or shared type changes must either declare that the frontend/backend contract is unchanged or link the counterpart PR in `DP-SMS-BACKEND`.

Promote a tested release with a PR from `staging` to `main`. Use Conventional Commit PR titles. Merging to `main` creates or updates a Release Please PR; merging that release PR creates the `frontend-v*` tag and GitHub release.

For one-time setup, create `staging`, add a `REPOSITORY_ADMIN_TOKEN` Actions secret containing a fine-grained token with repository Administration write permission, and run `Configure repository governance`. The token can then be removed. Add `RELEASE_PLEASE_TOKEN`, a fine-grained token with Contents and Pull requests write access, because organization policy may prevent write-capable `GITHUB_TOKEN` workflows.

Coordinate contract releases so the backward-compatible backend change is deployed before the frontend begins using it. Link both PRs and record the rollout order in their contract notes.
