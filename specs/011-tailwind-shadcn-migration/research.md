# Research: Convert Styling to Tailwind CSS and shadcn/ui

**Date**: 2026-10-13

Sources: the shadcn/ui Vite installation, theming, and Native Select docs (read 2026-10-13), and the current repository. Baseline measurements were taken on `tailwind-shadcn` at `841a0de`.

## 1. Baseline

- `npm run build` today emits one script: **2,469.15 kB, 728.63 kB gzip**, plus a 0.36 kB gzip `index.html`. There is no stylesheet. Nearly all of the script is bundled season data.
- SC-008 allows 10% growth, so the converted build's script plus stylesheet must total **≤ 801 kB gzip**.
- Styling lives in 6 files (`App.tsx`, `Chart.tsx`, `TeamLabels.tsx`, `RankSwings.tsx`, `TeamSummary.tsx`, `GitHubBadge.tsx`) via `styled-components`. `TrendMinimap.tsx` has hard-coded colors but no styled-components.
- 14 distinct non-team color values are in use, several repeated across 3–4 files.

## 2. Tailwind version and integration

- **Decision**: Tailwind CSS v4 through the `@tailwindcss/vite` plugin, with a single stylesheet `src/index.css` beginning `@import "tailwindcss";`, imported once from `src/index.tsx`.
- **Rationale**: This is what the shadcn/ui Vite guide prescribes. v4 has no `tailwind.config.js`; configuration is CSS, which is what makes a one-file theme possible (FR-007).
- **Alternatives considered**: Tailwind v3 with a JS config (splits the theme across a JS config and a CSS file; no longer the documented path). PostCSS plugin instead of the Vite plugin (extra config file for no gain).

## 3. Where the theme lives

- **Decision**: `src/index.css` is the only theme file. It holds, in order: the Tailwind import, the dark-variant line, one `:root` block of named CSS variables with their values, and one `@theme inline` block that exposes each color to Tailwind as `--color-<name>`, derives the radius scale, and declares `--font-sans` directly.
- **Rationale**: This is shadcn/ui's standard layout, so the official theming docs describe this project's file exactly (FR-019). Editing a value in `:root` changes every utility that uses it, including utilities applied to SVG elements (FR-011).
- **Alternatives considered**: A TypeScript theme object consumed by components (a second source of truth, and unusable by shadcn components). Tailwind's built-in palette classes like `bg-zinc-800` directly in components (names describe appearance, not role, violating FR-008).

## 4. Color format

- **Decision**: Write values as hex, carried over from today's colors.
- **Rationale**: The maintainer already knows these values and hex is the easiest format to hand-edit. Tailwind v4 opacity modifiers (`bg-popover/85`) work with hex.
- **Alternatives considered**: `oklch()`, which shadcn's generated themes use. Better for deriving palettes, harder to read and edit by hand. Either format can be mixed later without touching components.

## 5. Dark-only appearance with room for a second palette

- **Decision**: Put the dark values in the single `:root` block, and set `class="dark"` on `<html>` in `index.html` so that shadcn components' built-in `dark:` variants are active. Keep `@custom-variant dark (&:is(.dark *));`. Add `color-scheme: dark` to `:root`.
- **Rationale**: shadcn components ship classes like `dark:bg-input/30`; without the `dark` class they would render their light-tuned variants on a dark palette. One block of values keeps FR-007 and FR-013. A light palette later means moving the current values under `.dark`, writing light values in `:root`, and toggling the class: no component edits (FR-012).
- **Alternatives considered**: Keeping shadcn's generated light `:root` plus `.dark` (maintains a palette nobody can see). Dropping the `dark` class (subtly wrong component styling).

## 6. Theme roles

- **Decision**: Use shadcn's standard role names for everything they cover, and add project roles only for data meaning and the chart. The full list and today's-value mapping is in [contracts/theme-tokens.md](contracts/theme-tokens.md). Drop the generated `--chart-1..5` and `--sidebar-*` variables, which nothing here uses.
- **Contrast**: FR-016 sets WCAG 2.1 AA. `--dim` on `--background` is about 2.5:1 and is exempt as a deliberate de-emphasis; every other text pairing is checked during US3 and its value adjusted if it falls short.
- **Rationale**: Standard names mean shadcn components work unmodified. The 14 existing values collapse to 12 roles: `#ffffff` (GitHub hover) folds into `foreground`, and the hover/border shade `#3a3a3c` serves `border`, `input`, and `accent`.
- **Alternatives considered**: Inventing project-specific names for everything (breaks library components). Reusing `destructive` for "rank falling" (wrong meaning; it would change if error styling ever changed).

## 7. shadcn/ui setup

- **Decision**: Run `npx shadcn@latest init -b radix --no-monorepo --css-variables -y` in the existing project, then replace the generated palette with this project's roles. The CLI's `--help` (checked 2026-10-13) shows no base-color flag, a `-b` choice of `base`, `radix`, or `aria`, and a `-d` shortcut that means a Next.js template with a Base UI preset, so `-d` is not used and Radix is requested explicitly. Components are added with `npx shadcn@latest add <name>` into `src/components/ui/`.
- **Rationale**: Radix is the base most existing shadcn/ui documentation and examples assume, which matters most for a maintainer new to the library. Whatever preset or style the CLI applies only affects the generated palette, which is replaced.
- **Open detail to confirm during implementation**: whether a preset prompt still appears with these flags. Record the answers actually given in `docs/styling.md`, and review the diff, since init may add a font package or touch files beyond its own.
- **Alternatives considered**: `shadcn create` presets (designed for new projects; would scaffold over this one). Hand-copying component source from the docs (skips `components.json`, so later `add` commands would not work).

## 8. Import alias

- **Decision**: Add `"@/*": ["./src/*"]` to `paths` in both `tsconfig.json` and `tsconfig.app.json`. Leave the existing `components/*`, `types`, and `test/*` aliases in place. No `resolve.alias` entry in `vite.config.ts`.
- **Rationale**: shadcn's CLI and every generated component import from `@/components/ui/...` and `@/lib/utils`. Vite is already configured with `resolve.tsconfigPaths: true`, so the tsconfig entry is enough.
- **Risk**: The shadcn guide also says to set `baseUrl: "."`. This project is on TypeScript 6, where `baseUrl` is deprecated and `paths` resolves without it. Try without first; add `baseUrl` only if the CLI refuses to detect the alias.
- **Alternatives considered**: Pointing `components.json` aliases at the existing bare `components/*` alias (non-standard; generated imports of `@/lib/utils` would still need rewriting).

## 9. Which library components

| Need | Component | Why |
| --- | --- | --- |
| Earlier / Later / Zoom | `button` (`variant="outline"`) | Direct replacement for the hand-rolled button. |
| Season picker | `native-select` | Renders a real `<select>`, so keyboard and mobile behavior are the browser's, and the existing tests' `getByRole("combobox")` + `selectOptions` keep working. |
| Rank swings and team summary panels | `card` | Shared surface, border, radius, heading (US3 scenario 4). |
| "AI-generated summary" pill | `badge` (`variant="outline"`) | Direct replacement. |
| Rank-swing team cards | `toggle` | They are pressed/unpressed buttons today (`aria-pressed`); Toggle renders exactly that and exposes `data-state="on"` for styling. |

- **Alternatives considered**: `select` (Radix popover listbox) for the season picker: needs pointer-capture and scroll polyfills under jsdom, breaks `selectOptions` in tests, and is worse than the native picker on phones. `tooltip` for the chart tooltip: it anchors to a trigger element, whereas the chart's tooltip follows the pointer across an SVG; keep the project's own positioned element and style it with theme utilities (`bg-popover/85`). `toggle-group` for swings: the pinning rule (at most one, shared with the chart) already lives in `App`.

## 10. Theming things drawn in SVG

- **Decision**: Color SVG elements with Tailwind's `fill-*` and `stroke-*` utilities bound to theme roles (`fill-muted-foreground`, `stroke-chart-grid`). For gradient stops, which have no utility, use an arbitrary property bound to the same variable: `[stop-color:var(--color-rank-up)]`. Per-team colors stay as inline `stroke`/`fill` attributes from the team definition.
- **Rationale**: CSS properties beat SVG presentation attributes and read CSS variables, so the chart follows the theme with no JavaScript copy of the palette (FR-010, FR-011).
- **Alternatives considered**: Reading variables with `getComputedStyle` at render (needs an effect; AGENTS.md says to minimize those). Exporting color constants from TypeScript (second source of truth).

## 11. State-driven styling and what tests assert

- **Decision**: Where an element's color depends on state, set a `data-state` attribute and style with Tailwind data variants. Team labels get `data-state="active" | "dimmed" | "idle"`; rank changes get `data-direction="up" | "down"`; minimap stops get `data-band="top" | "middle" | "bottom"`. Tests assert these attributes instead of hex values. See [contracts/ui-states.md](contracts/ui-states.md).
- **Rationale**: Tests run in jsdom without the stylesheet, so they cannot observe a resolved color; today they compare against hex literals, which the spec's edge cases rule out as "copies" of theme values. Asserting the state is what the tests actually mean. `data-state` is also the convention shadcn/Radix components use.
- **Unchanged**: attributes that are not colors (`font-weight`, `stroke-width`, `opacity`, `y`, `aria-pressed`) and team-color lookups (`stroke="#2EAD61"`) stay as they are, so most assertions do not move.
- **Alternatives considered**: Asserting class names (couples tests to utility spelling). Loading CSS in Vitest and using `getComputedStyle` (jsdom does not resolve Tailwind's layered CSS or custom properties reliably).

## 12. Dynamic values

- **Decision**: Values computed at run time (the chart wrapper's max width, tooltip position, team color) stay as inline `style` or SVG attributes. Everything static becomes a class.
- **Rationale**: Tailwind generates classes by scanning source text, so a class name built from a variable is never emitted. This is the one rule a newcomer most needs to know; it goes in the guide.

## 13. Chart animation

- **Decision**: Leave `useChartTransition` and the per-frame interpolation untouched. The only CSS transition involved, on team labels, becomes `transition-[fill,font-weight] duration-150`.
- **Rationale**: Out of scope per the spec, and script-driven attribute updates do not interact with utility classes. `tw-animate-css` (installed by shadcn for component enter/exit animation) does not target these elements.

## 14. Fonts and icons

- **Decision**: Keep the system font stack, declared once as `--font-sans` directly in the `@theme inline` block (not in `:root`: Tailwind's token already has that name, so mapping one to the other would be circular). Keep Font Awesome for the GitHub mark. Accept `lucide-react` if `native-select` pulls it in for its chevron.
- **Rationale**: No font files means nothing extra to bundle or fetch (Principles I, II; SC-009). Lucide no longer ships brand icons, so it cannot replace the GitHub mark.
- **Alternatives considered**: A bundled variable font via `@fontsource-variable/*` (adds weight for a look that is still in flux; easy to add later by changing `--font-sans`).

## 15. Preflight

- **Decision**: Accept Tailwind's base reset and restyle every element explicitly.
- **Rationale**: Preflight zeroes heading sizes and margins and makes `svg` `display: block`. Every heading, paragraph, and control in this app is being rewritten in this feature anyway, so nothing relies on browser defaults afterwards. The body background/text/font move from the `Container` component to `body` in the base layer.

## 16. Lint

- **Decision**: Add an ESLint override turning off `react-refresh/only-export-components` for `src/components/ui/**`.
- **Rationale**: shadcn files export a variants helper next to the component (`Button` and `buttonVariants`), which that rule flags. Editing generated files to satisfy it would make future `shadcn add --overwrite` updates noisy.

## 17. Page layout

- **Decision**: A centered column capped at the chart's width. A header row with the title and subtitle on the left and the GitHub link on the right; a toolbar row holding the season picker, the Earlier / week-range / Later group, and the zoom button, wrapping onto multiple lines on narrow screens; then the chart, rank swings, and team summary. The chart keeps scaling to its container's width as it does today.
- **Rationale**: Moving zoom into the toolbar puts every view control in one place. `flex-wrap` gives FR-015 without media-query logic. Leaving the chart's scaling alone avoids touching tooltip positioning, which is computed against the SVG's rendered box.
- **Alternatives considered**: A minimum chart width with horizontal scrolling inside the chart area (more legible on phones, but changes pointer-to-week math; belongs with the separate responsive-chart work).

## 18. Bundle size

- **Decision**: Measure with `npm run build` after conversion and compare against §1.
- **Expectation**: Removing `styled-components` saves roughly what the Radix primitives for `toggle`, `class-variance-authority`, `clsx`, and `tailwind-merge` add; the generated stylesheet should be on the order of 10 kB gzip. The 72 kB of headroom is not at risk, but it is checked rather than assumed.

## 19. Guide and written rules

- **Decision**: Write `docs/styling.md` and link it from `README.md`. Add styling rules to `AGENTS.md`: use Tailwind utilities; no color literals outside `src/index.css` and team definitions; library components live in `src/components/ui/` and are added with the CLI; never build class names dynamically.
- **State today**: the constitution was amended to v1.2.0 on 2026-10-13 and names the new stack. The old styled-components rule has already been deleted from `AGENTS.md` (uncommitted); no replacement rule has been added yet.
