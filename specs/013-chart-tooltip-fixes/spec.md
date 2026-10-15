# Feature Specification: Chart Weekly-Summary Tooltip Fixes

**Feature Branch**: `013-chart-tooltip-fixes`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "there are some issues right now with the weekly summary nodes in the chart component. When lines are especially packed on top of each other, tooltips can fail to show up, this is to be expected when nothing is pinned, but when a team is pinned we should move that team's line to the top of the z-index so that it's nodes take priority. There is also a problem that nodes close to the right hand side have very small widths and end up being very tall and unreadable."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A pinned team's weekly nodes always respond (Priority: P1)

A visitor pins a team to follow its season. On the chart, that team's line runs through a crowded section where several other teams sit at neighbouring ranks. The visitor moves the pointer over each of the pinned team's weekly nodes. Every node opens that week's summary tooltip, even where other teams' lines cross or overlap it. The pinned team's line and nodes are also drawn above the other lines, so they are never hidden behind them.

**Why this priority**: Pinning exists to make one team's story easy to read. If its weekly summaries can't be opened in crowded stretches, the core reason to pin a team fails.

**Independent Test**: Pin a team whose line crosses or overlaps other lines. Hover each of its weekly nodes and confirm that each one opens its tooltip.

**Acceptance Scenarios**:

1. **Given** a team is pinned and another team's line passes over or close to one of its weekly nodes, **When** the visitor hovers that node, **Then** the tooltip for the pinned team's week appears.
2. **Given** a team is pinned, **When** the chart is displayed, **Then** the pinned team's line and nodes are drawn on top of every other team's line.
3. **Given** a team is pinned, **When** the visitor unpins it or pins a different team, **Then** the layering updates so the newly pinned team, if any, is on top.
4. **Given** nothing is pinned, **When** the visitor hovers a crowded area, **Then** behaviour is unchanged from today: the line nearest the top of the drawing order gets the hover. Missing tooltips in this case are acceptable.

---

### User Story 2 - Tooltips near the right edge stay readable (Priority: P2)

A visitor hovers a weekly node in the last weeks of the visible range, close to the chart's right edge. The tooltip opens to the left of the node at its normal width. Its text wraps into a short, readable block instead of a tall, narrow column.

**Why this priority**: The final weeks, including the playoffs, are among the most interesting, and their summaries are currently hard to read.

**Independent Test**: Hover the node for the last week shown and the node for a mid-range week. Both tooltips have about the same width and number of lines.

**Acceptance Scenarios**:

1. **Given** a tooltip with the same text is opened for a node near the right edge and for a node in the middle of the chart, **When** both are compared, **Then** they have the same width, within a small tolerance.
2. **Given** a node near the right edge, **When** its tooltip opens, **Then** the tooltip sits entirely to the left of the node and does not extend past the chart's right edge.
3. **Given** a node on the left side or in the middle of the chart, **When** its tooltip opens, **Then** the tooltip opens to the right of the node as it does today.
4. **Given** the chart is shown at a narrow (phone) width, **When** a node near the right edge is hovered or tapped, **Then** the tooltip is still no narrower than one opened from the middle of the chart.

### Edge Cases

- Two teams are at the same rank in the same week while one of them is pinned: the pinned team's node gets the hover.
- Hovering another team's line while a team is pinned leaves the pinned team highlighted, as it is today.
- The tooltip opens on a node during the zoom or paging animation: the width and placement rules still apply at the node's current position.
- A summary is long enough to exceed the normal maximum width: it wraps at that maximum on both sides of the chart.
- Tooltips near the top or bottom of the chart are positioned as they are today. Vertical clipping is out of scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a team is pinned, its line and weekly nodes MUST be drawn above every other team's line and nodes.
- **FR-002**: When a team is pinned, pointing at one of its weekly nodes MUST show that node's tooltip, even if other teams' lines overlap the node.
- **FR-003**: When nothing is pinned, the drawing order and hover behaviour MUST stay as they are today.
- **FR-004**: The drawing order MUST update immediately when the pinned team changes or is cleared.
- **FR-005**: A tooltip's width MUST depend only on its content and the normal maximum width, never on how close its node is to the chart's right edge.
- **FR-006**: A tooltip for a node in the right part of the chart MUST open to the left of the node and stay inside the chart's horizontal bounds. A tooltip for any other node MUST open to the right of the node, as today.
- **FR-007**: Tooltip content (rank, team name, record, summary, week) MUST be unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With a team pinned, 100% of that team's visible weekly nodes open their tooltip on hover, including nodes that overlap other teams' lines.
- **SC-002**: The same tooltip text opened from the last visible week and from a mid-range week renders at the same width (within 5%) and the same number of lines.
- **SC-003**: No tooltip extends past the chart's left or right edge at desktop or phone widths.
- **SC-004**: All existing chart behaviour, such as hover highlighting, pinning, zoom and paging, works as it does today, as checked by the current tests and a manual walkthrough.

## Assumptions

- Only a pinned team is raised to the top. A merely hovered team is not raised, because reordering lines while the pointer moves would shift hit areas under it and cause flicker. The user called missing tooltips with nothing pinned "expected".
- At most one team is pinned at a time (current behaviour). If several were pinned, all of them would be drawn above the unpinned teams.
- A node counts as "right side" when it sits past 50% of the chart width. This was 60%; planning moved it to 50% so that the side a tooltip opens toward always has room for its full width (see research R3).
- The narrow right-edge tooltips are a layout problem: the space a tooltip can take shrinks as its node gets closer to the right edge. No content or data changes are needed.
