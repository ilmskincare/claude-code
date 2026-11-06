import { randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

const scrypt = (password: string, salt: Buffer, keylen: number, opts: { N: number; r: number; p: number }) => new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key))));
const N = 16384, r = 8, p = 1, KEYLEN = 64;

/** scrypt with a per-password salt; stored as `scrypt$N$r$p$salt$hash` (hex). No external dependency. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [algo, n, rr, pp, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const key = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), hashHex.length / 2, { N: Number(n), r: Number(rr), p: Number(pp) });
  const expected = Buffer.from(hashHex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Readable one-time password: four short words and a number, easy to read out at the desk. */
const WORDS = ["ink", "needle", "crown", "rose", "dagger", "swallow", "anchor", "skull", "moth", "tiger", "snake", "star", "moon", "flame", "wave", "bee", "key", "heart", "sun", "cat"];
export function generateTempPassword() {
  const pick = () => WORDS[randomInt(WORDS.length)];
  return `${pick()}-${pick()}-${pick()}-${randomInt(10, 99)}`;
}

/** Rules for a password someone chooses: at least 10 characters, not just one repeated character, not the username. */
export function passwordProblem(password: string, username?: string | null) {
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 200) return "That is too long.";
  if (/^(.)\1+$/.test(password)) return "Pick something less obvious.";
  if (username && password.toLowerCase().includes(username.toLowerCase())) return "Do not use your username in the password.";
  if (["password12", "rebellious", "rebelliousink", "1234567890", "qwertyuiop"].some((w) => password.toLowerCase().includes(w))) return "Pick something less obvious.";
  return null;
}
