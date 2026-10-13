import { useId } from "react";
import { Teams, type WeekRanking } from "../../types";
import { getYforRank } from "../Chart/utils";

const PADDING = 3;
const MARGIN = { top: PADDING, right: PADDING, bottom: PADDING, left: PADDING };
const BAND_SIZE = Teams.length / 3;
const TOP_COLOR = "#30D158";
const MIDDLE_COLOR = "#FFD60A";
const BOTTOM_COLOR = "#FF453A";

interface TrendMinimapProps {
  rankings: WeekRanking[];
  maxWeek: number;
  width?: number;
  height?: number;
}

export default function TrendMinimap(props: TrendMinimapProps) {
  const gradientId = useId();
  const width = props.width ?? 96;
  const height = props.height ?? 40;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const lastStep = Math.max(1, props.maxWeek - 1);

  const x = (week: number) => MARGIN.left + ((week - 1) / lastStep) * plotWidth;
  const y = (rank: number) => getYforRank(rank, height, MARGIN);

  // Start a new subpath after a missing week so the line doesn't bridge the gap
  const d = props.rankings
    .map((r, i) => {
      const prev = props.rankings[i - 1];
      const move = !prev || prev.week !== r.week - 1 ? "M" : "L";
      return `${move}${x(r.week)},${y(r.rank)}`;
    })
    .join(" ");

  const topBoundary = y(BAND_SIZE + 0.5) / height;
  const bottomBoundary = y(BAND_SIZE * 2 + 0.5) / height;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={0}
          y2={height}
        >
          <stop offset={topBoundary} stopColor={TOP_COLOR} />
          <stop offset={topBoundary} stopColor={MIDDLE_COLOR} />
          <stop offset={bottomBoundary} stopColor={MIDDLE_COLOR} />
          <stop offset={bottomBoundary} stopColor={BOTTOM_COLOR} />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
