import { config } from "dotenv";
config({ path: ".env.test", override: true }); // tests must never touch the development database
(process.env as Record<string, string>).NODE_ENV = "test";
