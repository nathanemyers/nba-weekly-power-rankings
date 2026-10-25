# Quickstart: Validate Ollama Summaries

The generating steps below are run by the maintainer. Agents must not run `build:summaries` (`AGENTS.md`).

Prerequisites: `npm ci`; Ollama 0.33+ running (`ollama serve` or the desktop app).

## 1. Offline gates

```bash
npm run lint && npm run build && npm test
```

Expected: all pass, including `scripts/lib/ollama.test.mjs`. `grep -r anthropic-ai package.json scripts` finds nothing.

## 2. Dry run never touches Ollama (FR-010)

Stop Ollama, then:

```bash
npm run build:summaries -- --dry-run
```

Expected: the usual per-season plan and exit 0.

## 3. Setup errors (US2)

- With Ollama stopped and an active-season entry deleted from `data/processed/summaries/`, run `npm run build:summaries`. Expected: stops with "not reachable at http://localhost:11434", exit 1, `git diff data/processed/summaries` shows only the entry you deleted.
- Start Ollama and run `SUMMARY_MODEL=no-such-model npm run build:summaries`. Expected: stops naming the model and suggesting `ollama pull`.

## 4. Local generation (US1)

```bash
ollama pull gemma4:26b
npm run build:summaries -- --season 2025-26
```

Expected: the deleted entry is regenerated with `"model": "gemma4:26b"`; every other entry is unchanged.

## 5. Completed seasons stay locked (SC-003)

```bash
npm run build:summaries
git diff --stat data/processed/summaries
```

Expected: every complete season reports all teams "skipped (locked)" and no diff in their files.

## 6. Cloud (US3)

```bash
ollama signin
SUMMARY_MODEL=gemma4:cloud npm run build:summaries -- --season 2025-26
```

Expected: after deleting one entry again, it is regenerated with `"model": "gemma4:cloud"`. Signed out, the run stops and says to run `ollama signin`. `git grep -i ollama_api_key` matches only documentation.

See [contracts/build-summaries-cli.md](./contracts/build-summaries-cli.md) for every message and exit code.
