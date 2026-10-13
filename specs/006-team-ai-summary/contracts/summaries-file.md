# Contract: `data/summaries/<season>.json`

```json
{
  "bos": {
    "summary": "Boston opened the season at No. 1 and ...",
    "sourceHash": "9f2c...e1",
    "weeks": 25,
    "model": "claude-sonnet-5-5",
    "generatedAt": "2026-10-12T19:30:00Z"
  }
}
```

- Written only by `scripts/build-summaries.mjs`; read by `scripts/build-rankings.mjs`.
- A missing file or missing team key means "no summary", never an error.
- For a complete season, an existing entry is never rewritten by the script.

# Contract: `src/data/seasons/<season>.json` (addition)

```json
{ "season": "2024-25", "maxWeek": 25, "rankings": {}, "playoffs": {}, "summaries": { "bos": "Boston opened ..." } }
```

`summaries` is optional and holds text only.
