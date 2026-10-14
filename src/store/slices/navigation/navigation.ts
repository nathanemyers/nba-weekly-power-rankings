import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { initialSeasons } from "@/store/slices/seasons/seasons";
import type { RootState } from "store/redux";

// Holds what the visitor is looking at; future routes and UI state belong here too
type NavigationState = { season: string | undefined };

const initialState: NavigationState = { season: initialSeasons.order[0] };

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    seasonSelected(state, action: PayloadAction<string>) {
      state.season = action.payload;
    },
  },
});

export const { seasonSelected } = navigationSlice.actions;
export default navigationSlice.reducer;

export const selectSeason = (state: RootState) => state.navigation.season;
