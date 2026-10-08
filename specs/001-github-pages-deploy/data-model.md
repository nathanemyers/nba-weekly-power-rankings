# Data Model: GitHub Pages Deployment

This feature introduces no runtime data. The entities below describe the deployment pipeline so
requirements can be traced to concrete artifacts.

## Site Build

The static output of `npm run build` in `dist/`.

| Field | Description | Validation |
|-------|-------------|------------|
| `index.html` | Entry page | MUST exist; all `src`/`href` URLs start with `/nba-weekly-power-rankings/` or are relative |
| `assets/*.js`, `assets/*.css` | Hashed bundles, including one chunk per season JSON | Referenced URLs resolve under the base path |
| base path | `/nba-weekly-power-rankings/` | Single source: `vite.config.ts` |

## Pages Artifact

The `dist/` directory packaged by `upload-pages-artifact` within a workflow run.

- Produced only if lint and build both succeed (FR-006).
- One artifact per workflow run; consumed by the deploy job of the same run.

## Deployment

A publication of one Pages Artifact to the `github-pages` environment.

**State transitions**:

```text
queued ──► building ──► (lint/build fail) ──► failed      [live site unchanged]
                    └──► artifact uploaded ──► deploying ──► live
                                                       └──► failed [live site unchanged]
```

- A newer queued run supersedes an older *pending* run in the `pages` concurrency group; an
  in-progress run is never cancelled.
- Triggers: push to `master`, or manual dispatch on `master`.

## Relationships

`master` commit ──1:1──► workflow run ──1:0..1──► Pages Artifact ──1:0..1──► Deployment
