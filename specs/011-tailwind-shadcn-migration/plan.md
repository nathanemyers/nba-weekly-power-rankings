# Implementation Plan: Convert Styling to Tailwind CSS and shadcn/ui

**Branch**: `tailwind-shadcn` | **Date**: 2026-10-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-tailwind-shadcn-migration/spec.md`

## Summary

Replace styled-components with Tailwind CSS v4 and shadcn/ui across the whole app, with every color, font, and radius defined once in `src/index.css` under purpose-based names. Library components (`button`, `native-select`, `card`, `badge`, `toggle`) replace the hand-rolled controls and panels; the chart and minimaps keep their drawing and animation code and take their non-team colors from the same theme through `fill-*`/`stroke-*` utilities. State-dependent colors move from hex literals to `data-*` attributes, which is also what the tests assert afterwards. The page shell is rearranged into a header and a single wrapping toolbar. A short guide and updated coding rules make the result editable by a maintainer new to both libraries.

## Technical Context

**Language/Version**: TypeScript ~6.0, React 19.2 (React Compiler enabled via Babel preset)

**Primary Dependencies**: Vite 8. Added: `tailwindcss` v4, `@tailwindcss/vite`, and what `shadcn init` and the five components install (`class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, Radix primitives, `lucide-react`). Removed: `styled-components`. Kept: Font Awesome (GitHub mark), `lodash`.

**Storage**: N/A

**Testing**: Vitest 5 with jsdom and Testing Library (`npm test`)

**Target Platform**: Evergreen browsers; static files on GitHub Pages under `/nba-weekly-power-rankings/`

**Project Type**: Single-page web app, frontend only

**Performance Goals**: First-visit download ≤ 801 kB gzip (baseline 728.63 kB + 10%); chart transitions remain smooth

**Constraints**: No backend; no run-time third-party requests; fonts and styles bundled; behavior parity with today; one theme file

**Scale/Scope**: 7 component files to convert, 3 test files with a handful of color assertions to migrate, 5 library components to add, 1 guide to write

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against constitution v1.2.0.

| Principle / gate | Status | Notes |
| --- | --- | --- |
| I. Static Hosting Only | Pass | Build-time CSS and client components only. No server, headers, or secrets. |
| II. Data Is Prepared at Build Time | Pass | No data changes. No run-time fetches added; system font stack means no font requests at all. |
| III. Base-Path-Safe Navigation | Pass | The stylesheet is emitted by Vite under the configured `base`. Verified by quickstart step 5. |
| IV. Respectful, Offline Data Collection | Pass | No scraping or data scripts touched. `build:summaries` is not run. |
| V. Simplicity | Pass | Tailwind CSS and shadcn/ui are the named stack as of v1.2.0. One runtime dependency is removed. Transitive additions are those the named stack requires; Font Awesome is kept rather than adding a second brand-icon source. |
| UI & Styling constraint | Pass | All UI moves to Tailwind and shadcn/ui; styled-components is removed entirely. |
| Quality gates | Planned | `npm run lint`, `npm run build`, `npm test` in quickstart step 1; `npm run preview` under the non-root base in step 5. |
| No backend / no runtime third-party calls | Pass | Confirmed above. |

**Post-design re-check**: Pass. The design adds no principle risk beyond the above. One note: `shadcn` is invoked through `npx` at development time only and is not added as a dependency.

No violations, so Complexity Tracking is omitted.

## Project Structure

### Documentation (this feature)

```text
specs/011-tailwind-shadcn-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── theme-tokens.md
│   └── ui-states.md
├── checklists/
│   └── requirements.md
└── tasks.md              # created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html                      # add class="dark" to <html>
components.json                 # new: shadcn CLI config
vite.config.ts                  # add the Tailwind plugin
tsconfig.json                   # add "@/*" path
tsconfig.app.json               # add "@/*" path
eslint.config.js                # relax react-refresh rule for src/components/ui
package.json                    # add Tailwind + shadcn deps, remove styled-components
AGENTS.md                       # add styling rules
README.md                       # link to the guide
docs/
└── styling.md                  # new: newcomer guide
src/
├── index.css                   # new: Tailwind import + THE theme
├── index.tsx                   # import "./index.css"
├── App.tsx                     # page shell: header, toolbar, column
├── App.test.tsx                # migrate label-color assertions
├── lib/
│   └── utils.ts                # new: cn() helper (from shadcn init)
└── components/
    ├── ui/                     # new: library components
    │   ├── button.tsx
    │   ├── native-select.tsx
    │   ├── card.tsx
    │   ├── badge.tsx
    │   └── toggle.tsx
    ├── GitHubBadge.tsx
    ├── TeamSummary.tsx
    ├── Chart/
    │   ├── Chart.tsx
    │   ├── Chart.test.tsx      # migrate label-color assertions
    │   └── TeamLabels.tsx
    ├── RankSwings/
    │   └── RankSwings.tsx
    └── TrendMinimap/
        ├── TrendMinimap.tsx
        └── TrendMinimap.test.tsx   # migrate stop-color assertion
```

**Structure Decision**: The existing single-project layout stays. Library components go in `src/components/ui/` (shadcn's default), which keeps them visibly apart from project components in `src/components/` (FR-006). The theme is `src/index.css` and nothing else (FR-007). `useChartTransition.ts`, `Chart/utils.ts`, `RankSwings/utils.ts`, `src/data/`, `src/types/`, and `scripts/` are not modified.

## Design Decisions

Full reasoning and rejected alternatives are in [research.md](research.md). The ones that shape the work:

1. **One theme file.** `src/index.css` holds a single `:root` block of named variables and an `@theme inline` block exposing them. Roles are listed in [contracts/theme-tokens.md](contracts/theme-tokens.md).
2. **Dark only, structured for more.** Dark values sit in `:root`; `<html class="dark">` keeps library components' dark variants active.
3. **Standard shadcn setup.** `npx shadcn@latest init -b radix --no-monorepo --css-variables -y`, `@/*` alias added alongside the existing aliases, generated palette replaced with this project's roles.
4. **Native select for seasons.** Keeps browser keyboard and mobile behavior and the existing test queries.
5. **SVG follows the theme through utilities.** `fill-*` and `stroke-*` on chart elements; arbitrary `stop-color` properties on gradient stops; team colors stay inline.
6. **State as attributes.** `data-state`, `data-direction`, `data-band` drive state-dependent color and are what tests assert. See [contracts/ui-states.md](contracts/ui-states.md).
7. **Animation untouched.** `useChartTransition` and all interpolation are out of scope.
8. **Layout.** Header row, one wrapping toolbar with every view control, then chart and panels in a width-capped column. The chart keeps scaling to its container.

## Implementation Order

Mirrors the phases in [tasks.md](tasks.md). Each step leaves `npm run lint`, `npm test`, and `npm run build` passing.

1. **Setup.** Install Tailwind and its Vite plugin; add the `@/*` alias; create `src/index.css` and import it; run `shadcn init`; add the ESLint override. styled-components is still present and working.
2. **Foundational.** Replace the generated palette with the contract's roles; set `class="dark"`; move body background, text, and font into the base layer; add `button`, `native-select`, `card`, `badge`, `toggle`.
3. **US1, parity.** Convert `GitHubBadge`, `TeamSummary`, `RankSwings`, `TeamLabels`, `Chart`, and `App` off styled-components, keeping today's page arrangement and leaving the inline color attributes that tests assert. Uninstall `styled-components`. No test file is edited in this step.
4. **US2, single theme.** Move the remaining inline colors (team-label fill, chart-dot outline, trend-minimap stops) to theme roles driven by `data-*` attributes, and migrate the matching assertions in `TrendMinimap.test.tsx`, `Chart.test.tsx`, and `App.test.tsx`.
5. **US3, controls.** Swap the rank-swing cards to `toggle`, give the GitHub link the shared focus ring, and check keyboard operation and contrast.
6. **US4, guidance.** `docs/styling.md`, the `README.md` link, and `AGENTS.md` styling rules.
7. **US5, layout.** Rearrange `App.tsx` into the header and wrapping toolbar.
8. **Polish.** Run [quickstart.md](quickstart.md) end to end, including bundle size and the non-root preview.

## Risks

| Risk | Mitigation |
| --- | --- |
| shadcn CLI's alias detection wants `baseUrl`, which TypeScript 6 deprecates | Try `paths` alone first; add `baseUrl` only if init fails, and note it in the guide. |
| `shadcn init` still prompts, or changes more than its own files | Flags were checked against `init --help`; accept the first option for any remaining prompt, review the diff, revert anything unrelated, and record the answers in `docs/styling.md`. |
| Tailwind's base reset changes an element nobody restyled | Every styled element is rewritten in steps 4–6; the parity walk-through in quickstart step 6 covers the rest. |
| A class name built from a variable is silently not generated | Rule in `AGENTS.md` and the guide: dynamic values go in `style` or SVG attributes, never in constructed class names. |
| Toggle's default sizing fights the swing card's layout | Override with `className` at the call site; do not edit the generated file. |
| Bundle grows past the 10% allowance | Measured in quickstart step 4; headroom is about 72 kB gzip against an expected near-zero net change. |
