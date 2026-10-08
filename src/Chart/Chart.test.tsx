import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RankingsChart, { type TeamRankings } from "./Chart";

// Stable layout constants mirrored from Chart.tsx, used only to sanity-check that scale
// positions fall within the plot area — not to assert exact pixel values.
const PLOT_LEFT = 190;
const PLOT_WIDTH = 960 - 190 - 120;
const RANK_TICK_COUNT = 7; // RANK_TICKS = [1, 5, 10, 15, 20, 25, 30]

function makeTeam(
  slug: string,
  name: string,
  color: string,
  rankings: TeamRankings["rankings"],
  playoff?: TeamRankings["playoff"],
): TeamRankings {
  return { slug, name, color, rankings, playoff };
}

// 25-week season fixture: one team ranked every week, one team missing week 10 (a gap),
// one team that made the playoffs.
function buildSeason(maxWeek = 25) {
  const allWeeks = (rankStart: number) =>
    Array.from({ length: maxWeek }, (_, i) => ({
      week: i + 1,
      rank: rankStart,
      summary: `Week ${i + 1} summary`,
    }));

  const withGap = allWeeks(5).filter((r) => r.week !== 10);

  const teams: TeamRankings[] = [
    makeTeam("bos", "Boston Celtics", "#2EAD61", allWeeks(1), "champion"),
    makeTeam("lal", "Los Angeles Lakers", "#B388FF", withGap),
    makeTeam("mia", "Miami Heat", "#E0115F", allWeeks(10)),
  ];

  return { teams, maxWeek };
}

// Owns `zoomedOut` the way App.tsx does, so clicking the zoom control in a test actually
// changes what Chart.tsx renders (RankingsChart itself never mutates the prop).
function Harness(
  props: Omit<Parameters<typeof RankingsChart>[0], "zoomedOut" | "onToggleZoom"> & {
    initialZoomedOut?: boolean;
  },
) {
  const { initialZoomedOut = false, ...rest } = props;
  const [zoomedOut, setZoomedOut] = useState(initialZoomedOut);
  return (
    <RankingsChart
      {...rest}
      zoomedOut={zoomedOut}
      onToggleZoom={() => setZoomedOut((z) => !z)}
    />
  );
}

function renderChart(overrides: Partial<Parameters<typeof Harness>[0]> = {}) {
  const { teams, maxWeek } = buildSeason();
  const utils = render(<Harness teams={teams} maxWeek={maxWeek} {...overrides} />);
  return { ...utils, teams, maxWeek };
}

function weekTickCount(container: HTMLElement) {
  return container.querySelectorAll("text.tick").length - RANK_TICK_COUNT;
}

/** Waits for the chart's scale animation (triggered by a zoom or pan) to fully settle.
 * jsdom's `requestAnimationFrame` fires noticeably less promptly than a real browser's refresh
 * cycle, so settling can take noticeably longer here than the actual animation duration — the
 * generous timeout accommodates the test environment, not the production animation itself. */
async function waitForWeekTicks(container: HTMLElement, expected: number) {
  await waitFor(() => expect(weekTickCount(container)).toBe(expected), { timeout: 3000 });
}

// Mirrors Chart.tsx's y(rank) formula exactly, so expected label positions can be asserted
// precisely rather than loosely.
function yOf(rank: number) {
  const M_TOP = 30;
  const PLOT_H = 600 - 30 - 60;
  return M_TOP + ((rank - 1) / 29) * PLOT_H;
}

// A team whose rank differs between week 1 and week 2 (then holds steady), so panning the
// default window [1–11] to [2–12] changes which week determines its label's row.
function buildVaryingRankFixture() {
  const { teams, maxWeek } = buildSeason();
  const varyingTeam = makeTeam("det", "Detroit Pistons", "#E83E8C", [
    { week: 1, rank: 5, summary: "Week 1 summary" },
    ...Array.from({ length: maxWeek - 1 }, (_, i) => ({
      week: i + 2,
      rank: 20,
      summary: `Week ${i + 2} summary`,
    })),
  ]);
  return { teams: [...teams, varyingTeam], maxWeek, varyingTeamName: "Detroit Pistons" };
}

function labelElement(container: HTMLElement, name: string) {
  return Array.from(container.querySelectorAll("text.team-label")).find(
    (el) => el.textContent === name,
  );
}

/** A short, `act`-wrapped pause for manual polling loops, so React state updates that happen
 * during it (via requestAnimationFrame) are flushed properly instead of logging act() warnings.
 *
 * jsdom's `requestAnimationFrame` fires in noticeably bursty fashion — sometimes going silent
 * for several hundred ms even mid-animation — so a short streak of unchanged polls is *not* a
 * reliable "it's settled" signal here (it can just as easily mean "jsdom hasn't fired the next
 * burst of callbacks yet"). Settling checks in this file use one generous fixed wait instead of
 * trying to detect stability from a short polling streak. */
async function tick(ms = 30) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/** Compares two SVG path `d` strings' numeric coordinates within a small tolerance. Floating
 * point doesn't guarantee `a + (b - a) === b`, so even a fully-settled animated value can be a
 * sub-pixel ULP off an exact, non-animated one — this checks "the same position", not
 * byte-exact string equality. */
function expectPathsClose(actual: string, expected: string) {
  const numbers = (d: string) => Array.from(d.matchAll(/-?[\d.]+/g)).map(Number);
  const a = numbers(actual);
  const e = numbers(expected);
  expect(a.length).toBe(e.length);
  a.forEach((value, i) => expect(value).toBeCloseTo(e[i], 1));
}

function mockReducedMotion(reduce: boolean) {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({
      matches: reduce,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
  return () => {
    window.matchMedia = original;
  };
}

describe("User Story 1 — see the whole season at a glance", () => {
  it("shows every recorded week once zoomed out, with no paging controls", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { container, maxWeek } = renderChart();

    expect(weekTickCount(container)).toBe(11); // windowWeeks (10) + 1 inclusive ticks

    await user.click(screen.getByRole("button", { name: /zoom out/i }));
    // The scale animates toward the full season rather than snapping, so wait for it to settle
    // before asserting the end state (research.md §1; FR-004).
    await waitForWeekTicks(container, maxWeek);

    // Stay visible (but inactive) rather than disappearing, so the controls row doesn't
    // jump around when toggling zoom.
    expect(screen.getByRole("button", { name: /earlier/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /later/i })).toBeDisabled();
  });

  it("positions the playoffs marker within the full-season plot bounds", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { container } = renderChart();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));
    await waitForWeekTicks(container, 25);

    const marker = screen.getByText("Playoffs Begin");
    const x = Number(marker.getAttribute("x"));
    expect(x).toBeGreaterThanOrEqual(PLOT_LEFT);
    expect(x).toBeLessThanOrEqual(PLOT_LEFT + PLOT_WIDTH);
  });

  it("keeps a gap in a team's line across a week it wasn't ranked", async () => {
    const user = userEvent.setup();
    const { container } = renderChart();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

    const lakersPath = container.querySelector('path[stroke="#B388FF"]');
    const d = lakersPath?.getAttribute("d") ?? "";
    // One gap (week 10 missing) means two subpaths, i.e. two "M" moveto commands.
    expect(d.match(/M/g)?.length).toBe(2);
  });

  it("shows the end-of-season playoff-medal column", async () => {
    const user = userEvent.setup();
    renderChart();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

    expect(screen.getByText("Playoffs")).toBeInTheDocument();
  });

  it("moves continuously during the zoom-out animation, not in a single-frame jump", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { container, maxWeek } = renderChart();
    const bostonD = () => container.querySelector('path[stroke="#2EAD61"]')?.getAttribute("d");
    const initial = bostonD();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

    // Collect distinct intermediate renders of the line's path until the animation settles.
    // More than the two endpoints (initial, final) proves real in-between frames occurred,
    // not an instant swap (FR-002; SC-001).
    const samples = new Set<string>();
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline && weekTickCount(container) !== maxWeek) {
      const d = bostonD();
      if (d) samples.add(d);
      await tick();
    }
    samples.add(bostonD()!);

    expect(samples.size).toBeGreaterThan(2);
    expect(bostonD()).not.toBe(initial);
  });

  it("hides the zoom control entirely when the season fits the window", () => {
    const { teams, maxWeek } = buildSeason(8);
    render(<Harness teams={teams} maxWeek={maxWeek} windowWeeks={10} />);

    expect(screen.queryByRole("button", { name: /zoom (out|in)/i })).not.toBeInTheDocument();
  });
});

describe("User Story 2 — return to the detailed weekly window", () => {
  it("restores the exact prior position, paging, and pinned team after a round trip", async () => {
    const user = userEvent.setup();
    renderChart();

    // Move the window away from its initial position first.
    await user.click(screen.getByRole("button", { name: /later/i }));
    const weekRangeBefore = screen.getByText(/^Weeks /).textContent;

    // Pin a team (clicking its label toggles the pin).
    await user.click(screen.getByText("Miami Heat"));

    await user.click(screen.getByRole("button", { name: /zoom out/i }));
    await user.click(screen.getByRole("button", { name: /zoom in/i }));

    expect(screen.getByText(/^Weeks /).textContent).toBe(weekRangeBefore);
    expect(screen.getByRole("button", { name: /earlier/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /later/i })).not.toBeDisabled();

    const miamiLabel = screen.getByText("Miami Heat");
    expect(miamiLabel).toHaveAttribute("font-weight", "700");
  });

  it("re-enables keyboard panning after zooming back in", async () => {
    const user = userEvent.setup();
    renderChart();

    const weekRangeBefore = screen.getByText(/^Weeks /).textContent;
    await user.click(screen.getByRole("button", { name: /zoom out/i }));
    await user.click(screen.getByRole("button", { name: /zoom in/i }));

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText(/^Weeks /).textContent).not.toBe(weekRangeBefore);
  });

  it("retargets smoothly when re-triggered mid-animation, not resetting to the pre-animation state", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { container } = renderChart();
    const bostonD = () => container.querySelector('path[stroke="#2EAD61"]')?.getAttribute("d");
    const original = bostonD();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));
    // Let it animate partway — confirmed by the path having actually moved — before
    // interrupting, so the interrupt is a genuine mid-flight retarget, not effectively a
    // same-frame cancel.
    await waitFor(() => expect(bostonD()).not.toBe(original), { timeout: 3000 });

    await user.click(screen.getByRole("button", { name: /zoom in/i })); // interrupt mid-flight

    // Immediately after interrupting, the chart continues from wherever it was — it must not
    // jump back to the exact pre-animation state in a single frame (data-model.md: "from* reset
    // to the current (not original) interpolated values").
    expect(bostonD()).not.toBe(original);

    // It still settles back to the exact original windowed end state (FR-004). A generous fixed
    // wait, not a short polling streak (see `tick`'s doc comment on jsdom's bursty rAF timing).
    await tick(2500);
    expectPathsClose(bostonD()!, original!);
  });
});

describe("User Story 3 — zoom state carries across a season switch", () => {
  it("renders a freshly-mounted season already in full-season view", () => {
    // Simulates App.tsx's key={season} remount: a brand new Chart instance, but the
    // lifted `zoomedOut` prop (owned by App, not Chart) is already true.
    const seasonA = buildSeason(25);
    const { unmount } = render(
      <RankingsChart
        teams={seasonA.teams}
        maxWeek={seasonA.maxWeek}
        zoomedOut={true}
        onToggleZoom={vi.fn()}
      />,
    );
    unmount();

    const seasonB = buildSeason(21);
    const { container } = render(
      <RankingsChart
        teams={seasonB.teams}
        maxWeek={seasonB.maxWeek}
        zoomedOut={true}
        onToggleZoom={vi.fn()}
      />,
    );

    expect(weekTickCount(container)).toBe(21);
    expect(screen.getByRole("button", { name: /earlier/i })).toBeDisabled();
  });
});

describe("User Story 3 — panning animates like zooming does", () => {
  it("slides the scale when panning, settling at the exact non-animated target", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { container } = renderChart();
    const bostonD = () => container.querySelector('path[stroke="#2EAD61"]')?.getAttribute("d");
    const beforePan = bostonD();

    await user.click(screen.getByRole("button", { name: /later/i }));

    await waitFor(() => expect(bostonD()).not.toBe(beforePan), { timeout: 3000 });
    const midPan = bostonD();
    expect(midPan).not.toBe(beforePan);

    // No tick-count signal exists for a pan within the windowed view (the tick count is always
    // windowWeeks + 1 regardless of position). Confirm it genuinely stops changing with two
    // samples a generous wait apart, rather than a short polling streak (see `tick`'s doc
    // comment on jsdom's bursty rAF timing).
    await tick(2500);
    const settled1 = bostonD();
    await tick(500);
    expect(bostonD()).toBe(settled1);
  });

  it("animates a team-name label when panning changes its first-visible-week's rank", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { teams, maxWeek, varyingTeamName } = buildVaryingRankFixture();
    const { container } = render(<Harness teams={teams} maxWeek={maxWeek} />);

    expect(labelElement(container, varyingTeamName)?.getAttribute("y")).toBe(String(yOf(5)));

    await user.click(screen.getByRole("button", { name: /later/i }));

    const samples = new Set<string>();
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const y = labelElement(container, varyingTeamName)?.getAttribute("y");
      if (y) samples.add(y);
      if (y === String(yOf(20))) break;
      await tick();
    }

    // More than just the before/after endpoints — real in-between frames (FR-008; SC-005).
    expect(samples.size).toBeGreaterThan(2);
    expect(labelElement(container, varyingTeamName)?.getAttribute("y")).toBe(String(yOf(20)));
  });

  it("retargets a pan smoothly when paged again mid-animation", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { container } = renderChart();
    const bostonD = () => container.querySelector('path[stroke="#2EAD61"]')?.getAttribute("d");
    const original = bostonD();

    await user.click(screen.getByRole("button", { name: /later/i }));
    await waitFor(() => expect(bostonD()).not.toBe(original), { timeout: 3000 });

    await user.click(screen.getByRole("button", { name: /earlier/i })); // interrupt, pan back

    // Settles back to the original position (paging forward then back cancels out) without
    // ever having snapped — the interrupt test above already confirms the no-snap-back
    // behavior directly, so this just confirms panning uses the same retarget path.
    await tick(2500);
    expectPathsClose(bostonD()!, original!);
  });
});

describe("Polish: reduced motion", () => {
  it("skips the zoom animation when prefers-reduced-motion is set", async () => {
    const restore = mockReducedMotion(true);
    try {
      const user = userEvent.setup();
      const { container, maxWeek } = renderChart();

      await user.click(screen.getByRole("button", { name: /zoom out/i }));

      // Settled on the very next render — no waitFor needed, unlike the animated-motion tests.
      expect(weekTickCount(container)).toBe(maxWeek);
    } finally {
      restore();
    }
  });

  it("skips the pan animation when prefers-reduced-motion is set", async () => {
    const restore = mockReducedMotion(true);
    try {
      const user = userEvent.setup();
      const { teams, maxWeek, varyingTeamName } = buildVaryingRankFixture();
      const { container } = render(<Harness teams={teams} maxWeek={maxWeek} />);

      await user.click(screen.getByRole("button", { name: /later/i }));

      expect(labelElement(container, varyingTeamName)?.getAttribute("y")).toBe(String(yOf(20)));
    } finally {
      restore();
    }
  });
});

describe("Cross-cutting: tooltip and keyboard behavior across modes", () => {
  it("closes an open tooltip when the zoom toggle fires", async () => {
    const user = userEvent.setup();
    const { container } = renderChart();

    // Hovering the line first makes it the active team (rendering its per-week dots); the
    // tooltip itself only appears once a specific week's dot is hovered.
    const transparentPaths = container.querySelectorAll('path[stroke="transparent"]');
    fireEvent.mouseEnter(transparentPaths[2]); // Miami is the third team in the fixture
    const miamiDot = container.querySelector('circle[fill="#E0115F"]');
    fireEvent.mouseEnter(miamiDot!);

    expect(screen.getByText(/Week \d+ summary/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

    expect(screen.queryByText(/Week \d+ summary/)).not.toBeInTheDocument();
  });

  it("ignores arrow-key panning while in full-season view", async () => {
    const user = userEvent.setup();
    renderChart();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));
    const label = screen.getByText(/^Full season/).textContent;

    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowLeft" });

    expect(screen.getByText(/^Full season/).textContent).toBe(label);
  });
});

describe("Convergence: interaction accuracy and dynamic control visibility", () => {
  it("shows accurate tooltip content and allows pinning while already in full-season view", { timeout: 10000 }, async () => {
    const user = userEvent.setup();
    const { container } = renderChart();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

    // Hover the line to make it active (renders its per-week dots), then hover a specific
    // week's dot — all while already zoomed out, not across the toggle. Wait for Miami's own
    // dot count (not the tick count, which uses ceil/floor and can reach its final integer set
    // slightly before the exact, unrounded scale bound does) to confirm the animation has
    // truly settled all the way to week 25 before relying on "last dot = week 25".
    const transparentPaths = container.querySelectorAll('path[stroke="transparent"]');
    fireEvent.mouseEnter(transparentPaths[2]); // Miami is the third team in the fixture
    await waitFor(
      () => {
        expect(container.querySelectorAll('circle[fill="#E0115F"]').length).toBe(25);
      },
      { timeout: 3000 },
    );
    const miamiDots = container.querySelectorAll('circle[fill="#E0115F"]');
    const lastDot = miamiDots[miamiDots.length - 1];
    fireEvent.mouseEnter(lastDot);

    expect(screen.getByText("#10 Miami Heat")).toBeInTheDocument();
    expect(screen.getByText(`Week 25 summary`)).toBeInTheDocument();
    expect(screen.getByText("Week 25")).toBeInTheDocument();

    // Pinning while already zoomed out should work the same as in windowed mode.
    await user.click(screen.getByText("Miami Heat"));
    const miamiLabel = screen.getByText("Miami Heat");
    expect(miamiLabel).toHaveAttribute("font-weight", "700");
  });

  it("shows the zoom control on a rerender once maxWeek grows past windowWeeks, with no remount", () => {
    const narrow = buildSeason(9);
    const { rerender } = render(
      <Harness teams={narrow.teams} maxWeek={narrow.maxWeek} windowWeeks={10} />,
    );
    expect(screen.queryByRole("button", { name: /zoom (out|in)/i })).not.toBeInTheDocument();

    const wide = buildSeason(11);
    rerender(<Harness teams={wide.teams} maxWeek={wide.maxWeek} windowWeeks={10} />);

    expect(screen.getByRole("button", { name: /zoom out/i })).toBeInTheDocument();
  });
});

afterEach(() => {
  cleanup();
});
