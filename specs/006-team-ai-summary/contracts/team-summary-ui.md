# UI Contract: Team summary panel

`TeamSummary` props: `teamName: string`, `summary: string`.

- Rendered by `App` under the chart only when one team is pinned and it has a summary for the selected season; otherwise nothing is rendered and no placeholder is shown.
- Contains the team name as a heading, the visible text "AI-generated summary", and the summary paragraph.
- Exposed as a region labeled "AI-generated summary for <team name>".
- Changes immediately when the pinned team or the season changes; disappears on unpin.
