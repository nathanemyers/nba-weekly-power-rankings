# Contract: Theme Tokens

The theme is the `:root` block of `src/index.css`. Each color and radius variable below MUST exist there with exactly one value, and each color MUST be exposed to Tailwind in the `@theme inline` block as `--color-<name>: var(--<name>)`. Components refer to roles only through the resulting utilities (`bg-card`, `text-muted-foreground`, `stroke-chart-grid`, …).

## Standard roles (shadcn/ui names)

| Variable | Role | Starting value | Replaces today's |
| --- | --- | --- | --- |
| `--background` | Page background; outline around chart dots | `#1d1d1f` | `#1d1d1f` |
| `--foreground` | Primary text; active team label; link hover | `#f5f5f7` | `#f5f5f7`, `#ffffff` |
| `--card` | Panel and control surface | `#2c2c2e` | `#2c2c2e` |
| `--card-foreground` | Text on panels | `#f5f5f7` | `#f5f5f7` |
| `--popover` | Chart tooltip surface (used at 85% opacity) | `#000000` | `rgba(0,0,0,0.85)` |
| `--popover-foreground` | Tooltip text | `#f5f5f7` | inherited |
| `--primary` | Emphasized control surface | `#f5f5f7` | (unused today) |
| `--primary-foreground` | Text on primary | `#1d1d1f` | (unused today) |
| `--secondary` | Quiet control surface | `#2c2c2e` | `#2c2c2e` |
| `--secondary-foreground` | Text on secondary | `#f5f5f7` | `#f5f5f7` |
| `--muted` | Subdued surface | `#2c2c2e` | `#2c2c2e` |
| `--muted-foreground` | Muted text; axis ticks and labels | `#a1a1a6` | `#a1a1a6` |
| `--accent` | Hover and pressed surface | `#3a3a3c` | `#3a3a3c` |
| `--accent-foreground` | Text on accent | `#f5f5f7` | `#f5f5f7` |
| `--destructive` | Error styling (required by library components) | `#ff453a` | (unused today) |
| `--border` | Panel and control borders | `#3a3a3c` | `#3a3a3c` |
| `--input` | Form control borders | `#3a3a3c` | `#3a3a3c` |
| `--ring` | Keyboard focus ring | `#a1a1a6` | (none today) |
| `--radius` | Base corner radius; `sm`/`md`/`lg`/`xl` derive from it | `0.5rem` | `6px`, `8px` |

## Project roles

| Variable | Role | Starting value | Replaces today's |
| --- | --- | --- | --- |
| `--foreground-soft` | Secondary body text; idle team labels; rank numbers | `#d1d1d6` | `#d1d1d6` |
| `--dim` | De-emphasized team labels while another is active; quiet outlines | `#5c5c63` | `#5c5c63` |
| `--rank-up` | Rising rank; top third of trend minimap | `#30d158` | `#30D158` |
| `--rank-mid` | Middle third of trend minimap | `#ffd60a` | `#FFD60A` |
| `--rank-down` | Falling rank; bottom third of trend minimap | `#ff453a` | `#FF453A` |
| `--chart-grid` | Chart grid lines | `#333336` | `#333336` |
| `--chart-playoffs` | Playoffs divider line and label | `#ff4d4f` | `#ff4d4f` |

## Non-color entries

| Variable | Role | Starting value | Defined in |
| --- | --- | --- | --- |
| `--font-sans` | The site's typeface | `system-ui, sans-serif` | The `@theme inline` block, directly |

`--font-sans` is the one entry written in `@theme inline` rather than `:root`. Tailwind's own token for the `font-sans` utility is already named `--font-sans`, so a `:root` variable of the same name mapped through `var(--font-sans)` would refer to itself.

## Rules

1. A role has one value. Two roles may share a value today (`--border` and `--accent`); they remain separate names so they can diverge.
2. No file other than `src/index.css` contains a color literal (hex, `rgb()`, `hsl()`, `oklch()`, or a Tailwind palette class such as `bg-zinc-800`), with three exceptions: per-team colors in `src/types/nba.ts` and `src/test/fixtures.ts`; files under `specs/`; and generated library components under `src/components/ui/`, which are kept as the CLI wrote them and may contain fixed utility colors such as `text-white`. A fixed color in a library component that is visible on this site is overridden with a theme role through `className` at the call site.
3. Names describe purpose. A rename is a breaking change to this contract; a value change is not.
4. Adding a role means adding one line to `:root` and one line to `@theme inline`.
5. Text roles meet WCAG 2.1 AA (4.5:1) against the surfaces they are used on. `--dim` is the exception: it marks labels that are deliberately pushed back while another team is active, and is never the only way to read that information.
6. Not part of the theme: per-team colors, and layout numbers passed to the chart as props (width, height, margins).

## Verification

```bash
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(" src --include='*.ts' --include='*.tsx' \
  | grep -v "src/types/nba.ts" | grep -v "src/test/fixtures.ts" | grep -v "src/components/ui/"
```

Expected remaining matches: only team-color constants in test files (`BOSTON`, `LAKERS`, `MIAMI`) and non-color strings such as `#10 Miami Heat` or `url(#…)`.
