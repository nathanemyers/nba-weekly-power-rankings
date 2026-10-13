// Pure rules for which team-season AI summaries need generating. No I/O, no network.
import { createHash } from 'node:crypto'

// The exact text the model is given, built only from this team's weekly write-ups
export function buildPromptInput(entries) {
  return [...entries]
    .sort((a, b) => a.week - b.week)
    .map((e) => `Week ${e.week} (ranked #${e.rank}):\n${e.summaryText.trim()}`)
    .join('\n\n')
}

export function hashInput(text) {
  return createHash('sha256').update(text).digest('hex')
}

// Returns 'generate', 'skip-no-data', 'skip-locked' or 'skip-unchanged'
export function decide({ entries, stored, complete }) {
  if (!entries || entries.length === 0) return 'skip-no-data'
  if (!stored) return 'generate'
  // A completed season's summary is never rewritten, even if its source text later changes
  if (complete) return 'skip-locked'
  return stored.sourceHash === hashInput(buildPromptInput(entries)) ? 'skip-unchanged' : 'generate'
}
