import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App";
import { makeStore } from "./store/redux";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={makeStore()}>
      <App />
    </Provider>
  </StrictMode>,
);
