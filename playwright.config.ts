import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  // Only tests/ — src/**/*.test.ts belong to vitest (`bun run test`).
  testDir: "./tests",
  use: {
    // Dev server default; point at the container with e.g.
    // PB_URL=http://localhost:8090 (needs `ports` below).
    // A raw container hostname (hello-solid-1-app-1) only resolves from
    // inside the compose network, not from the host.
    baseURL: process.env.PB_URL || "http://localhost:5173",
  },
};

export default config;
