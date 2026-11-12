import type { NextConfig } from "next";
const config: NextConfig = { serverExternalPackages: ["better-sqlite3"], allowedDevOrigins: ["127.0.0.1"] };
export default config;
