## Settings up Spec-Kit

This project is developed using Github's Spec-Kit (https://github.com/github/spec-kit)

### Installing Spec-Kit

If spec-kit is not installed, follow the instructions here to install: https://github.github.io/spec-kit/installation.html

```bash
uv tool install specify-cli
```

### Initializing the project

To initialize the project for spec-kit run the following, subbing out `--integration claude` to match the given environment.

```bash
specify init --here --script py --integration claude --force
```

## Code Generation Rules

- Do not use `useMemo`. This is a performance optimization that will be added when it becomes necessary.
- Keep usage of `useEffect` to a minimum.
- Do not use `useRef` to store state unless it is absolutely necessary.
- Use React `Suspense` for loading state.
- Style with Tailwind CSS utility classes. See `docs/styling.md`.
- Define colors, fonts, and radii only in `src/index.css`. Do not put color values in components, except per-team colors.
- Use shadcn/ui components from `src/components/ui/` rather than hand-rolling an equivalent. Add new ones with `npx shadcn@latest add <name>` and do not edit the generated files.
- Never build Tailwind class names from variables. Run-time values go in `style` or SVG attributes.
- Keep comments to a minimum. 1 sentence maximum.
- Do not use estoteric JS contructs like `Map` or `Set`. Stick to objects and arrays.
- Clickable UI elements should use the `cursor-pointer` tailwind CSS class.

## Forbidden Actions

The following actions spend API tokens, which cost money. Do **not** perform these actions.

- Do not run `npm run build:summaries`
- Do not run `scripts/build-summaries.mjs`
