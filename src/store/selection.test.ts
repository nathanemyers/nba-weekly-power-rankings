import { describe, expect, it, vi } from "vitest";
import { Team } from "types";
import { makeStore } from ".";
import { seasonSelected } from "./navigation";
import { pinToggled, selectPinnedTeam, selectPinnedTeams } from "./selection";

vi.mock(
  "../data/seasons",
  async () => (await import("test/mockSeasons")).mockSeasons,
);

describe("selection", () => {
  it("toggles a single pinned team", () => {
    const store = makeStore();
    store.dispatch(pinToggled(Team.Boston));
    expect(selectPinnedTeams(store.getState())).toEqual([Team.Boston]);
    const pinned = selectPinnedTeam(store.getState());
    expect(pinned?.teamId).toBe(Team.Boston);
    expect(pinned?.aiSummary).toBe("Boston led from the first week.");

    store.dispatch(pinToggled(Team.Miami));
    expect(selectPinnedTeams(store.getState())).toEqual([Team.Miami]);

    store.dispatch(pinToggled(Team.Miami));
    expect(selectPinnedTeams(store.getState())).toEqual([]);
    expect(selectPinnedTeam(store.getState())).toBeUndefined();
  });

  it("clears the pin with no team or on a season change", () => {
    const store = makeStore();
    store.dispatch(pinToggled(Team.Boston));
    store.dispatch(pinToggled(undefined));
    expect(selectPinnedTeams(store.getState())).toEqual([]);

    store.dispatch(pinToggled(Team.Boston));
    store.dispatch(seasonSelected("short"));
    expect(selectPinnedTeams(store.getState())).toEqual([]);
  });
});
