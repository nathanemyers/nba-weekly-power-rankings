import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import TrendMinimap from "./TrendMinimap";
import { weeklyRankings } from "test/fixtures";

afterEach(cleanup);

const pathOf = (container: HTMLElement) =>
  container.querySelector("path") as SVGPathElement;
const moveCount = (path: SVGPathElement) =>
  (path.getAttribute("d") ?? "").match(/M/g)?.length ?? 0;
const lastX = (path: SVGPathElement) => {
  const points = (path.getAttribute("d") ?? "").split(" ");
  return Number(points[points.length - 1].slice(1).split(",")[0]);
};

describe("TrendMinimap", () => {
  it("draws one decorative line for an unbroken season", () => {
    const { container } = render(
      <TrendMinimap rankings={weeklyRankings(25, 5)} maxWeek={25} />,
    );

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelectorAll("path")).toHaveLength(1);
    expect(moveCount(pathOf(container))).toBe(1);
  });

  it("breaks the line at a missing week", () => {
    const rankings = weeklyRankings(25, 5).filter((r) => r.week !== 10);
    const { container } = render(
      <TrendMinimap rankings={rankings} maxWeek={25} />,
    );

    expect(moveCount(pathOf(container))).toBe(2);
  });

  it("colors the line by rank band, green over yellow over red", () => {
    const { container } = render(
      <TrendMinimap rankings={weeklyRankings(25, 5)} maxWeek={25} />,
    );
    const gradient = container.querySelector("linearGradient");
    const stops = Array.from(container.querySelectorAll("stop"));

    expect(gradient).toHaveAttribute("gradientUnits", "userSpaceOnUse");
    expect(pathOf(container)).toHaveAttribute(
      "stroke",
      `url(#${gradient?.getAttribute("id")})`,
    );
    expect(stops.map((s) => s.getAttribute("stop-color"))).toEqual([
      "#30D158",
      "#FFD60A",
      "#FFD60A",
      "#FF453A",
    ]);
    expect(stops[0].getAttribute("offset")).toBe(
      stops[1].getAttribute("offset"),
    );
    expect(stops[2].getAttribute("offset")).toBe(
      stops[3].getAttribute("offset"),
    );
    expect(Number(stops[0].getAttribute("offset"))).toBeLessThan(
      Number(stops[2].getAttribute("offset")),
    );
  });

  it("gives each instance its own gradient", () => {
    const { container } = render(
      <>
        <TrendMinimap rankings={weeklyRankings(25, 5)} maxWeek={25} />
        <TrendMinimap rankings={weeklyRankings(25, 20)} maxWeek={25} />
      </>,
    );
    const ids = Array.from(container.querySelectorAll("linearGradient")).map(
      (g) => g.getAttribute("id"),
    );

    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("stops short of the right edge when the data ends early", () => {
    const full = render(
      <TrendMinimap rankings={weeklyRankings(24, 5)} maxWeek={24} width={96} />,
    );
    const early = render(
      <TrendMinimap rankings={weeklyRankings(21, 5)} maxWeek={24} width={96} />,
    );

    expect(lastX(pathOf(early.container))).toBeLessThan(
      lastX(pathOf(full.container)),
    );
    expect(lastX(pathOf(full.container))).toBeLessThan(96);
  });

  it("renders nothing to draw for empty rankings without throwing", () => {
    const { container } = render(<TrendMinimap rankings={[]} maxWeek={25} />);

    expect(pathOf(container)).toHaveAttribute("d", "");
  });
});
