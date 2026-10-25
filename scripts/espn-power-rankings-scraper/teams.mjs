// ESPN team-link abbreviations, mapped to the NBA.com franchise ids used by the NBA.com data.
const TEAM_IDS_BY_ABBR = {
  atl: 1610612737, bos: 1610612738, bkn: 1610612751, cha: 1610612766,
  chi: 1610612741, cle: 1610612739, dal: 1610612742, den: 1610612743,
  det: 1610612765, gs: 1610612744, hou: 1610612745, ind: 1610612754,
  lac: 1610612746, lal: 1610612747, mem: 1610612763, mia: 1610612748,
  mil: 1610612749, min: 1610612750, no: 1610612740, nor: 1610612740,
  ny: 1610612752, okc: 1610612760, orl: 1610612753, phi: 1610612755,
  phx: 1610612756, por: 1610612757, sa: 1610612759, sac: 1610612758,
  tor: 1610612761, utah: 1610612762, wsh: 1610612764,
}

// Relocated or renamed franchises ESPN prints without a team link.
const TEAM_IDS_BY_UNLINKED_NAME = {
  'New Orleans': 1610612740,
  'NO/Oklahoma City': 1610612740,
  'New Jersey': 1610612751,
  Seattle: 1610612760,
  Charlotte: 1610612766,
}

/** Resolves an ESPN team row to its NBA.com franchise id, or null when it can't be matched. */
export function resolveTeamId({ espnAbbr, teamName }) {
  if (espnAbbr && TEAM_IDS_BY_ABBR[espnAbbr]) {
    return TEAM_IDS_BY_ABBR[espnAbbr]
  }
  return TEAM_IDS_BY_UNLINKED_NAME[teamName] ?? null
}
