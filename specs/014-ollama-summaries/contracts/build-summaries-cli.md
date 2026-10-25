# Contract: `npm run build:summaries` (replaces the 006 contract of the same name)

| Input | Meaning |
|-------|---------|
| `SUMMARY_MODEL` (env, optional) | Ollama model name; default `gemma4:26b`. A cloud model such as `gemma4:cloud` runs in Ollama's cloud through the local Ollama app. |
| `OLLAMA_HOST` (env, optional) | Ollama server; default `http://localhost:11434`. Set to `https://ollama.com` to call the cloud API directly. |
| `OLLAMA_API_KEY` (env, optional) | Sent as `Authorization: Bearer <key>` when set. Only needed when `OLLAMA_HOST` is `https://ollama.com`. Never written to disk. |
| `--dry-run` | Print the per-season plan and exit without contacting Ollama |
| `--season <id>` (repeatable) | Limit the run to the named seasons |

`ANTHROPIC_API_KEY` is no longer read.

## Behavior

- Applies the unchanged decision rules from 006 to every team in every selected season.
- Before the first `generate`, checks once that the model is available. Nothing is checked or contacted when there is nothing to generate.
- Prints a line as each team starts and finishes, because a local model can take several minutes per team.
- Rewrites a season file after each successful team, so an interrupted run resumes where it stopped.
- Prints one line per season: generated, skipped (locked), skipped (unchanged), skipped (no data), failed.

## Exit codes and messages

| Situation | Result |
|-----------|--------|
| Nothing failed | Exit 0 |
| Some teams failed (rejected summary, rate limit after retries, server error, no reply within 30 minutes) | Those teams reported, run continues, exit 1 |
| Ollama unreachable at `OLLAMA_HOST` | Stop before generating, exit 1: names the host and says to start Ollama (`ollama serve` or the desktop app) |
| Model not available | Stop before generating, exit 1: names the model; for a local model, says `ollama pull <model>` |
| Credential missing or rejected (401/403) | Stop at once, exit 1: for a `:cloud` model, says to run `ollama signin`; for `https://ollama.com`, says to set `OLLAMA_API_KEY` |
| Out of credits (402) | Stop at once, exit 1: says the Ollama account has no usage credit left |

In every stopping case no stored summary is changed.

## Refresh routine after a weekly scrape

```bash
npm run build:summaries
npm run build:rankings
```
