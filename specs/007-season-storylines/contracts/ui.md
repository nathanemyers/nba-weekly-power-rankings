# Contract: storyline UI

## Data

- `SeasonDataSchema` gains `storylines: z.array(StorylineSchema).optional()`; invalid entries
  fall back to no storylines rather than failing the season (constitution: Data Validation).
- Accessors in `src/data/seasonData.ts`: season storylines (`featured`) and team storylines
  (`teams` includes the team), both sorted by `eventDate`.

## Season storylines

- Shown in the Summary tab when no single team is pinned, under a "Season storylines" heading.
- The Summary tab is available unpinned only when the season is completed and has ≥ 1 featured
  storyline (FR-001, FR-002), and is then first in the unpinned tab order.
- Each row: storyline title, article headline as a link (opens in a new tab), publisher, and
  date (FR-008). Team logos for any teams listed.

## Team storylines

- Shown in the Summary tab below `TeamSeasonSummary` when exactly one team is pinned.
- The Summary tab is available when the team has an AI summary or ≥ 1 storyline.
- Same row format, without the team logo for the pinned team.

## Empty states

- No finalized list, or season not completed: no section, no placeholder (SC-005).
