import { describe, expect, it } from "vitest";
import { biggestSwings, getRankSwing } from "./utils";
import { Team, Teams, type TeamRankings } from "types";

// One ranking per listed rank, on consecutive weeks from startWeek
function team(teamId: Team, ranks: number[], startWeek = 1): TeamRankings {
  const display = Teams.find((t) => t.teamId === teamId)!;
  return {
    ...display,
    rankings: ranks.map((rank, i) => ({
      week: startWeek + i,
      rank,
      summary: "",
    })),
  };
}

const ids = (swings: { team: TeamRankings }[]) =>
  swings.map((swing) => swing.team.teamId);

describe("getRankSwing", () => {
  it("measures from the team's own first and last recorded weeks", () => {
    const swing = getRankSwing(team(Team.GoldenState, [9, 14, 29], 3));

    expect(swing).toMatchObject({ startRank: 9, endRank: 29, change: -20 });
  });

  it("is positive for a rise", () => {
    expect(getRankSwing(team(Team.Indiana, [26, 20, 9]))?.change).toBe(17);
  });

  it("has no swing for fewer than two recorded weeks", () => {
    expect(getRankSwing(team(Team.Orlando, [12]))).toBeUndefined();
    expect(getRankSwing(team(Team.Orlando, []))).toBeUndefined();
  });
});

describe("biggestSwings", () => {
  it("splits risers and fallers, largest first", () => {
    const { risers, fallers } = biggestSwings([
      team(Team.Utah, [12, 4]),
      team(Team.Washington, [7, 17]),
      team(Team.Indiana, [26, 9]),
      team(Team.Memphis, [16, 29]),
      team(Team.Boston, [1, 1]),
    ]);

    expect(ids(risers)).toEqual([Team.Indiana, Team.Utah]);
    expect(ids(fallers)).toEqual([Team.Memphis, Team.Washington]);
  });

  it("keeps every team tied with the third and drops the rest", () => {
    const { risers } = biggestSwings([
      team(Team.Toronto, [8, 2]),
      team(Team.Utah, [12, 4]),
      team(Team.Indiana, [26, 9]),
      team(Team.Portland, [13, 5]),
      team(Team.Philadelphia, [20, 5]),
    ]);

    expect(ids(risers)).toEqual([
      Team.Indiana,
      Team.Philadelphia,
      Team.Utah,
      Team.Portland,
    ]);
  });

  it("applies the same tie rule to fallers", () => {
    const { fallers } = biggestSwings([
      team(Team.GoldenState, [6, 17]),
      team(Team.LALakers, [5, 15]),
      team(Team.Cleveland, [8, 18]),
      team(Team.Memphis, [13, 23]),
      team(Team.Toronto, [19, 26]),
    ]);

    expect(ids(fallers)).toEqual([
      Team.GoldenState,
      Team.LALakers,
      Team.Cleveland,
      Team.Memphis,
    ]);
  });

  it("returns what there is when fewer than three teams moved", () => {
    const { risers, fallers } = biggestSwings([
      team(Team.Indiana, [26, 9]),
      team(Team.Utah, [12, 4]),
    ]);

    expect(risers).toHaveLength(2);
    expect(fallers).toEqual([]);
  });

  it("leaves out unchanged teams and teams with a single week", () => {
    const { risers, fallers } = biggestSwings([
      team(Team.Boston, [1, 3, 1]),
      team(Team.Orlando, [30]),
    ]);

    expect(risers).toEqual([]);
    expect(fallers).toEqual([]);
  });
});
