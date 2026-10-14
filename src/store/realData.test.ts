import { expect, it } from "vitest";
import { seasonData, seasons } from "data/seasons";
import { loadSeasons } from "./slices/seasons/loadSeasons";

it("validates every bundled season", () => {
  const state = loadSeasons(seasons, seasonData);
  expect(state.invalid).toEqual([]);
  expect(state.order).toHaveLength(9);
});
