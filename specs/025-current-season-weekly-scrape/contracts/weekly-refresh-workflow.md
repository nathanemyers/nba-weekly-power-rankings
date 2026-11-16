# Contract: `.github/workflows/weekly-refresh.yml`

## Triggers

- `schedule`: `0 15 * * 2,5` (Tuesday and Friday, 15:00 UTC).
- `workflow_dispatch`: no inputs. Behaves the same as a scheduled run (FR-010).

## Settings

- `concurrency: { group: weekly-refresh, cancel-in-progress: false }`: runs queue instead of overlapping (FR-017).
- `permissions: { contents: write, pull-requests: write, actions: write }`.
- No secrets beyond the built-in `GITHUB_TOKEN`. There's no `ANTHROPIC_API_KEY` (FR-015).

## Job steps

| # | Step | On failure |
|---|---|---|
| 1 | Check out `master`, set up Node 22, `npm ci` | Job fails. Nothing pushed. |
| 2 | `npm run refresh:current` (see [refresh-command.md](refresh-command.md)) | Job fails. Nothing pushed (FR-014). |
| 3 | If `changed=false`, stop with success | n/a |
| 4 | Commit `data/` to branch `data/weekly-refresh` (created from `master`, force-pushed) as `github-actions[bot]`, with message `Refresh <season> power rankings (week <weeks>)` | Job fails. |
| 5 | If no pull request from `data/weekly-refresh` to `master` is open, open one. Otherwise the push in step 4 has already updated it. Title as the commit; body lists the new weeks and the run link, and says that AI summaries and storylines are not updated. | Job fails. |
| 6 | `npm run lint`, `npm test`, `npm run build` | Comment on the pull request with the run link, leave it open and unmerged, and fail the job (FR-016). |
| 7 | `gh pr merge --merge --delete-branch` | Job fails. The pull request stays open. |
| 8 | `gh workflow run deploy.yml --ref master` | Job fails. Data is merged but not deployed; the next push or a manual deploy publishes it. |

## Behavior the maintainer can see

- A failed run shows as a red scheduled run, and GitHub emails the maintainer about scheduled-run failures.
- A published refresh shows as a merged pull request from `data/weekly-refresh`, followed by a Deploy run.
- A run with nothing new shows as a green run with no pull request.
