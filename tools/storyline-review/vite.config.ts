import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import babel from "@rolldown/plugin-babel";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import storylineReview from "./review-plugin.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

// Internal storyline review tool; never built or deployed with the site
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    storylineReview(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5180,
    fs: { allow: [repoRoot] },
  },
});
