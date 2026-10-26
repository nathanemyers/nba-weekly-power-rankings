# Contract: `rosters` and `coaches` in processed season data

`data/processed/seasons/{season}.json` gains two optional fields, `rosters` and `coaches`, written by `scripts/build-rankings.mjs` from the raw roster file for that season. Seasons with no raw roster file omit both.

```json
{
  "season": "2018-19",
  "rosters": {
    "tor": [
      { "id": "lowryky01", "name": "Kyle Lowry", "pos": "PG", "age": 32, "g": 65, "gs": 65, "mpg": 34.0, "pts": 14.2, "trb": 4.8, "ast": 8.7, "stl": 1.4, "blk": 0.5, "tov": 2.8, "per": 16.6 },
      { "id": "gasolma01", "name": "Marc Gasol", "pos": "C", "age": 34, "g": 26, "gs": 19, "mpg": 24.9, "pts": 9.1, "trb": 6.6, "ast": 3.9, "stl": 0.9, "blk": 0.9, "tov": 1.4, "per": 16.0, "joinedFrom": "mem" },
      { "id": "valanjo01", "name": "Jonas Valančiūnas", "pos": "C", "age": 26, "g": 30, "gs": 10, "mpg": 18.8, "pts": 12.8, "trb": 7.2, "ast": 1.0, "stl": 0.4, "blk": 0.8, "tov": 1.4, "per": 24.4, "leftFor": "mem" }
    ]
  },
  "coaches": {
    "chi": [
      { "id": "hoibefr99c", "name": "Fred Hoiberg", "g": 24, "w": 5, "l": 19 },
      { "id": "boyleji02c", "name": "Jim Boylen", "g": 58, "w": 17, "l": 41 }
    ],
    "tor": [{ "id": "nurseni01c", "name": "Nick Nurse", "g": 82, "w": 58, "l": 24 }]
  }
}
```

(Example values are illustrative except Gasol's and Valančiūnas's games, minutes and PER, which come from the sampled pages. Array order follows the sort rule, abbreviated here.)

## Zod schema (`src/schemas/season.ts`)

```ts
export const RosterEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  pos: z.string(),
  age: z.int().min(15).max(50),
  g: z.int().min(1),
  gs: z.int().min(0),
  mpg: z.number().min(0),
  pts: z.number().min(0),
  trb: z.number().min(0),
  ast: z.number().min(0),
  stl: z.number().min(0),
  blk: z.number().min(0),
  tov: z.number().min(0),
  per: z.number().nullable(),
  joinedFrom: z.enum(Team).optional(),
  leftFor: z.enum(Team).optional(),
})

export const CoachStintSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  g: z.int().min(1),
  w: z.int().min(0),
  l: z.int().min(0),
})

// added to SeasonDataSchema
rosters: z.partialRecord(z.enum(Team), z.array(RosterEntrySchema)).optional(),
coaches: z.partialRecord(z.enum(Team), z.array(CoachStintSchema)).optional(),
```

`loadSeasons` copies `data.rosters?.[team.teamId]` to `TeamRankings.roster` and `data.coaches?.[team.teamId]` to `TeamRankings.coaches`. A season that fails validation is dropped as today, so a bad roster can't crash the app.
