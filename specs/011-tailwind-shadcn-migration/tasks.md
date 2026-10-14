---

description: "Task list for converting styling to Tailwind CSS and shadcn/ui"
---

# Tasks: Convert Styling to Tailwind CSS and shadcn/ui

**Input**: Design documents from `/specs/011-tailwind-shadcn-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/theme-tokens.md, contracts/ui-states.md, quickstart.md

**Tests**: No new tests were requested. The existing suite is the parity check (FR-003), so tasks that migrate existing assertions are included where the contract requires them.

**Organization**: Tasks are grouped by user story. Because this is a conversion, US1 carries the bulk of the file edits; later stories build on the converted files.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Paths are relative to the repository root

## Rules for every task

- Do NOT run `npm run build:summaries` or `scripts/build-summaries.mjs`.
- Follow `AGENTS.md`: no `useMemo`, minimal `useEffect`, no `useRef` for state, comments one sentence at most, no `Map`/`Set`.
- Never build a Tailwind class name from a variable. Run-time values go in `style` or SVG attributes.
- Do not edit `src/components/Chart/useChartTransition.ts`, `src/components/Chart/utils.ts`, `src/components/RankSwings/utils.ts`, `src/data/`, `src/types/`, or `scripts/`.
- Do not change anything listed under "Preserved as-is" in `contracts/ui-states.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install Tailwind and shadcn/ui alongside styled-components, which keeps working until Phase 3 removes it.

- [X] T001 Run `npm install tailwindcss @tailwindcss/vite` to add both to `package.json`
- [X] T002 In `vite.config.ts`, import `tailwindcss` from `@tailwindcss/vite` and add `tailwindcss()` to `plugins` after the existing `react()` and `babel(...)` entries; leave `base`, `resolve.tsconfigPaths`, and `test` unchanged
- [X] T003 [P] Add `"@/*": ["./src/*"]` to `compilerOptions.paths` in `tsconfig.app.json` (keeping the existing `components/*`, `types`, `test/*` entries) and add `"compilerOptions": { "paths": { "@/*": ["./src/*"] } }` to `tsconfig.json`; do not add `baseUrl` unless T005 fails without it
- [X] T004 Create `src/index.css` containing only `@import "tailwindcss";` and add `import "./index.css";` to `src/index.tsx` above the `App` import
- [X] T005 Run `npx shadcn@latest init -b radix --no-monorepo --css-variables -y` from the repository root (flags confirmed against `init --help` on 2026-10-13; do NOT pass `-d`, whose defaults are a Next.js template and a Base UI preset); if it still prompts for a preset or style, accept the first option offered, since T008 replaces the generated palette; confirm it creates `components.json` with `@/` aliases and `src/lib/utils.ts` and writes theme variables into `src/index.css`; then run `git status` and `git diff` and revert anything outside `components.json`, `src/lib/utils.ts`, `src/index.css`, `package.json`, and `package-lock.json` (for example an added font package or edits to `index.html`); note every prompt and the answer given for use in T031; if alias detection fails, add `"baseUrl": "."` to both tsconfig files and rerun
- [X] T006 [P] In `eslint.config.js`, add a second config object for `files: ['src/components/ui/**/*.{ts,tsx}']` with `rules: { 'react-refresh/only-export-components': 'off' }`
- [X] T007 Run `npm run lint`, `npm test`, and `npm run build`; all three must pass before continuing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The theme and the library components every story uses.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Rewrite `src/index.css` so it contains, in order: `@import "tailwindcss";`, the `tw-animate-css` import if T005 added one, `@custom-variant dark (&:is(.dark *));`, a single `:root` block with `color-scheme: dark` and every color and radius variable from `contracts/theme-tokens.md` at its listed starting value (19 standard roles, 7 project roles), an `@theme inline` block exposing each color as `--color-<name>: var(--<name>)`, declaring the typeface directly as `--font-sans: system-ui, sans-serif;` (do NOT also define `--font-sans` in `:root` or reference it with `var(--font-sans)`, which would be a circular reference), and keeping the `--radius-sm/md/lg/xl` scale derived from `--radius` as T005 generated it, and an `@layer base` block setting `* { @apply border-border outline-ring/50; }` and `body { @apply bg-background text-foreground font-sans; }`; delete the generated `.dark` block, the generated `--chart-1..5` and `--sidebar-*` variables and their `@theme` entries, and any generated font variable or font import
- [X] T009 [P] In `index.html`, change `<html lang="en">` to `<html lang="en" class="dark">`
- [X] T010 Run `npx shadcn@latest add button native-select card badge toggle` and confirm `src/components/ui/button.tsx`, `native-select.tsx`, `card.tsx`, `badge.tsx`, and `toggle.tsx` exist; do not hand-edit them
- [X] T011 Run `npm run lint`, `npm test`, and `npm run build`; all three must pass (the page will look partly reset by Tailwind's base styles until Phase 3; that is expected)

**Checkpoint**: Theme and library components exist; conversion can begin.

---

## Phase 3: User Story 1 - The site still does everything it did (Priority: P1) 🎯 MVP

**Goal**: Every component is styled with Tailwind and styled-components is gone, with no change in what a visitor can do.

**Independent Test**: `npm run lint`, `npm test`, and `npm run build` pass with no test file edited, `grep -rn "styled-components" src package.json` prints nothing, and the walk-through in quickstart.md step 6 succeeds.

**Scope note**: In this phase, replace only what is inside `styled.*` blocks. Leave inline color attributes that tests assert (`fill` on team labels, `stroke` on chart dots, the three constants in `TrendMinimap.tsx`) exactly as they are; US2 handles them.

### Implementation for User Story 1

- [X] T012 [P] [US1] Convert `src/components/GitHubBadge.tsx`: remove the `styled-components` import and `Link`; render a plain `<a>` with `className={cn("inline-flex items-center text-2xl text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:text-foreground", props.className)}` using `cn` from `@/lib/utils`; keep `href`, `target`, `rel`, and `aria-label` unchanged
- [X] T013 [P] [US1] Convert `src/components/TeamSummary.tsx`: remove all `styled.*` definitions; render `<Card role="region">` from `@/components/ui/card` (Card renders a `<div>`, and tests query the panel by role `region`) carrying the existing `aria-label` and `className="mt-5"`, with `<CardContent>` inside; header row `<div className="mb-2 flex items-center justify-between gap-3">` containing `<h2 className="text-lg font-semibold">` for the team name (it must remain a heading element) and `<Badge variant="outline" className="whitespace-nowrap text-muted-foreground">AI-generated summary</Badge>` from `@/components/ui/badge`; summary text `<p className="leading-normal text-foreground-soft">`
- [X] T014 [P] [US1] Convert `src/components/RankSwings/RankSwings.tsx`: remove all `styled.*` definitions; outer panel becomes `<Card role="region">` with the existing `aria-label="Biggest rank swings"` and `className="mt-5"`, wrapping `<CardContent className="space-y-4">`; each group heading stays an `<h2>` with `className="mb-2 text-[0.95rem] font-semibold text-muted-foreground"`; the card grid is `<div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">`; each team card stays a native `<button type="button">` with the existing `aria-pressed`, `aria-label`, and `onClick`, and `className="relative flex cursor-pointer flex-col items-start gap-1.5 rounded-md border bg-background px-3 py-2.5 text-left text-foreground hover:bg-accent aria-pressed:border-muted-foreground aria-pressed:bg-accent"`; team name `<span className="pr-6 text-[0.95rem] font-semibold">`; medal `<span className="absolute right-2.5 top-2">` keeping its `title`; trend row `<span className="m-auto flex items-center gap-2.5">`; ranks `<span className="whitespace-nowrap text-sm text-foreground-soft">`; the change figure becomes `<span data-direction={rose ? "up" : "down"} className="whitespace-nowrap text-sm font-semibold data-[direction=down]:text-rank-down data-[direction=up]:text-rank-up">`, removing the `$rose` prop
- [X] T015 [P] [US1] Convert `src/components/Chart/TeamLabels.tsx`: remove the `styled-components` import, `TeamLabel`, and `PlayoffMedal`; render team names as `<text className="cursor-pointer text-[13px] transition-[fill,font-weight] duration-150" ...>` and medals as plain `<text ...>`; keep every existing attribute (`x`, `y`, `textAnchor`, `dominantBaseline`, `fontWeight`, `fill`, `fontSize`) and handler unchanged
- [X] T016 [P] [US1] Convert `src/components/Chart/Chart.tsx`: remove the `styled-components` import and all eight `styled.*` definitions; `ChartWrap` becomes `<div className="w-full" style={{ maxWidth: props.width }}>` keeping its `onClick`; `Relative` becomes `<div className="relative">`; `Svg` becomes `<svg className="block h-auto w-full select-none">` keeping `viewBox`, `role`, `aria-label`, `onMouseLeave`; `GridLine` becomes `<line className="stroke-chart-grid stroke-1">`; `Tick` becomes `<text className="fill-muted-foreground text-[13px]">`; `AxisLabel` becomes `<text className="fill-muted-foreground text-[15px]">`; the `Playoffs` group becomes a plain `<g>` whose `<line>` has `className="stroke-chart-playoffs stroke-2 [stroke-dasharray:6_4]"` and whose `<text>` has `className="fill-chart-playoffs text-[13px]"`; `Tooltip` becomes `<div className="pointer-events-none absolute max-w-80 rounded-md bg-popover/85 px-3 py-2.5 text-[0.9rem] leading-snug text-popover-foreground">` keeping its inline `style` positioning, with its `<p>` given `className="my-1"` and its `<small>` given `className="text-muted-foreground"`; replace the two `style={{ cursor: "pointer" }}` props with `className="cursor-pointer"`; leave `stroke={team.color}`, `fill={team.color}`, `strokeWidth`, `opacity`, and the dot's `stroke="#1d1d1f"` unchanged
- [X] T017 [US1] Convert `src/App.tsx` keeping today's arrangement: remove the `styled-components` import and all ten `styled.*` definitions; `Container` becomes `<main className="flex min-h-screen flex-col items-center px-4 py-8">`; `<GitHubBadge className="self-end" />`; title `<h1 className="mb-2 text-center text-[2.5rem] font-bold leading-tight">`; subtitle `<p className="mb-6 text-center text-lg text-muted-foreground">`; season row `<label className="mb-4 flex items-center gap-2.5 text-muted-foreground">` containing `<NativeSelect>` with `<NativeSelectOption>` children from `@/components/ui/native-select`, keeping `value` and the existing `onChange` body; chart column `<div className="w-full" style={{ maxWidth: CHART_WIDTH }}>`; controls row `<div className="mb-3 flex items-center justify-between">`; the three buttons become `<Button variant="outline">` from `@/components/ui/button` keeping their `onClick`, `disabled`, and text; week range `<span className="text-[0.95rem] text-muted-foreground">`; zoom row `<div className="mt-3 flex justify-center">`; leave all state, handlers, the `useEffect`, and `loadSeason` unchanged
- [X] T018 [US1] Run `grep -rn "styled" src` to confirm no import or usage remains, then run `npm uninstall styled-components`
- [X] T019 [US1] Run `npm run lint`, `npm test`, and `npm run build`; all must pass with no test file modified; if a test fails, fix the component, not the test
- [X] T020 [US1] Start the dev server and perform quickstart.md step 6 (all eight parity checks) on one completed season and the current season; fix any behavior that differs from before

**Checkpoint**: The site runs on Tailwind and shadcn/ui only, with full behavior parity.

---

## Phase 4: User Story 2 - Change the look from one place (Priority: P1)

**Goal**: No color value exists outside `src/index.css` and the team definitions, including inside the chart and minimaps.

**Independent Test**: The grep in `contracts/theme-tokens.md` shows only team-color constants and non-color strings, and the three one-edit checks in quickstart.md step 7 each change the page without touching another file.

### Implementation for User Story 2

- [X] T021 [P] [US2] In `src/components/Chart/TeamLabels.tsx`, remove the `fill` attribute from team-name `<text>` elements; add `data-state={active ? "active" : anyActive ? "dimmed" : "idle"}` and append `data-[state=active]:fill-foreground data-[state=dimmed]:fill-dim data-[state=idle]:fill-foreground-soft` to its `className`; keep `fontWeight` as an attribute
- [X] T022 [P] [US2] In `src/components/Chart/Chart.tsx`, replace `stroke="#1d1d1f"` on the active-team `<circle>` with `stroke-background` added to its `className`
- [X] T023 [P] [US2] In `src/components/TrendMinimap/TrendMinimap.tsx`, delete `TOP_COLOR`, `MIDDLE_COLOR`, and `BOTTOM_COLOR`; on the four `<stop>` elements remove `stopColor` and add, in order, `data-band="top"` with `className="[stop-color:var(--color-rank-up)]"`, `data-band="middle"` with `className="[stop-color:var(--color-rank-mid)]"`, `data-band="middle"` with the same middle class, and `data-band="bottom"` with `className="[stop-color:var(--color-rank-down)]"`; keep the offsets unchanged
- [X] T024 [P] [US2] In `src/components/TrendMinimap/TrendMinimap.test.tsx`, change the assertion that the stops' `stop-color` values are `#30D158`, `#FFD60A`, `#FFD60A`, `#FF453A` to assert their `data-band` attributes are `top`, `middle`, `middle`, `bottom`; change nothing else
- [X] T025 [US2] In `src/components/Chart/Chart.test.tsx` and `src/App.test.tsx`, replace every team-label `toHaveAttribute("fill", …)` assertion per the "Test migration" table in `contracts/ui-states.md` (`#f5f5f7` → `data-state` `active`, `#5c5c63` → `dimmed`, `#d1d1d6` → `idle`); leave `font-weight`, `y`, `stroke-width`, `opacity`, `aria-pressed`, and team-color assertions unchanged
- [X] T026 [US2] Run the verification grep from `contracts/theme-tokens.md`, and also `grep -rnE "(bg|text|border|fill|stroke|ring)-(zinc|neutral|gray|slate|stone|red|green|yellow|blue|white|black)(-|\b)" src --include='*.tsx' --exclude-dir=ui`; replace any remaining literal or palette class in project components with a theme role (generated files under `src/components/ui/` are exempt per rule 2 of the contract and are not edited)
- [X] T027 [US2] Run `npm run lint`, `npm test`, and `npm run build`, then perform quickstart.md step 7 (change `--card`, `--rank-up`, and `--chart-grid` in `src/index.css`, confirm each reaches panels, swing figures and minimaps, and grid lines respectively, then revert)

**Checkpoint**: One edit in `src/index.css` restyles the whole site, chart included.

---

## Phase 5: User Story 3 - Controls that look and behave alike (Priority: P2)

**Goal**: Every control comes from the component library, shows focus, and works from the keyboard.

**Independent Test**: quickstart.md step 8: Tab reaches every control with a visible ring, the season picker changes by keyboard, and Space or Enter presses a swing card.

### Implementation for User Story 3

- [X] T028 [US3] In `src/components/RankSwings/RankSwings.tsx`, replace each team card's native `<button>` with `<Toggle>` from `@/components/ui/toggle`, passing `pressed={pressed}`, `onPressedChange={() => props.onClick(swing.team.teamId)}`, and the existing `aria-label`; pass `variant="outline"` and `className="relative flex h-auto flex-col items-start gap-1.5 whitespace-normal bg-background px-3 py-2.5 text-left data-[state=on]:border-muted-foreground data-[state=on]:bg-accent"`; confirm the rendered element is still a `button` with `aria-pressed`, and do not edit `src/components/ui/toggle.tsx`
- [X] T029 [P] [US3] In `src/components/GitHubBadge.tsx`, add `rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50` to the link's classes so it shows the same focus ring as library controls
- [X] T030 [US3] Run `npm run lint`, `npm test`, and `npm run build` (the rank-swing tests in `src/App.test.tsx` must pass unmodified), then perform quickstart.md step 8 and confirm US3 acceptance scenarios 1–4 in spec.md, including that disabled paging buttons look disabled and that the two panels share surface, border, radius, and heading treatment; then check FR-016 contrast (WCAG 2.1 AA) for each text/background pair in use: `foreground`, `foreground-soft`, and `muted-foreground` on `background`, on `card`, and on `accent`; `popover-foreground` on `popover`; `rank-up` and `rank-down` on `background`; each must be at least 4.5:1, and `ring` and `border` on `background` at least 3:1 where they are the only indicator of a control; adjust the value in `src/index.css` for any pair that fails (dimmed team labels using `dim` are exempt per FR-016)

**Checkpoint**: All controls are library components with consistent states.

---

## Phase 6: User Story 4 - Find your way around as a newcomer (Priority: P2)

**Goal**: A maintainer new to both libraries can change the theme and add a component from the repository's own guide.

**Independent Test**: quickstart.md step 10: using only `docs/styling.md`, change one theme color and add one library component in under 15 minutes.

### Implementation for User Story 4

- [X] T031 [P] [US4] Create `docs/styling.md` with these sections: (1) the two libraries in two sentences each and links to their docs; (2) "The theme": it is `src/index.css`, how a `:root` variable becomes a utility through `@theme inline`, a table of the roles copied from `contracts/theme-tokens.md`; (3) "Change a value" with a worked example; (4) "Add a role": one line in `:root`, one in `@theme inline`, then use it; (5) "Add a library component": `npx shadcn@latest add <name>`, where it lands, and that generated files are restyled with `className` at the call site rather than edited; (6) "Where things live": `src/components/ui/` versus `src/components/`; (7) "Rules": no color literals outside the theme and team definitions, never construct class names from variables, run-time values go in `style` or SVG attributes, state-dependent color uses `data-*` attributes; (8) "Adding a light palette later" per research.md §5; (9) "How this was set up": the `shadcn init` answers recorded in T005 and whether `baseUrl` was needed
- [X] T032 [P] [US4] In `README.md`, add a "Styling" section after "Setup" with one sentence naming Tailwind CSS and shadcn/ui and a link to `docs/styling.md`
- [X] T033 [P] [US4] In `AGENTS.md` under "Code Generation Rules", add: style with Tailwind utility classes; define colors, fonts, and radii only in `src/index.css`; no color literals in components except per-team colors; add shadcn/ui components with the CLI into `src/components/ui/` and do not hand-roll an equivalent; never build class names from variables; see `docs/styling.md`
- [X] T034 [US4] Follow `docs/styling.md` literally to perform quickstart.md step 10 (change a color; run `npx shadcn@latest add separator`), correct any step in the guide that was unclear or wrong, then revert the color and delete `src/components/ui/separator.tsx` if unused

**Checkpoint**: Written guidance matches the code.

---

## Phase 7: User Story 5 - A layout that holds up on small screens (Priority: P3)

**Goal**: The page shell fits a phone-width viewport and gathers the view controls in one place.

**Independent Test**: quickstart.md step 9: at 375 px wide nothing is cut off and the page does not scroll sideways.

### Implementation for User Story 5

- [X] T035 [US5] Rearrange the JSX in `src/App.tsx` per research.md §17 without changing state or handlers: `<main className="mx-auto flex min-h-screen w-full flex-col gap-4 px-4 py-8" style={{ maxWidth: CHART_WIDTH + 32 }}>`; a header `<header className="flex items-start justify-between gap-4">` with the title (`text-2xl sm:text-4xl`, left-aligned) and subtitle on the left and `<GitHubBadge />` on the right; a toolbar `<div className="flex flex-wrap items-center justify-between gap-3">` containing the season label and picker, a group with Earlier, the week range, and Later, and the zoom button (rendered only when `canZoom`, as today); then the chart, `RankSwings`, and `TeamSummary`; remove the now-unused separate zoom row
- [X] T036 [US5] Run `npm test` (queries are by role and name, so the move must not break them), then check the page at 375 px and at a wide desktop width per quickstart.md step 9 and spec.md US5 scenarios 1–2; fix any overflow

**Checkpoint**: All five stories are complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across stories.

- [X] T037 [P] Remove anything unused that setup generated: confirm `package.json` has no `styled-components`, delete unused imports, and remove any library component file under `src/components/ui/` that nothing imports
- [X] T038 Run `npm run build` and add the gzip sizes of the emitted script and stylesheet; confirm the total is ≤ 801 kB (baseline 728.63 kB) per quickstart.md step 4
- [X] T039 Run `npm run preview`, open the site under `/nba-weekly-power-rankings/`, and confirm it is fully styled with only same-origin requests and no 404s per quickstart.md step 5
- [X] T040 Run quickstart.md steps 1–3 as the final gate (`npm run lint`, `npm test`, `npm run build`, the styled-components grep, the color-literal grep) and record any deviation in `specs/011-tailwind-shadcn-migration/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: needs Setup; blocks every story
- **US1 (Phase 3)**: needs Foundational
- **US2 (Phase 4)**: needs US1 (edits the files US1 converted)
- **US3 (Phase 5)**: needs US1; independent of US2
- **US4 (Phase 6)**: needs US1 and US2 so the guide describes the finished rules; T033 can be written any time after Foundational
- **US5 (Phase 7)**: needs US1 (rearranges the converted `App.tsx`); independent of US2–US4
- **Polish (Phase 8)**: needs every story being shipped

### Within phases

- T001 → T002; T004 → T005; T003 before T005; T007 last in Setup
- T008 after T005; T010 after T008; T011 last in Foundational
- T012–T016 are independent files; T017 after T010; T018 after T012–T017; T019 → T020
- T021 and T022 touch different files; T025 after T021; T024 after T023; T026 → T027
- T028 after T014; T034 after T031; T036 after T035

### Parallel Opportunities

- Setup: T003 and T006 alongside T001–T002
- Foundational: T009 alongside T008
- US1: T012, T013, T014, T015, T016 together
- US2: T021, T022, T023 together, then T024
- US4: T031, T032, T033 together
- After US1: US3 and US5 can proceed alongside US2

---

## Parallel Example: User Story 1

```bash
Task: "Convert src/components/GitHubBadge.tsx"            # T012
Task: "Convert src/components/TeamSummary.tsx"            # T013
Task: "Convert src/components/RankSwings/RankSwings.tsx"  # T014
Task: "Convert src/components/Chart/TeamLabels.tsx"       # T015
Task: "Convert src/components/Chart/Chart.tsx"            # T016
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational
3. Phase 3: US1
4. **Stop and validate**: gates pass, no test edited, parity walk-through clean
5. Deployable: the site is on the new stack and behaves as before

### Incremental Delivery

1. Setup + Foundational → both libraries installed, theme defined
2. US1 → converted with parity (MVP)
3. US2 → theme is the single source of color
4. US3 → all controls from the library, keyboard-checked
5. US4 → guide and coding rules
6. US5 → new page layout
7. Polish → size, sub-path, final gates

Each step leaves `npm run lint`, `npm test`, and `npm run build` passing.

---

## Notes

- Class strings in tasks are the starting point; adjust spacing or size utilities for appearance, but keep every color a theme role.
- If a preserved attribute or role in `contracts/ui-states.md` would have to change to make something work, stop and raise it rather than editing the test.
- Commit after each task or logical group.
