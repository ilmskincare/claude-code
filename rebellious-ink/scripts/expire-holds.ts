import "dotenv/config";
import { expireLapsedHolds } from "../src/lib/booking";

/** Scheduler entry point (cron / Vercel Cron / GitHub Action every 5 minutes). */
expireLapsedHolds().then((n) => { console.log(`Released ${n} lapsed pending appointment(s).`); process.exit(0); }).catch((e) => { console.error(e); process.exit(1); });
