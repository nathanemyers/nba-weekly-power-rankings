import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clamp } from "lodash";
import { DEFAULT_WINDOW_WEEKS } from "components/Chart/Chart";
import { selectSeasonView } from "./seasons";
import type { AppThunk, RootState } from "store/redux";

type ChartViewState = {
  zoomedOut: boolean;
  windowStart: number;
  windowEnd: number;
};

const initialState: ChartViewState = {
  zoomedOut: true,
  windowStart: 1,
  windowEnd: 1 + DEFAULT_WINDOW_WEEKS,
};

const chartViewSlice = createSlice({
  name: "chartView",
  initialState,
  reducers: {
    zoomToggled(state) {
      state.zoomedOut = !state.zoomedOut;
    },
    windowSet(state, action: PayloadAction<{ start: number; end: number }>) {
      state.windowStart = action.payload.start;
      state.windowEnd = action.payload.end;
    },
  },
});

const { windowSet } = chartViewSlice.actions;
export const { zoomToggled } = chartViewSlice.actions;
export default chartViewSlice.reducer;

const selectMaxWeek = (state: RootState) =>
  selectSeasonView(state)?.maxWeek ?? 1;

export const selectZoomedOut = (state: RootState) => state.chartView.zoomedOut;

// Slid back inside the season on read, so a shorter season can't leave the window past its end
export const selectWindowEnd = (state: RootState) =>
  Math.min(state.chartView.windowEnd, selectMaxWeek(state));

export const selectWindowStart = (state: RootState) =>
  Math.max(
    1,
    selectWindowEnd(state) -
      (state.chartView.windowEnd - state.chartView.windowStart),
  );

export const selectStartWeek = (state: RootState) =>
  selectZoomedOut(state) ? 1 : selectWindowStart(state);

export const selectEndWeek = (state: RootState) =>
  selectZoomedOut(state) ? selectMaxWeek(state) : selectWindowEnd(state);

export const selectCanPageEarlier = (state: RootState) =>
  !selectZoomedOut(state) && selectWindowStart(state) > 1;

export const selectCanPageLater = (state: RootState) =>
  !selectZoomedOut(state) && selectWindowEnd(state) < selectMaxWeek(state);

export const selectCanZoom = (state: RootState) =>
  selectWindowStart(state) > 1 || selectWindowEnd(state) < selectMaxWeek(state);

export const pageWindow =
  (delta: number): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    if (selectZoomedOut(state)) return;
    const start = selectWindowStart(state);
    const end = selectWindowEnd(state);
    const weeks = clamp(delta, 1 - start, selectMaxWeek(state) - end);
    if (weeks === 0) return;
    dispatch(windowSet({ start: start + weeks, end: end + weeks }));
  };
