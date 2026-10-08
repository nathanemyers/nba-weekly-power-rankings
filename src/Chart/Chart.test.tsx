import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
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

describe("User Story 1 — see the whole season at a glance", () => {
  it("shows every recorded week once zoomed out, with no paging controls", async () => {
    const user = userEvent.setup();
    const { container, maxWeek } = renderChart();

    expect(weekTickCount(container)).toBe(11); // windowWeeks (10) + 1 inclusive ticks

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

    expect(weekTickCount(container)).toBe(maxWeek);
    // Stay visible (but inactive) rather than disappearing, so the controls row doesn't
    // jump around when toggling zoom.
    expect(screen.getByRole("button", { name: /earlier/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /later/i })).toBeDisabled();
  });

  it("positions the playoffs marker within the full-season plot bounds", async () => {
    const user = userEvent.setup();
    renderChart();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

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
  it("shows accurate tooltip content and allows pinning while already in full-season view", async () => {
    const user = userEvent.setup();
    const { container } = renderChart();

    await user.click(screen.getByRole("button", { name: /zoom out/i }));

    // Hover the line to make it active (renders its per-week dots), then hover a specific
    // week's dot — all while already zoomed out, not across the toggle.
    const transparentPaths = container.querySelectorAll('path[stroke="transparent"]');
    fireEvent.mouseEnter(transparentPaths[2]); // Miami is the third team in the fixture
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
