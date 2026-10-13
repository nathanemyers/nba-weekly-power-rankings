import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { mockReducedMotion } from "./test/fixtures";

// Three fixture seasons: 26 weeks, 21 weeks, and one short enough to fit the window
vi.mock("./data/seasons", async () => {
  const { buildRankings, PLAYOFFS } = await import("./test/fixtures");
  const season = (name: string, maxWeek: number) => ({
    season: name,
    maxWeek,
    rankings: buildRankings(maxWeek),
    playoffs: PLAYOFFS,
  });
  return {
    seasons: ["long", "mid", "short"],
    seasonData: {
      long: season("long", 26),
      mid: season("mid", 21),
      short: season("short", 8),
    },
  };
});

const earlier = () => screen.getByRole("button", { name: /earlier/i });
const later = () => screen.getByRole("button", { name: /later/i });
const zoomOut = () => screen.getByRole("button", { name: /zoom out/i });
const zoomIn = () => screen.getByRole("button", { name: /zoom in/i });
const weekTickCount = (container: HTMLElement) =>
  container.querySelectorAll(".week-ticks text").length;

let restoreMotion: () => void;

beforeEach(() => {
  restoreMotion = mockReducedMotion(true);
});

afterEach(() => {
  cleanup();
  restoreMotion();
});

describe("User Story 2 — move around the season", () => {
  it("starts on a 10-week span with the earlier control disabled", () => {
    const { container } = render(<App />);
    expect(screen.getByText("Weeks 1–11")).toBeInTheDocument();
    expect(weekTickCount(container)).toBe(11);
    expect(earlier()).toBeDisabled();
    expect(later()).not.toBeDisabled();
  });

  it("pages one week at a time with the on-screen controls", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(later());
    expect(screen.getByText("Weeks 2–12")).toBeInTheDocument();
    expect(screen.getByText("Detroit Pistons")).toHaveAttribute(
      "y",
      String(30 + (19 / 29) * 510),
    );

    await user.click(earlier());
    expect(screen.getByText("Weeks 1–11")).toBeInTheDocument();
  });

  it("travels the whole season with the arrow keys, stopping at its ends", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Weeks 2–12")).toBeInTheDocument();

    for (let i = 0; i < 40; i++)
      fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Weeks 16–26")).toBeInTheDocument();
    expect(later()).toBeDisabled();

    for (let i = 0; i < 40; i++)
      fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(screen.getByText("Weeks 1–11")).toBeInTheDocument();
    expect(earlier()).toBeDisabled();
  });

  it("shows the full season with paging disabled and arrow keys ignored", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(zoomOut());

    expect(screen.getByText("Full season (Weeks 1–26)")).toBeInTheDocument();
    expect(weekTickCount(container)).toBe(26);
    expect(earlier()).toBeDisabled();
    expect(later()).toBeDisabled();
    expect(container.querySelector(".playoff-column")).not.toBeNull();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await user.click(zoomIn());
    expect(screen.getByText("Weeks 1–11")).toBeInTheDocument();
  });

  it("restores the window position and pinned team after a zoom round trip", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(later());
    await user.click(screen.getByText("Miami Heat"));
    await user.click(zoomOut());
    await user.click(zoomIn());

    expect(screen.getByText("Weeks 2–12")).toBeInTheDocument();
    expect(earlier()).not.toBeDisabled();
    expect(later()).not.toBeDisabled();
    expect(screen.getByText("Miami Heat")).toHaveAttribute(
      "font-weight",
      "700",
    );

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(screen.getByText("Weeks 3–13")).toBeInTheDocument();
  });

  it("keeps the zoom mode across a season switch", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(zoomOut());
    await user.selectOptions(screen.getByRole("combobox"), "mid");

    expect(screen.getByText("Full season (Weeks 1–21)")).toBeInTheDocument();
    expect(weekTickCount(container)).toBe(21);
  });

  it("keeps the window inside a shorter season after a switch", async () => {
    const user = userEvent.setup();
    render(<App />);

    for (let i = 0; i < 40; i++)
      fireEvent.keyDown(window, { key: "ArrowRight" });
    await user.selectOptions(screen.getByRole("combobox"), "mid");

    expect(screen.getByText("Weeks 11–21")).toBeInTheDocument();
    expect(later()).toBeDisabled();

    await user.click(earlier());
    expect(screen.getByText("Weeks 10–20")).toBeInTheDocument();
  });

  it("hides the zoom control when the season fits the window", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.selectOptions(screen.getByRole("combobox"), "short");

    expect(
      screen.queryByRole("button", { name: /zoom (out|in)/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Weeks 1–8")).toBeInTheDocument();
    expect(weekTickCount(container)).toBe(8);
    expect(earlier()).toBeDisabled();
    expect(later()).toBeDisabled();
  });
});

describe("User Story 3 — pin a team", () => {
  it("pins on click and unpins when the same team is clicked again", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Miami Heat"));
    expect(screen.getByText("Miami Heat")).toHaveAttribute(
      "font-weight",
      "700",
    );

    await user.unhover(screen.getByText("Miami Heat"));
    await user.click(screen.getByText("Boston Celtics"));
    expect(screen.getByText("Boston Celtics")).toHaveAttribute(
      "font-weight",
      "700",
    );
    expect(screen.getByText("Miami Heat")).toHaveAttribute(
      "font-weight",
      "400",
    );

    await user.click(screen.getByText("Boston Celtics"));
    fireEvent.mouseLeave(screen.getByRole("img"));
    expect(screen.getByText("Boston Celtics")).toHaveAttribute(
      "font-weight",
      "400",
    );
  });

  it("unpins when the chart background is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Miami Heat"));
    fireEvent.mouseLeave(screen.getByRole("img"));
    expect(screen.getByText("Miami Heat")).toHaveAttribute(
      "font-weight",
      "700",
    );

    fireEvent.click(screen.getByRole("img"));
    expect(screen.getByText("Miami Heat")).toHaveAttribute(
      "font-weight",
      "400",
    );
  });
});
