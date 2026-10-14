import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App";
import { renderWithStore } from "test/renderWithStore";

vi.mock("./data/seasons", () => ({
  seasons: ["bad"],
  seasonData: { bad: { season: "bad", rankings: {} } },
}));

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

it("shows a message when no season passes validation", () => {
  renderWithStore(<App />);
  expect(screen.getByText("No season data available")).toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});
