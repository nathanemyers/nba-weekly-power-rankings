# Contract: `npm run build:summaries`

| Input | Meaning |
|-------|---------|
| `ANTHROPIC_API_KEY` (env, required unless `--dry-run`) | API credential; never written to disk |
| `SUMMARY_MODEL` (env, optional) | Model id; default `claude-sonnet-5-5` |
| `--dry-run` | Print the per-season plan (generate / skip-locked / skip-unchanged / skip-no-data) and exit without network calls |
| `--season <id>` (repeatable) | Limit the run to the named seasons |

Behavior:

- Applies the decision table in [data-model.md](../data-model.md) to every team in every selected season.
- Rewrites a season file after each successful team.
- Prints one line per season: generated, skipped (locked), skipped (unchanged), skipped (no data), failed.
- Exit code 0 when nothing failed; 1 when any team failed or the key is missing while work is pending. Exit 0 with no key when nothing needs generating.

Refresh routine after a weekly scrape:

```bash
npm run build:summaries
npm run build:rankings
```
