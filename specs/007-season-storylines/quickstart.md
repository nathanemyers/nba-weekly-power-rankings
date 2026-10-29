# Quickstart: Season Storylines

Validation scenarios for the feature. Shapes and rules live in [data-model.md](data-model.md)
and [contracts/](contracts/); this guide only says how to prove they hold.

## Prerequisites

- `npm install` done; a Claude Code session in the repo (for the skill scenarios).
- `scripts/storylines/sources.json` and `scripts/storylines/draft-dates.json` present.

## 1. Validator rules (no network)

```bash
npm test -- scripts/storylines
```

Expected: tests cover each rule in [validator-cli.md](contracts/validator-cli.md): unapproved
domain and excluded path rejected, out-of-window `eventDate` rejected (2025-06-26 draft is in
2024-25; 2025-06-27 is not), trade with `blockbuster` but not `featured` rejected, missing
playoff-run storyline blocks `--finalize`, existing processed file blocks `--finalize` without
`--revise`.

## 2. Discovery for one season (US2)

In Claude Code: `/season-storylines 2024-25 discover`

Expected:
- `data/raw/storylines/2024-25.json` created with guidance topics from weekly blurbs, playoffs,
  awards, retrospectives, and the 2025 lottery/draft.
- Every candidate URL is from `sources.json`; every candidate has guidance IDs.
- `npm run check:storylines -- 2024-25` passes.
- Nothing under `data/processed/storylines/` is created.

## 3. Review and finalize (US3)

`/season-storylines 2024-25 review`, decide each batch, then `/season-storylines 2024-25 finalize`.

Expected: `data/processed/storylines/2024-25.json` contains only included candidates;
`npm run build:rankings` adds `storylines` to `data/processed/seasons/2024-25.json`; every
2024-25 playoff team (e.g. `ind`, `okc`) has a playoff-run storyline.

## 4. Static after finalize (FR-003, SC-002)

```bash
sha1sum data/processed/storylines/2024-25.json
```

Run `/season-storylines 2024-25 discover` again, then re-run `sha1sum`. Expected: identical hash.
`npm run check:storylines -- 2024-25 --finalize` exits 1 with an "already finalized" message.

## 5. Visitor display (US1)

```bash
npm run dev
```

- 2024-25, nothing pinned: "Storylines" tab is first and lists featured storylines (e.g. the
  Dončić trade) with headline link, publisher, date.
- Pin Mavericks only: Summary tab shows the AI summary then team storylines, including the
  Dončić trade.
- A completed season with no processed storylines file (e.g. 2017-18): no Storylines tab, no
  empty section, no console errors.
- The active season: no Storylines tab.

## 6. Gates

```bash
npm run lint
```

```bash
npm run build
```

```bash
npm test
```

All pass. `npm run preview` under the configured base path shows the Storylines tab (no new
fetches: storylines ship inside the existing season JSON).
