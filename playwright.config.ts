import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./tests",
  use: {
    baseURL: process.env.PB_URL || "http://localhost:5173",
  },
};

export default config;
