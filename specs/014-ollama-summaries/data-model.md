# Data Model: Generate AI Summaries Through Ollama

## Stored summary — `data/processed/summaries/<season>.json` (unchanged shape)

| Field | Type | Rules |
|-------|------|-------|
| `summary` | string | Non-empty, one paragraph, at most 1,200 characters |
| `sourceHash` | string | SHA-256 hex of the exact prompt input the summary was generated from |
| `weeks` | number | Count of weekly entries in that input; at least 1 |
| `model` | string | The Ollama model name that wrote it, as returned in the response (e.g. `gemma4:26b`, `gemma4:cloud`). Existing entries keep their Claude model ids. |
| `generatedAt` | string | ISO-8601 UTC timestamp |

No migration. Existing entries are neither rewritten nor revalidated, and `model` is not used by any decision, so a provider change cannot trigger regeneration (FR-007, SC-003).

## Generation decision (unchanged)

Exactly the table in `specs/006-team-ai-summary/data-model.md`. `scripts/lib/summary-plan.mjs` is not modified.

## Generation settings (per run, never stored)

| Setting | Source | Default |
|---------|--------|---------|
| Model | `SUMMARY_MODEL` | `gemma4:26b` |
| Server | `OLLAMA_HOST` | `http://localhost:11434` |
| Credential | `OLLAMA_API_KEY`, or the local Ollama app's own sign-in | none |

## Model response (derived, per team)

From one non-streaming `/api/chat` call. A response with an `error` field fails the team.

| Field used | Rule |
|------------|------|
| `message.content` | The candidate summary, trimmed. Must pass the stored-summary rules above. |
| `message.thinking` | Ignored and never stored. |
| `done_reason` | `length` means the reply was cut off: reject. |
| `prompt_eval_count` | If it reaches the context size sent in the request, the input was truncated: reject. |
| `model` | Stored as `model`. |
