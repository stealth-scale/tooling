/**
 * @fileoverview Holds the export condition a repository resolves its own packages through,
 * and the conditions list each resolver reads it from.
 *
 * The condition is named after the repository, `tooling-source` rather than one name every
 * repository shares. A shared name follows a package to the registry: `ui` turns its
 * condition on for everything it resolves, so a published `@stealthscale/core-result`
 * carrying the same key would send it to a `src` directory the tarball does not ship. A
 * repository turns on its own name and no other, so a package it installs matches nothing,
 * falls to `default`, and reads what was packed.
 */

import { defaultClientConditions, defaultServerConditions } from 'vite-plus'

/**
 * Builds Vite's `resolve.conditions` for a config inside a stealth workspace: this
 * repository's source condition ahead of Vite's own defaults.
 *
 * Setting `resolve.conditions` replaces the defaults rather than adding to them, which is why
 * they are spread back in. Every Vite config in the workspace sets this, the root and each
 * package that carries one, because a package's own `vite.config.ts` inherits no Vite options
 * from the root's.
 *
 * @param {string} condition - This repository's source condition, such as `tooling-source`.
 * @returns {string[]} The conditions, this repository's own first.
 */
export function sourceConditions(condition: string): string[] {
  return [condition, ...defaultClientConditions]
}

/**
 * Builds the same conditions for the resolver Node runs under, which is the one a
 * specification and a server load a workspace package through.
 *
 * `resolve.conditions` reaches the browser resolver alone. Without this, a specification in
 * one package that imports another reads what that package last built, so a change to the
 * imported source does not fail the specification that covers it and a stale `dist` passes.
 *
 * @param {string} condition - This repository's source condition, such as `tooling-source`.
 * @returns {string[]} The conditions, this repository's own first.
 */
export function serverSourceConditions(condition: string): string[] {
  return [condition, ...defaultServerConditions]
}
