import { defineConfig } from "@playwright/test";
import { config as dotenv } from "dotenv";

dotenv();

const port = process.env.PORT ?? "3000";

export default defineConfig({
  testDir: "./playwright/tests",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
});
