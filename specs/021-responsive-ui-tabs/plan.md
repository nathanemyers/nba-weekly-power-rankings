# Implementation Plan: Responsive UI and Tabbed Detail Panel

**Branch**: `UI-updates` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/021-responsive-ui-tabs/spec.md`

## Summary

This plan makes every page usable at phone, tablet, and desktop widths. It also gathers the season page's detail content (AI summary, season trends, roster, awards) into one tabbed panel below the chart.

- **Chart**: phones get a compact chart layout with logo labels.
- **Roster**: on phones, the roster drops to Player/PTS/REB/AST with names like "L. James" and a logo-only heading.
- **Other pages**: everything else gets wrapping and sizing fixes with Tailwind responsive classes.
- **Hooks**: the only new JavaScript-level responsiveness is a `useSyncExternalStore`-based `useMediaQuery` for the chart geometry. No `useEffect`, `useRef`, or `useMemo`.

## Technical Context

**Language/Version**: TypeScript 5 / React 19

**Primary Dependencies**: Vite, Tailwind CSS 4, shadcn/ui (adds the `tabs` component, built on the already-installed `radix-ui`), Redux Toolkit, React Router 8

**Storage**: N/A (tab choice is component state)

**Testing**: Vitest + Testing Library (jsdom)

**Target Platform**: Modern mobile and desktop browsers, static on GitHub Pages

**Project Type**: Single-page static web app

**Performance Goals**: No visible lag when switching tabs or crossing a breakpoint (resize or rotation)

**Constraints**: No page-level horizontal scroll from 360px to 1920px. Must follow the `AGENTS.md` code rules (no `useMemo`, minimal `useEffect`, colors only in `src/index.css`, no dynamic class names, `cursor-pointer` on clickables).

**Scale/Scope**: 3 routes. About 10 components touched, 2 new (`DetailTabs`, `useMediaQuery`), 1 generated (`ui/tabs`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Static Hosting Only | ✅ | Client-only UI changes. No backend. |
| II. Data Prepared at Build Time | ✅ | No new data and no runtime third-party calls. `build:summaries` is not run. |
| III. Base-Path-Safe Navigation | ✅ | No route changes. Logos in the compact chart use the same bundled imports as `TeamLogo`. Tab state is not navigation state. |
| IV. Respectful Data Collection | ✅ | Not affected |
| V. Simplicity | ✅ | Only addition is a shadcn component generated from the already-installed `radix-ui`. No new runtime dependency. |
| UI & Styling | ✅ | Tailwind and shadcn only. No new colors. |
| State & Data Layer | ✅ | The selected tab is purely local UI state (`useState`), which the constitution allows. Pins stay in Redux. |
| Data Validation | ✅ | No new trust-boundary input |
| Quality gates | ✅ | lint/build/test, plus a `npm run preview` base-path check of the logo images (see quickstart) |

**Post-design re-check**: still passes. The design introduced no server, store slice, or dependency.

## Project Structure

### Documentation (this feature)

```text
specs/021-responsive-ui-tabs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── detail-tabs.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── Root.tsx                          # phone padding
├── constants.ts                      # + compact chart width/height/margin
├── hooks/
│   └── useMediaQuery.ts              # NEW: useSyncExternalStore over matchMedia
├── views/
│   ├── ChartView.tsx                 # header/control row wrapping; TeamHistoryButton moves up; DetailTabs replaces ButtonGroup + panes
│   ├── TeamHistoryView.tsx           # responsive heading
│   └── PlayerHistoryView.tsx         # responsive heading/layout
├── components/
│   ├── DetailTabs.tsx                # NEW: Summary / Trends / Roster / Awards
│   ├── DetailTabs.test.tsx           # NEW: availability + default + persistence
│   ├── TeamSeasonSummary.tsx         # hover card → inline content
│   ├── RankSwings.tsx                # hover card → inline wrapping content
│   ├── RosterPane.tsx                # logo heading, short names, compact columns
│   ├── SeasonAwardsPane.tsx          # export award-group builder; drop outer section heading
│   ├── ChartControls.tsx             # wrap-friendly sizing
│   ├── TeamHistory.tsx               # season header wraps on phones
│   ├── Chart/
│   │   ├── Chart.tsx                 # compact layout switch; dot click stops propagation; tooltip width
│   │   ├── TeamLabels.tsx            # logo <image> labels in compact mode
│   │   └── useChartControls.ts       # skip defaultPrevented key events
│   ├── PlayerStats/
│   │   ├── statColumns.tsx           # compact flag; hidden sm:table-cell on non-compact
│   │   └── shortPlayerName.ts(+test) # NEW
│   └── ui/tabs.tsx                   # GENERATED via npx shadcn@latest add tabs
```

**Structure Decision**: Single existing SPA under `src/`. New files sit beside the components they serve.

## Risks

- **Logo legibility at ~22px in the compact chart.** Some icons are GIF/PNG at small sizes. Mitigation: tune the size in the quickstart pass, and fall back to a wider compact viewBox if needed.
- **Tests that query the old hover-card buttons or standalone sections** (`App.test.tsx`, `RosterPane.test.tsx`, `SeasonAwardsPane.test.tsx`) need updating to go through the tabs.
- **jsdom lacks `matchMedia`.** `useMediaQuery` must default to the wide layout so existing chart tests keep passing.

## Complexity Tracking

No constitution violations.
