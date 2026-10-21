import { config } from "dotenv";
config({ path: ".env.test" });
(process.env as Record<string, string>).NODE_ENV = "test";
