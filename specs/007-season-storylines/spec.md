# Feature Specification: Season Storylines

**Feature Branch**: `007-season-storylines`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "For completed seasons, I want to highlight some of the major storylines that took place. We will need to scrape the internet to find articles published during the season. This will involve a degree of judgement, which I as the maintainer will supply. This will probably take the form of a special tool or agent skill to gather articles from approved sources that I will review and then save to be displayed. Use events gleaned from weekly summaries to help guide finding articles. Once we have the list of articles, these will be saved as a static list and will not change."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor sees a completed season's major storylines (Priority: P1)

A visitor viewing a season that has already finished sees a curated set of the season's major storylines, each pointing to a real article about that storyline, giving them a quick sense of what happened that season beyond the raw rankings.

**Why this priority**: This is the payoff the whole feature exists for — a visitor-facing view of season storylines. Everything else (discovery, review) exists only to produce this list.

**Independent Test**: Open a completed season that has a finalized storyline list and confirm the storylines are visible, each identifiable by headline/source, without needing any other part of the feature to be exercised.

**Acceptance Scenarios**:

1. **Given** a completed season with a finalized storyline list, **When** a visitor views that season, **Then** the season's curated storyline articles are shown.
2. **Given** a completed season with no finalized storyline list yet, **When** a visitor views that season, **Then** no storyline content is shown and nothing errors.
3. **Given** a season that has not yet completed, **When** a visitor views that season, **Then** no storyline content is shown for it.

---

### User Story 2 - Maintainer discovers candidate storyline articles (Priority: P2)

The maintainer, working on a completed season, uses a dedicated tool to find candidate articles about that season's notable moments. The tool looks only at maintainer-approved sources and uses the events and topics already captured in that season's weekly summaries to guide what it looks for, producing a list of candidates for the maintainer to consider.

**Why this priority**: Without a way to discover candidates, the maintainer would have to find every article by hand. This directly enables Story 1 but is a maintainer-only capability, so it ranks below the visitor-facing payoff.

**Independent Test**: For a completed season with recorded weekly summaries, run the discovery tool and confirm it returns candidate articles drawn only from approved sources, informed by that season's weekly-summary events, without publishing anything to visitors yet.

**Acceptance Scenarios**:

1. **Given** a completed season with weekly summaries recorded, **When** the maintainer runs the discovery tool for that season, **Then** it returns a set of candidate articles sourced only from maintainer-approved sources.
2. **Given** the same discovery run, **When** candidates are produced, **Then** each candidate is tied to one or more events/topics drawn from that season's weekly summaries that motivated finding it.
3. **Given** a source that is not on the approved list, **When** the discovery tool runs, **Then** no article from that source appears among the candidates.

---

### User Story 3 - Maintainer reviews and finalizes the storyline list (Priority: P3)

The maintainer looks over the candidate articles the discovery tool found, applies their own judgment to pick the ones that genuinely represent major storylines, and saves that final selection so it becomes the static list visitors see for that season.

**Why this priority**: This closes the loop between discovery (Story 2) and the visitor-facing result (Story 1): it's the human-judgment step that turns raw candidates into a trustworthy, curated list. Ranked last because it depends on candidates already existing.

**Independent Test**: Starting from a set of candidate articles for a season, confirm the maintainer can select a subset (and exclude the rest), save that selection, and that the saved selection is what subsequently appears to visitors — independent of whatever candidates were not chosen.

**Acceptance Scenarios**:

1. **Given** a set of candidate articles for a completed season, **When** the maintainer reviews them, **Then** the maintainer can choose to include or exclude each candidate before anything is saved.
2. **Given** the maintainer has finalized their selection for a season, **When** that selection is saved, **Then** it becomes the season's storyline list shown to visitors, and excluded candidates are not shown.
3. **Given** a season's storyline list has already been finalized and saved, **When** the discovery tool is run again for that same season, **Then** the previously saved, finalized list is not altered by the new run.

---

### Edge Cases

- A completed season's weekly summaries don't point to any clear major events: discovery may return few or no strong candidates; the maintainer may finalize a short list, or choose not to finalize one yet, and visitors see no storyline content until one exists.
- No candidates come back from approved sources for a season (e.g., sparse coverage): the maintainer finalizes whatever is genuinely available, including an empty list, rather than including lower-quality or unapproved sources.
- The maintainer runs discovery more than once for the same season before finalizing (e.g., to try different guidance): only the maintainer's final saved selection matters; earlier, unsaved discovery runs have no lasting effect.
- An already-finalized season's list needs a correction later (e.g., a mistake is found): this is treated as the maintainer deliberately revising and re-saving that season's list, not as an automatic re-run — see Assumptions.
- A season is still active (not yet complete): it is excluded from both discovery and visitor-facing display until it is complete.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a curated storyline list to visitors for a completed season once that season's list has been finalized.
- **FR-002**: System MUST NOT display storyline content for a season that is not complete, or that is complete but has no finalized storyline list.
- **FR-003**: Once a season's storyline list is finalized and saved, it MUST remain static — unaffected by any later discovery runs for that or any other season.
- **FR-004**: System MUST provide the maintainer with a way to discover candidate storyline articles for a specific completed season.
- **FR-005**: Candidate discovery MUST only consider articles from sources the maintainer has approved; articles from other sources MUST NOT be offered as candidates.
- **FR-006**: Candidate discovery MUST use events or topics drawn from the target season's recorded weekly summaries to guide what it searches for.
- **FR-007**: The maintainer MUST be able to review discovered candidates and choose which ones to include before anything is finalized.
- **FR-008**: Each storyline entry shown to visitors MUST provide enough information to identify the source article it is based on (at minimum a headline and its source).
- **FR-009**: System MUST support each completed season having its own independent storyline list.

### Key Entities

- **Storyline Article**: One curated, visitor-facing entry representing a major storyline for a season; references a real article (headline, source) and the storyline it captures.
- **Approved Source**: A publisher or site the maintainer has designated as acceptable for storyline discovery; discovery is limited to this set.
- **Season Storyline List**: The finalized, static set of Storyline Articles for one completed season; does not exist until the maintainer finalizes it, and does not change afterward except through deliberate maintainer action.
- **Weekly Summary** *(existing data)*: Source of the events/topics used to guide which articles discovery looks for; not itself displayed as a storyline.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Visitors viewing any completed season with a finalized storyline list can see that season's major storylines without leaving the page.
- **SC-002**: A finalized season's storyline list stays identical across any number of later discovery runs — zero unintended changes.
- **SC-003**: For a completed season with recorded weekly summaries, the maintainer can obtain a set of candidate articles guided by that data without manually researching the season from a blank slate.
- **SC-004**: 100% of candidate and finalized storyline articles trace back to a maintainer-approved source.
- **SC-005**: Seasons without a finalized storyline list present zero errors or broken placeholders to visitors; the feature is simply absent for them.

## Assumptions

- "Completed season" uses the same definition already established for other completed-season features in this app (no further weekly data will arrive for it).
- The maintainer alone decides and maintains the set of approved sources; this spec does not define a process for proposing or approving new sources.
- Discovery is a maintainer-facing, human-in-the-loop capability: it produces candidates for review, but never publishes a storyline list to visitors on its own. Finalizing a list is always a deliberate maintainer action.
- "Static" means a finalized season's list does not change as a side effect of running discovery again (for that season or any other); if the maintainer later decides a finalized list needs correcting, that is a deliberate edit-and-re-save action by the maintainer, not an automatic update.
- There is no fixed required number of storylines per season; "major storylines" is a qualitative judgment the maintainer applies during review, and a season could end up with a small handful or, rarely, none.
- The events/topics drawn from weekly summaries are used only to steer discovery toward relevant articles; they are not displayed to visitors and need not have a strict one-to-one relationship with the final storyline articles.
- The specific UI element used to display storylines to visitors is undetermined, consistent with how other recently specified season-detail features (playoff bracket, team AI summary) also leave their presentation to be designed separately.
- This feature is scoped at the season level; storylines are not required to be tied to any single team or week.
