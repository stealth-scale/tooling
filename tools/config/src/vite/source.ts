import { defaultClientConditions, defaultServerConditions } from 'vite-plus'

/**
 * The export condition only a stealth workspace turns on.
 *
 * Every packed manifest maps its entry to
 * `{ "stealth-source": "./src/index.ts", "default": "./dist/index.mjs" }` — the pack step's
 * `exports.devExports` writes it — so a resolver with the condition on reads the source and
 * one without it reads what was packed. A contributor never builds to see a change; a
 * consumer never resolves a file the tarball does not carry. The shipped `tsconfig/base.json`
 * names the same string under `customConditions` for the type checker.
 */
export const SOURCE_CONDITION = 'stealth-source'

/**
 * Vite's `resolve.conditions` for a config inside a stealth workspace: the source condition
 * ahead of Vite's own defaults.
 *
 * Setting `resolve.conditions` replaces the defaults rather than adding to them, which is why
 * they are spread back in. Every Vite config in the workspace sets this — the root, and each
 * package that carries one — because a package's own `vite.config.ts` inherits no Vite
 * options from the root's.
 *
 * @returns {string[]} The conditions, the workspace's own first.
 */
export function sourceConditions(): string[] {
  return [SOURCE_CONDITION, ...defaultClientConditions]
}

/**
 * The same condition for the resolver Node runs under, which is the one a specification and a
 * server load a workspace package through.
 *
 * `resolve.conditions` reaches the browser resolver alone. Without this, a specification in
 * one package that imports another reads what that package last built, so a change to the
 * imported source does not fail the specification that covers it and a stale `dist` passes.
 *
 * @returns {string[]} The conditions, the workspace's own first.
 */
export function serverSourceConditions(): string[] {
  return [SOURCE_CONDITION, ...defaultServerConditions]
}
