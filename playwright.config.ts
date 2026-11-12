import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dbPath = join(tmpdir(), "korean-learning-e2e", `e2e-${process.pid}-${Date.now()}.sqlite`);
export default defineConfig({testDir:"./e2e",testMatch:"**/*.e2e.ts",workers:1,use:{baseURL:"http://127.0.0.1:3101",headless:true},webServer:[{command:"node scripts/mock-ollama.mjs",url:"http://127.0.0.1:11435/",reuseExistingServer:false,timeout:30000},{command:"pnpm db:setup && pnpm exec next dev --port 3101",url:"http://127.0.0.1:3101",reuseExistingServer:false,timeout:120000,env:{AI_PROVIDER:"ollama",OLLAMA_BASE_URL:"http://127.0.0.1:11435",OLLAMA_MODEL:"test-model",KOREAN_DB_PATH:dbPath}}]});
