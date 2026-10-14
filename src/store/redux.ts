import {
  configureStore,
  type ThunkAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import seasons from "./slices/seasons/seasons";
import navigation from "./slices/navigation/navigation";
import chartView from "./slices/chartView/chartView";
import selection from "./slices/selection/selection";

export function makeStore() {
  return configureStore({
    reducer: { seasons, navigation, chartView, selection },
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk = ThunkAction<void, RootState, unknown, UnknownAction>;
