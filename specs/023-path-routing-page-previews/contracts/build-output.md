# Contract: Build Output (`dist/`)

`npm run build` MUST produce this layout, in addition to the Vite assets it produces today:

```text
dist/
├── index.html                    # site-wide head (unchanged source)
├── 404.html                      # copy of index.html, site-wide head
├── <season>.html                 # one per season in the season index
├── teamHistory/<team>.html       # one per Team enum value (30)
├── playerHistory/<id>.html       # one per player ID found in any season roster
├── previews/
│   ├── season-<season>.png       # 1200×630
│   └── team-<team>.png           # 1200×630
├── sitePreview.png               # from public/
└── apple-touch-icon.png          # from public/
```

## Head tags in season and team entry files

Each tag MUST appear exactly once and carry page-specific values:

```html
<title>{title}</title>
<meta name="description" content="{description}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:url" content="{canonicalUrl}" />
<meta property="og:image" content="{imageUrl}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="{imageUrl}" />
```

All URLs are absolute (`https://…`). Every other part of the file (script and style tags, favicon, `og:site_name`, `og:type`, `twitter:card`) is byte-identical to `dist/index.html`.

## Player entry files and `404.html`

Byte-identical to `dist/index.html`.

## Failure behavior

- A season whose JSON fails validation is skipped with a logged warning, and the build continues.
- A missing logo file or a font load failure fails the build, because it means the repo is broken rather than a data issue.
