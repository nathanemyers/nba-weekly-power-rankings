import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import RankingsChart from "./Chart";
import { Team, type TeamRankings } from "types";
import { buildTeams, mockReducedMotion } from "test/fixtures";

const WIDTH = 960;
const HEIGHT = 600;
const MARGIN = { top: 30, right: 120, bottom: 60, left: 190 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;

const BOSTON = "#2EAD61";
const LAKERS = "#B388FF";
const MIAMI = "#E0115F";

type Overrides = {
  teams?: TeamRankings[];
  startWeek?: number;
  endWeek?: number;
  pinnedTeams?: Team[];
  onClick?: (team?: Team) => void;
};

function chart(overrides: Overrides = {}) {
  return (
    <RankingsChart
      teams={buildTeams()}
      startWeek={1}
      endWeek={11}
      width={WIDTH}
      height={HEIGHT}
      margin={MARGIN}
      pinnedTeams={[]}
      onClick={() => {}}
      {...overrides}
    />
  );
}

function yOf(rank: number) {
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  return MARGIN.top + ((rank - 1) / 29) * plotHeight;
}

function weekTicks(container: HTMLElement) {
  return Array.from(container.querySelectorAll(".week-ticks text")).map(
    (el) => el.textContent,
  );
}

function linePath(container: HTMLElement, color: string) {
  return container.querySelector(`path[stroke="${color}"]`);
}

function hitPath(container: HTMLElement, index: number) {
  return container.querySelectorAll('path[stroke="transparent"]')[index];
}

// jsdom fires requestAnimationFrame in bursts, so settling uses generous fixed waits
async function tick(ms = 30) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

// A settled animated value can differ from the exact one by a floating-point ULP
function expectPathsClose(actual: string, expected: string) {
  const numbers = (d: string) =>
    Array.from(d.matchAll(/-?[\d.]+/g)).map(Number);
  const a = numbers(actual);
  const e = numbers(expected);
  expect(a.length).toBe(e.length);
  a.forEach((value, i) => expect(value).toBeCloseTo(e[i], 1));
}

afterEach(() => {
  cleanup();
});

describe("User Story 1 — read the chart correctly", () => {
  it("shows a tick for every visible week, including the last", () => {
    const { container } = render(chart());
    expect(weekTicks(container)).toEqual(
      Array.from({ length: 11 }, (_, i) => String(i + 1)),
    );
  });

  it("places each label at the team's rank in the first visible week", () => {
    render(chart());
    expect(screen.getByText("Detroit Pistons")).toHaveAttribute(
      "y",
      String(yOf(15)),
    );
    cleanup();

    render(chart({ startWeek: 2, endWeek: 12 }));
    expect(screen.getByText("Detroit Pistons")).toHaveAttribute(
      "y",
      String(yOf(20)),
    );
  });

  it("labels a team missing the first visible week at its next ranked week", () => {
    render(chart({ startWeek: 10, endWeek: 20 }));
    expect(screen.getByText("Los Angeles Lakers")).toHaveAttribute(
      "y",
      String(yOf(5)),
    );
  });

  it("omits the label of a team with no ranking in view", () => {
    const teams = buildTeams().map((team) =>
      team.teamId === Team.Miami
        ? { ...team, rankings: team.rankings.slice(0, 3) }
        : team,
    );
    render(chart({ teams, startWeek: 10, endWeek: 20 }));
    expect(screen.queryByText("Miami Heat")).not.toBeInTheDocument();
    expect(screen.getByText("Boston Celtics")).toBeInTheDocument();
  });

  it("shows a medal beside every playoff team, for every stage in the data", () => {
    const { container } = render(chart());
    const titles = Array.from(
      container.querySelectorAll(".team-medals title"),
    ).map((el) => el.textContent);
    expect(titles).toEqual(["NBA champion", "Lost in the second round"]);
  });

  it("shows the end-of-season medal column only when the last week is in view", () => {
    const { container } = render(chart());
    expect(container.querySelector(".playoff-column")).toBeNull();
    cleanup();

    const zoomedOut = render(chart({ startWeek: 1, endWeek: 25 }));
    const column = zoomedOut.container.querySelector(".playoff-column");
    expect(column?.querySelectorAll("title").length).toBe(2);
    cleanup();

    const lastWindow = render(chart({ startWeek: 15, endWeek: 25 }));
    expect(
      lastWindow.container.querySelector(".playoff-column"),
    ).not.toBeNull();
  });

  it("keeps a gap in a team's line across a week it wasn't ranked", () => {
    const { container } = render(chart({ startWeek: 1, endWeek: 25 }));
    const d = linePath(container, LAKERS)?.getAttribute("d") ?? "";
    expect(d.match(/M/g)?.length).toBe(2);
  });

  it("shows the playoffs marker inside the plot only while its week is in view", () => {
    render(chart());
    expect(screen.queryByText("Playoffs Begin")).not.toBeInTheDocument();
    cleanup();

    render(chart({ startWeek: 1, endWeek: 25 }));
    const x = Number(screen.getByText("Playoffs Begin").getAttribute("x"));
    expect(x).toBeGreaterThanOrEqual(MARGIN.left);
    expect(x).toBeLessThanOrEqual(MARGIN.left + PLOT_WIDTH);
  });
});

describe("User Story 2 — transitions between week ranges", () => {
  it(
    "moves continuously when zooming out and settles on the full season",
    { timeout: 10000 },
    async () => {
      const { container, rerender } = render(chart());
      const bostonD = () => linePath(container, BOSTON)?.getAttribute("d");
      const initial = bostonD();

      rerender(chart({ startWeek: 1, endWeek: 25 }));

      const samples: string[] = [];
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline && weekTicks(container).length !== 25) {
        const d = bostonD();
        if (d && !samples.includes(d)) samples.push(d);
        await tick();
      }
      await tick(1000);

      expect(samples.length).toBeGreaterThan(2);
      expect(bostonD()).not.toBe(initial);
      expect(weekTicks(container).length).toBe(25);
    },
  );

  it(
    "settles a pan exactly where a non-animated render would be",
    { timeout: 10000 },
    async () => {
      const { container, rerender } = render(chart());
      const bostonD = () => linePath(container, BOSTON)?.getAttribute("d");
      const before = bostonD();

      rerender(chart({ startWeek: 2, endWeek: 12 }));
      await waitFor(() => expect(bostonD()).not.toBe(before), {
        timeout: 3000,
      });
      await tick(2500);
      const settled = bostonD()!;
      cleanup();

      const fresh = render(chart({ startWeek: 2, endWeek: 12 }));
      expectPathsClose(
        settled,
        linePath(fresh.container, BOSTON)!.getAttribute("d")!,
      );
    },
  );

  it(
    "glides a team label when panning changes its first visible week's rank",
    { timeout: 10000 },
    async () => {
      const { rerender } = render(chart());
      const labelY = () =>
        screen.getByText("Detroit Pistons").getAttribute("y")!;

      rerender(chart({ startWeek: 2, endWeek: 12 }));

      const samples: string[] = [];
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const y = labelY();
        if (!samples.includes(y)) samples.push(y);
        if (y === String(yOf(20))) break;
        await tick();
      }

      expect(samples.length).toBeGreaterThan(2);
      expect(labelY()).toBe(String(yOf(20)));
    },
  );

  it(
    "retargets from the current position when interrupted mid-flight",
    { timeout: 10000 },
    async () => {
      const { container, rerender } = render(chart());
      const bostonD = () => linePath(container, BOSTON)?.getAttribute("d");
      const original = bostonD();

      rerender(chart({ startWeek: 1, endWeek: 25 }));
      await waitFor(() => expect(bostonD()).not.toBe(original), {
        timeout: 3000,
      });

      rerender(chart());
      expect(bostonD()).not.toBe(original);

      await tick(2500);
      expectPathsClose(bostonD()!, original!);
    },
  );

  it("skips the animation when reduced motion is requested", () => {
    const restore = mockReducedMotion(true);
    try {
      const { container, rerender } = render(chart());

      rerender(chart({ startWeek: 1, endWeek: 25 }));
      expect(weekTicks(container).length).toBe(25);

      rerender(chart({ startWeek: 2, endWeek: 12 }));
      expect(screen.getByText("Detroit Pistons")).toHaveAttribute(
        "y",
        String(yOf(20)),
      );
    } finally {
      restore();
    }
  });
});

describe("User Story 3 — inspect and follow a team", () => {
  it("highlights a hovered team, dims the others, and shows its dots", () => {
    const { container } = render(chart());
    expect(container.querySelectorAll("circle").length).toBe(0);

    fireEvent.mouseEnter(hitPath(container, 2));

    expect(linePath(container, MIAMI)).toHaveAttribute("stroke-width", "3");
    expect(linePath(container, BOSTON)).toHaveAttribute("opacity", "0.25");
    expect(container.querySelectorAll(`circle[fill="${MIAMI}"]`).length).toBe(
      11,
    );
    expect(screen.getByText("Miami Heat")).toHaveAttribute(
      "font-weight",
      "700",
    );
  });

  it("highlights a team when its label is hovered", () => {
    const { container } = render(chart());
    fireEvent.mouseEnter(screen.getByText("Miami Heat"));
    expect(linePath(container, MIAMI)).toHaveAttribute("stroke-width", "3");
  });

  it("shows rank, full team name, record, summary and week in the tooltip", () => {
    const { container } = render(chart());
    fireEvent.mouseEnter(hitPath(container, 2));
    const dots = container.querySelectorAll(`circle[fill="${MIAMI}"]`);
    fireEvent.mouseEnter(dots[2]);

    expect(screen.getByText("#10 Miami Heat (2-0)")).toBeInTheDocument();
    expect(screen.getByText("Week 3 summary")).toBeInTheDocument();
    expect(screen.getByText("Week 3")).toBeInTheDocument();
  });

  it("closes an open tooltip when the zoom changes", () => {
    const restore = mockReducedMotion(true);
    try {
      const { container, rerender } = render(chart());
      fireEvent.mouseEnter(hitPath(container, 2));
      fireEvent.mouseEnter(container.querySelector(`circle[fill="${MIAMI}"]`)!);
      expect(screen.getByText("Week 1 summary")).toBeInTheDocument();

      rerender(chart({ startWeek: 1, endWeek: 25 }));
      expect(screen.queryByText("Week 1 summary")).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it("keeps the pinned team highlighted while another team is hovered", () => {
    const { container } = render(chart({ pinnedTeams: [Team.Miami] }));

    expect(screen.getByText("Miami Heat")).toHaveAttribute(
      "font-weight",
      "700",
    );
    expect(screen.getByText("Boston Celtics")).toHaveAttribute(
      "fill",
      "#5c5c63",
    );

    fireEvent.mouseEnter(hitPath(container, 0));

    expect(linePath(container, MIAMI)).toHaveAttribute("stroke-width", "3");
    expect(linePath(container, BOSTON)).toHaveAttribute("stroke-width", "1.5");
    expect(container.querySelectorAll(`circle[fill="${BOSTON}"]`).length).toBe(
      0,
    );
  });

  it("reports clicks on a line, a label, and the background", () => {
    const onClick = vi.fn();
    const { container } = render(chart({ onClick }));

    fireEvent.click(hitPath(container, 0));
    expect(onClick).toHaveBeenLastCalledWith(Team.Boston);

    fireEvent.click(screen.getByText("Miami Heat"));
    expect(onClick).toHaveBeenLastCalledWith(Team.Miami);

    fireEvent.click(screen.getByRole("img"));
    expect(onClick).toHaveBeenLastCalledWith(undefined);
    expect(onClick).toHaveBeenCalledTimes(3);
  });
});
