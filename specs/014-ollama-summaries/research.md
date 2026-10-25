# Research: Generate AI Summaries Through Ollama

Facts below were checked on 2026-10-24 against Ollama 0.33.3 running on the maintainer's machine and against docs.ollama.com and ollama.com/pricing.

## 1. How the script talks to Ollama

- **Decision**: Node's built-in `node:http` / `node:https` `request` against Ollama's REST API: `POST /api/show` once to check the model, then one non-streaming `POST /api/chat` per team. No client library and no `fetch`.
- **Rationale**: Two endpoints with JSON in and out. Removing `@anthropic-ai/sdk` without adding a replacement leaves the project with one fewer dependency (Principle V).
- **Why not `fetch`**: Measured on the maintainer's machine, a request to `gemma4:26b` with the longest input failed with `HeadersTimeoutError` both with and without streaming. Node's `fetch` gives up when response headers take more than 5 minutes, and Ollama sends no headers until it has read the whole prompt. Its log showed `gemma4:26b` reading the prompt at about 18 tokens/s (only about 1 GB of the model fits in the 8 GB GPU), so the first byte of the longest prompt arrives after roughly 13 minutes. Raising `fetch`'s limit needs `undici`'s `Agent`, which Node does not expose without adding the package. `node:http` has no header timeout, so the script sets its own: 30 minutes per request, reported as a failed team.
- **Alternatives considered**: The `ollama` npm package (a dependency, and it is built on `fetch`, so it hits the same limit); the `undici` package for a longer `fetch` timeout (a dependency for one setting); Ollama's OpenAI-compatible endpoint with the `openai` package (a dependency, and it hides `thinking` and `prompt_eval_count`, both needed below).

## 2. Local and cloud through one setting

- **Decision**: The model name decides where it runs. `SUMMARY_MODEL=gemma4:26b` runs locally; `SUMMARY_MODEL=gemma4:cloud` (any `:cloud` model) runs in Ollama's cloud through the same local Ollama app, billed to the account the app is signed into. As a second path, `OLLAMA_HOST=https://ollama.com` with `OLLAMA_API_KEY` calls the cloud API directly; the script sends `Authorization: Bearer` only when the key is set.
- **Rationale**: SC-002 asks for a single setting change. With the signed-in app, the project never sees a credential at all (FR-009, SC-005). The direct path costs one header and covers a machine without the app. `OLLAMA_HOST` and `OLLAMA_API_KEY` are Ollama's own variable names, so they mean the same thing to the `ollama` CLI.
- **Alternatives considered**: A `--cloud` flag (redundant with the model name, and a second thing to keep consistent); a config file (a place a key could get committed).

## 3. Context length

- **Decision**: Send `options.num_ctx: 32768` with every chat request. Reject a reply when `prompt_eval_count` reaches `num_ctx`, because that means the input was cut.
- **Rationale**: Measured over all 270 team-seasons, prompt input is 21,271–51,133 characters (median 40,051), roughly 5,000–13,000 tokens of write-ups; the longest measured 14,056 prompt tokens with the instructions. Ollama's default context is smaller than that on many setups and truncates silently, which would produce a summary of only part of the season while passing every text check. 32,768 covers the longest input with room to spare.
- **Alternatives considered**: Relying on `OLLAMA_CONTEXT_LENGTH` set by the maintainer (easy to forget, and failure is silent); sizing `num_ctx` per request (saves memory, adds code; revisit only if 32k does not fit).

## 4. Thinking models

- **Decision**: Send `think: false`. Store only `message.content`; ignore `message.thinking`. Reject a reply whose `done_reason` is `length`.
- **Rationale**: Thinking is returned in a separate field, so it never reaches the stored text. Turning it off saves time and tokens for an 80–120 word recap. Models that cannot turn it off still keep it out of `content`. For gpt-oss, which only accepts levels, Ollama falls back to the model default, which is still separate from `content`.
- **Alternatives considered**: Stripping `<think>` tags from `content` (only needed for models served without thinking support; the length and one-paragraph checks catch the rare leak).

## 5. Default model

- **Decision**: `gemma4:26b`, overridable with `SUMMARY_MODEL`.
- **Measurements** (maintainer's machine: RTX 3070 8 GB, 15 GB RAM; longest real input, 2022-23 Brooklyn, about 14,000 prompt tokens; `think: false`, `temperature: 0.3`, `num_ctx: 32768`):

  | Model | Total time | Result |
  |-------|-----------|--------|
  | `hf.co/unsloth/Qwen3-4B-GGUF:Q4_K_M` (fits in the GPU) | 112 s | 2,742 characters, a week-by-week list: fails the 1,200-character rule |
  | `gemma4:26b` (mostly on CPU) | 457 s (419 s reading the prompt, 38 s writing) | 718 characters, one paragraph, on topic: passes. Spot-checked facts (11-game winning streak, Irving and Durant trades) match the write-ups. |
  | `hf.co/unsloth/Qwen3.8-27B-GGUF:UD-IQ2_XXS` | 412 s (76 s reading the prompt, 286 s writing) | 675 characters, one paragraph: passes. More concrete (start, low and final ranks are correct) but calls the 11-game winning streak a 12-game one. |

- **Rationale**: A model whose output the existing checks reject is not a usable default, however fast. `gemma4:26b` and Qwen3.8-27B IQ2_XXS are close on time and both pass the checks; `gemma4:26b` wins on the one factual error found and on being a plain Ollama library name (`ollama pull gemma4:26b`) rather than a Hugging Face path. It also lets thinking be turned off. At up to about 8 minutes per team, a weekly refresh of 30 teams takes up to about 4 hours unattended, which fits a run left going in the background. Completed seasons are locked, so no full backfill is expected. When speed matters, `SUMMARY_MODEL=gemma4:cloud` runs the same model family in Ollama's cloud.
- **Alternatives considered**: The 4B model (fast, but ignores the length instruction); Qwen3.8-27B at IQ2_XXS (a close second, measured above; a reasonable `SUMMARY_MODEL` override); defaulting to a cloud model (contradicts FR-001's local default).
- **Consequence for the script**: Per-team time is long enough that the script prints each team as it starts and finishes, so a multi-hour run shows progress.

## 6. Errors and retries

- **Decision**:
  - Connection refused or DNS failure on the first call: stop, "Ollama is not reachable at <host>".
  - No reply within 30 minutes: count the team as failed and move on.
  - `/api/show` 404: stop, "model <name> is not available"; for a local name add `ollama pull <name>`.
  - 401 or 403: stop; for `:cloud` models say `ollama signin`, for `https://ollama.com` say set `OLLAMA_API_KEY`.
  - 402: stop, "no usage credit left on the Ollama account".
  - 429, 500, 502, 503: retry up to 3 times with 2, 4 and 8 second waits, then count the team as failed for this run.
  - A reply that fails the summary rules: count the team as failed, keep going.
- **Rationale**: Matches the stop-versus-continue split the current script already has (setup problems stop, per-team problems continue) and FR-008. Ollama documents 404, 429 and 502 with `{"error": "..."}` bodies, and its error text is included in every message. 401, 402 and 403 are not documented on the errors page, so they are handled defensively; anything else unexpected is reported with its status and the server's message.
- **Alternatives considered**: No retries (a single 429 from the cloud's concurrency queue would fail a team needlessly).

## 7. Sampling

- **Decision**: `options.temperature: 0.3`.
- **Rationale**: Recaps should be factual and close to the source; several local models default to a temperature of 1.0, which makes small models more likely to invent details.

## 8. Tests

- **Decision**: Move the request building and reply checking into a pure module, `scripts/lib/ollama.mjs`, unit-tested in `scripts/lib/ollama.test.mjs` by passing in a fake request function in place of the `node:http` one. Nothing in the test suite contacts Ollama.
- **Rationale**: Keeps `npm test` offline and covers each error row in the CLI contract.
