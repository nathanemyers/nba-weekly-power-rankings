# Feature Specification: Convert Styling to Tailwind CSS and shadcn/ui

**Feature Branch**: `tailwind-shadcn`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "I want to convert this project to use tailwind CSS and shadcn/ui. I have never used these libraries before personally. I want to centralize theme information for easy editing later. The look and feel of this project is still in flux so it is okay to rethink layout."

## Background

Today every component carries its own styling, and the same dozen or so visual values (page background, panel background, border, primary and muted text, rise/fall/highlight accents, corner radius, spacing) are typed out by hand in each file that needs them. The page shell, the chart, the rank-swings panel, and the team summary each repeat them independently, so changing the look means finding and editing every copy.

The maintainer wants to replace this with Tailwind CSS for styling and shadcn/ui for interface controls, and to have one place that defines the look. Naming those two libraries is the point of the feature, so they appear in this spec; how they are installed and wired up is left to planning.

Two things shape the scope:

- The maintainer has not used either library before, so the result has to be easy to find one's way around, not just correct.
- The look and layout are not settled, so the conversion does not need to reproduce today's page pixel for pixel. What the site lets a visitor do must not change.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The site still does everything it did (Priority: P1)

A visitor opens the site after the conversion and can do everything they could before: pick a season, read the rankings chart, hover and pin teams, page through weeks with the buttons or arrow keys, zoom between the weekly window and the full season, read the rank-swings panel on completed seasons, and read a pinned team's summary.

**Why this priority**: A styling conversion that loses or breaks a behavior is a regression, whatever it looks like. Everything else in this spec is only worth having if this holds.

**Independent Test**: Walk through every interaction listed above on the converted site, in at least one completed and one in-progress season, and confirm each still works and the existing automated tests pass.

**Acceptance Scenarios**:

1. **Given** the converted site, **When** a visitor selects a different season, **Then** the chart, week range, and panels update for that season and any pinned team is cleared, as before.
2. **Given** the weekly window is shown, **When** the visitor uses the earlier/later controls or the left/right arrow keys, **Then** the window moves one week at a time and the controls disable at the season's ends, as before.
3. **Given** any season, **When** the visitor hovers or clicks a team on the chart or in the rank-swings panel, **Then** highlighting and pinning behave as before, and a pinned team with a summary shows that summary.
4. **Given** the chart is moving between week ranges or zoom levels, **When** the transition plays, **Then** it animates as before rather than jumping.
5. **Given** the site is served from a sub-path rather than a domain root, **When** a visitor loads it, **Then** it is fully styled and no styling or font resource fails to load.

---

### User Story 2 - Change the look from one place (Priority: P1)

The maintainer decides the panels should be a different shade, or that the accent for "rising" should be a different green, or that corners should be squarer. They open the single place where the look is defined, change one value, and every part of the site that uses it follows.

**Why this priority**: This is the stated reason for the conversion. Without it the project has swapped one styling approach for another and gained nothing.

**Independent Test**: Change one theme value (for example the panel background), reload, and confirm every panel, control, and chart element that used the old value now shows the new one, with no other file edited.

**Acceptance Scenarios**:

1. **Given** the converted project, **When** the maintainer looks for where a color, font, radius, or spacing step is defined, **Then** there is exactly one place to look, and each value has a name that says what it is for (e.g. "muted text", "panel border", "rank rising") rather than what it looks like.
2. **Given** a theme color is changed in that one place, **When** the site is reloaded, **Then** the change appears everywhere that role is used, including inside the chart, the trend minimaps, and the rank-swings panel.
3. **Given** the converted source, **When** it is searched for hand-typed color values outside the theme definition and the per-team colors, **Then** none are found.
4. **Given** the maintainer wants to try a wholly different palette, **When** they replace the values in the theme definition, **Then** no component file needs editing for the site to adopt it.

---

### User Story 3 - Controls that look and behave alike (Priority: P2)

A visitor uses the season picker, the paging buttons, and the zoom toggle. They share one visual language, show clearly which one has keyboard focus, look disabled when they are disabled, and can be operated without a mouse.

**Why this priority**: Adopting a shared component library is half of the request, and consistent, keyboard-usable controls are what a visitor actually gets from it. It ranks below the first two because the site is usable without it.

**Independent Test**: Operate every control on the page using only the keyboard, and compare their resting, hover, focus, and disabled appearances side by side.

**Acceptance Scenarios**:

1. **Given** the converted site, **When** the visitor tabs through the page, **Then** every control can be reached and shows a visible focus indicator.
2. **Given** the season picker has focus, **When** the visitor opens it and chooses a season using only the keyboard, **Then** the season changes.
3. **Given** a paging control is unavailable, **When** it is shown, **Then** it is visibly disabled and cannot be activated.
4. **Given** panels such as rank swings and the team summary, **When** they are shown together, **Then** they share the same surface, border, corner, and heading treatment.

---

### User Story 4 - Find your way around as a newcomer (Priority: P2)

The maintainer, who has not used these libraries before, comes back to the project after a few weeks and wants to restyle a panel or add a new control. A short guide in the repository tells them where the theme lives, how a theme value reaches a component, and how to bring in another ready-made control.

**Why this priority**: The maintainer is the only developer and is new to both libraries. A conversion they cannot confidently edit afterwards defeats the "easy editing later" goal.

**Independent Test**: Hand the guide to someone unfamiliar with the project and ask them to change one theme color and add one new control from the component library; they succeed using only the guide.

**Acceptance Scenarios**:

1. **Given** the converted project, **When** the maintainer reads the guide, **Then** it covers: where the theme is defined, how to change a value, how to add a new named value, how to add another library control, and where project-specific components live versus library-provided ones.
2. **Given** the converted project, **When** the maintainer opens any component, **Then** it follows the libraries' standard, documented conventions rather than project-invented abstractions, so the official documentation applies directly.
3. **Given** the project's written coding rules, **When** the maintainer reads them, **Then** they describe the new styling approach and no longer instruct anyone to use the old one.

---

### User Story 5 - A layout that holds up on small screens (Priority: P3)

A visitor opens the site on a phone or a narrow window. The header, controls, and panels arrange themselves to fit, and the page itself does not scroll sideways.

**Why this priority**: The maintainer said layout may be rethought, which makes this the natural moment to fix the page shell. It is optional polish relative to the conversion itself.

**Independent Test**: Load the site at a phone-width viewport and confirm that everything outside the chart fits the width and stays readable.

**Acceptance Scenarios**:

1. **Given** a viewport narrower than the chart, **When** the page is shown, **Then** the title, season picker, paging controls, and panels fit within the viewport, and any sideways scrolling is confined to the chart's own area.
2. **Given** a wide viewport, **When** the page is shown, **Then** content is held to a comfortable reading width rather than stretching edge to edge.

---

### Edge Cases

- Each team has its own line color. These are facts about teams, not design choices, and stay with the team definitions rather than moving into the theme.
- The chart is a drawing, not a set of boxes and text. Its axis, grid, label, and accent colors must still come from the theme even though it is drawn differently from the rest of the page.
- Some elements are colored at run time from data (a team's line, a rising or falling trend). These must keep working when the color is not known until the data is read.
- The chart's transitions are animated in script. The conversion must not replace or fight with those animations.
- Existing automated tests assert specific colors for trend direction. After conversion those tests must check the same thing against the theme's values, not against copies of them.
- A visitor with reduced-motion or high-contrast preferences set must not be worse off than today.
- No part of the old styling approach may be left behind in a half-converted state: a component is either converted or it is not shipped.

## Requirements *(mandatory)*

### Functional Requirements

**Parity**

- **FR-001**: Every visitor-facing capability present before the conversion MUST be present after it: season selection, chart reading, hover highlighting, team pinning, week paging by control and by arrow key, zoom toggling, animated transitions, the rank-swings panel, trend minimaps, the team summary, and the repository link.
- **FR-002**: The site MUST continue to work as static files served from a sub-path, with all styling and fonts bundled with the site and nothing fetched from a third party at run time.
- **FR-003**: All existing automated tests MUST pass after the conversion, updated only where they referred to styling details that have legitimately moved.

**Single styling approach**

- **FR-004**: All visual styling in the project MUST be expressed through Tailwind CSS. The previous styling library MUST be removed from the project entirely, with no component still depending on it.
- **FR-005**: Interactive controls and repeated surfaces (buttons, the season picker, panels/cards) MUST be built from shadcn/ui components rather than hand-rolled equivalents, wherever a suitable component exists.
- **FR-006**: Components taken from the library MUST be kept visibly separate from the project's own components so it is obvious which is which.

**Centralized theme**

- **FR-007**: There MUST be exactly one place in the project that defines the site's visual values: colors, typefaces, type sizes, corner radii, and any non-default spacing or shadow steps.
- **FR-008**: Theme values MUST be named for their role (e.g. page background, panel surface, border, primary text, muted text, rank rising, rank falling) so that a value can change without its name becoming wrong.
- **FR-009**: The theme MUST include the data-meaning colors the site uses today: rank rising, rank middle, and rank falling, plus the chart's axis, grid, and playoffs-marker tones. Hovered and pinned teams are shown with the primary text role and need no color of their own.
- **FR-010**: No project component MAY contain a hand-typed color value. Per-team colors, which live with the team definitions, are an exception. Library components are kept as the library provides them and are also exempt; where one shows a fixed color on this site, the project overrides it with a theme role where it is used.
- **FR-011**: Elements drawn by the chart, trend minimaps, and rank-swings panel MUST take their non-team colors from the same theme as the rest of the page, so that one edit reaches them too.
- **FR-012**: The theme MUST be structured so that an alternative palette (for example a light variant) could be added later by supplying a second set of values, without editing components. Delivering a second palette is not part of this feature.

**Look and layout**

- **FR-013**: The converted site MUST ship with a dark appearance in keeping with today's, as its only appearance.
- **FR-014**: The page layout MAY be rearranged. Any rearrangement MUST keep every element listed in FR-001 present and reachable.
- **FR-015**: Outside the chart's own area, the page MUST fit the viewport width without sideways scrolling down to phone width.
- **FR-016**: Text MUST meet WCAG 2.1 AA contrast against its background (4.5:1, or 3:1 for large text and for the boundaries of controls), and every control MUST be keyboard-operable with a visible focus indicator. Team labels that are deliberately dimmed while another team is hovered or pinned are exempt, as today.

**Maintainability**

- **FR-017**: The project MUST include a short written guide covering where the theme is, how to change or add a theme value, how to add another library component, and how project components and library components are organized.
- **FR-018**: The project's coding rules and governing principles MUST be updated to name the new styling approach in place of the old one, so that written guidance and the code agree.
- **FR-019**: The setup MUST follow each library's standard, documented conventions, avoiding custom wrappers or indirection that the official documentation would not explain.

### Key Entities

- **Theme**: The single definition of the site's look. A set of named roles, each with a value: surfaces, borders, text tones, data-meaning accents, typefaces, radii.
- **Theme role**: One named entry in the theme (e.g. "muted text"). Components refer to roles, never to raw values.
- **Team color**: A per-team identity color that belongs to the team's definition. Not part of the theme.
- **Library component**: A ready-made control or surface brought in from shadcn/ui and styled by the theme.
- **Project component**: A component specific to this site (chart, team labels, trend minimap, rank swings, team summary, repository link), composed from library components and theme roles.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the visitor-facing capabilities listed in FR-001 work on the converted site, and 100% of the existing automated tests pass.
- **SC-002**: Changing any single theme color takes one edit in one file and is reflected everywhere that role appears on the page, including inside the chart.
- **SC-003**: A search of the project's own source finds zero hand-typed color values outside the theme definition and the per-team colors. Library-provided component files are excluded from the search.
- **SC-004**: A search of the project finds zero remaining uses of the previous styling approach, and it is no longer listed among the project's dependencies.
- **SC-005**: Every control on the page can be reached and operated using the keyboard alone, with a visible focus indicator on each, and every text and background pairing other than dimmed team labels measures at least 4.5:1.
- **SC-006**: At a 375-pixel-wide viewport, no content outside the chart's own area is cut off or causes the page to scroll sideways.
- **SC-007**: A person who has used neither library can, using only the project's guide, change one theme color and add one new library component in under 15 minutes.
- **SC-008**: The total size of what a first-time visitor downloads is no more than 10% larger than before the conversion.
- **SC-009**: The site loads and is fully styled when served from a non-root path, with zero requests to any other origin.

## Assumptions

- **Dark only for now.** Today's site is dark-only and the request does not mention a light mode, so this feature ships one dark appearance and merely leaves room for a second (FR-012).
- **Full replacement.** "Convert" is taken to mean the old styling library is removed completely, not run alongside the new one.
- **Appearance may change.** Because look and feel are in flux, visual differences from today's site are acceptable and are not regressions. Behavioral differences are.
- **Starting palette.** The initial theme values are carried over from the colors in use today, consolidated where two near-identical values serve the same role.
- **Chart internals stay put.** How the chart computes and animates its drawing is out of scope; only where it gets its colors and how its surrounding frame is styled changes. Making the chart itself resize to the viewport is separate work.
- **Team colors are data.** The per-team colors remain with the team definitions and are not theme roles.
- **Icons.** The existing icon set may be kept or replaced by whatever the component library conventionally uses; this is a planning decision with no visitor-facing consequence.
- **Governance must change first.** The project constitution (Principle V) and the coding rules in `AGENTS.md` currently name the old styling library as part of the preferred stack. Both need amending (FR-018) for this feature to pass the constitution check at planning; the new libraries are a deliberate, maintainer-requested change rather than an incidental dependency.
- **Static hosting holds.** Nothing in this feature needs a server or a run-time third-party request; fonts and styles ship with the build.
