// src/lib/db/adapters/runtimeRequire.ts
/**
 * Runtime `require` for dynamically-loaded modules (better-sqlite3, node:sqlite,
 * sql.js, sqlite-vec, bun:sqlite).
 *
 * Why not `createRequire(import.meta.url)`: Next.js's webpack standalone build
 * rewrites `import.meta.url` inside `createRequire(...)` calls to a literal
 * `"/"` (resolution anchored at the filesystem root), and any createRequire
 * call whose anchor is NOT statically foldable is replaced with `void 0`
 * (observed: `(0, h.Q) is not a function` / `(void 0) is not a function`, with
 * the real initializer extracted into a side-effect module dropped from the
 * output). In the deployed bundle the native sync drivers (better-sqlite3 /
 * node:sqlite) then fail with MODULE_NOT_FOUND and the app silently falls back
 * to the sql.js WASM tier, which rewrites the whole DB file non-atomically and
 * ignores WAL — a corruption/availability regression for production databases.
 *
 * `eval("require")` reaches Node's real CJS require inside a webpack chunk
 * (chunks are CommonJS modules; webpack does not parse eval contents), so the
 * drivers resolve from the bundle's own node_modules. Outside webpack (dev via
 * tsx, tests, Bun) `eval("require")` is unavailable in ESM scope and the
 * fallback `createRequire(import.meta.url)` is correct — `import.meta.url` is
 * only rewritten by the bundler.
 */
import { createRequire } from "node:module";

type NativeRequire = NodeRequire;

function nativeRequireOrNull(): NativeRequire | null {
  try {
    // Webpack leaves eval opaque, preserving access to the chunk's CJS require.
    // eslint-disable-next-line no-eval -- required to bypass webpack's createRequire rewrite
    const native = eval("require") as unknown;
    return typeof native === "function" ? (native as NativeRequire) : null;
  } catch {
    return null; // ESM context (dev/test) — createRequire fallback below
  }
}

export function runtimeRequire(specifier: string): unknown {
  const native = nativeRequireOrNull();
  if (native) return native(specifier);
  return createRequire(import.meta.url)(specifier);
}
