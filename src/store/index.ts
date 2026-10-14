import {
  configureStore,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import seasons from "./seasons";
import navigation from "./navigation";
import chartView from "./chartView";
import selection from "./selection";

export function makeStore() {
  return configureStore({
    reducer: { seasons, navigation, chartView, selection },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;
