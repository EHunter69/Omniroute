// src/lib/db/adapters/runtimeRequire.ts
/**
 * Runtime `require` for dynamically-loaded modules (better-sqlite3, node:sqlite,
 * sql.js, sqlite-vec, bun:sqlite).
 *
 * Why not `createRequire(import.meta.url)`: Next.js's webpack standalone build
 * rewrites `import.meta.url` inside `createRequire(...)` calls to a literal
 * `"/"`, anchoring module resolution at the filesystem root. In the deployed
 * bundle the native sync drivers (better-sqlite3 / node:sqlite) then fail with
 * MODULE_NOT_FOUND and the app silently falls back to the sql.js WASM tier,
 * which rewrites the whole DB file non-atomically and ignores WAL — a
 * corruption/availability regression for production databases.
 *
 * Anchor at the process entry module instead: its directory always contains
 * node_modules — the standalone root (dist/) at runtime, the repo root in dev
 * and under the test runner. `createRequire` only uses the anchor's directory
 * for resolution, so the anchor file itself never needs to exist.
 */
import { createRequire } from "node:module";
import path from "node:path";

function resolveAnchor(): string {
  const entry = process.argv[1];
  if (typeof entry === "string" && entry.length > 0) {
    return path.join(path.dirname(path.resolve(entry)), "runtime-require-anchor.js");
  }
  return path.join(process.cwd(), "runtime-require-anchor.js");
}

export const runtimeRequire = createRequire(resolveAnchor());
