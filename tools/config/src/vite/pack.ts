import { type UserConfig } from 'vite-plus'

import { SOURCE_CONDITION } from './source.ts'

/**
 * The `pack` block of a vite-plus config.
 *
 * The field takes one config or a list of them; this is the single one, so a caller reading
 * the result back does not have to narrow a union first.
 */
type PackBlock = Exclude<NonNullable<UserConfig['pack']>, readonly unknown[]>

/**
 * An exports map as the pack step builds it, before and after this config adds to it.
 */
type ExportMap = Record<string, unknown>

/**
 * The manifest fields the pack step exposes while it rewrites a package's exports.
 */
interface PackedManifest {
  /**
   * What the package ships, as `files` declares it, which is what names its stylesheets.
   */
  files?: readonly string[] | undefined
}

/**
 * What the pack step tells `customExports` about the package it is packing.
 */
interface PackedPackage {
  /**
   * The manifest being packed.
   */
  pkg: PackedManifest
}

/**
 * A stylesheet at a package's root, as `files` names it: `source.css`, `styles.css`.
 */
const ROOT_STYLESHEET = /^[\w-]+\.css$/u

/**
 * What a repository or a package may change about how its libraries are packed.
 */
export interface PackOptions {
  /**
   * Each command the package installs mapped to the source file that runs it. The pack step
   * writes both forms of `bin` from this: the source path for the workspace, and the built
   * path for the tarball. Left out, it names one command after the package, which is right
   * only where the package is named for its command.
   */
  bin?: Readonly<Record<string, string>> | undefined

  /**
   * Export paths mapped to the static files that serve them, for what a package ships but a
   * build does not write — a stylesheet, a tsconfig. The pack step rewrites `exports` from
   * what it built, so anything not built is dropped unless it is named here. Given, these
   * replace the automatic derivation; omitted, every root stylesheet the manifest's `files`
   * names is exported at its own path.
   */
  staticExports?: Readonly<Record<string, string>> | undefined
}

/**
 * The exports a package's shipped stylesheets need: one per stylesheet at its root, at the
 * same path.
 *
 * `files` is the one thing the manifest already declares that says the stylesheet is there,
 * which is what makes this derivable rather than a list somebody keeps.
 *
 * @param {readonly string[]} files - The manifest's `files`. Default: none, giving an empty
 *     map.
 * @returns {Record<string, string>} Each stylesheet's export path mapped to itself, empty for
 *     a package that ships none.
 */
export function stylesheetExports(files: readonly string[] = []): Record<string, string> {
  return Object.fromEntries(
    files.filter((file) => ROOT_STYLESHEET.test(file)).map((file) => [`./${file}`, `./${file}`]),
  )
}

/**
 * How a library is packed: per-file ESM, declarations from tsgo, and the `exports` map
 * written back into the manifest so it cannot drift.
 *
 * The map names two conditions — the workspace's own, pointing at the source, and `default`,
 * pointing at what was packed. Every pack is then read the way a registry and a consumer
 * would read it: publint reads the manifest, arethetypeswrong resolves the declarations. The
 * profile is `esm-only` because that is what these packages are; a `main`-less ESM package
 * fails the node10 and CJS resolutions by nature and a finding about them says nothing. A
 * stylesheet is not a module and is excluded, or it fails every resolution the same way.
 *
 * @param {Readonly<PackOptions>} options - The settings this package overrides; every member
 *     is documented on `PackOptions`, and anything absent takes the shared value.
 * @returns {PackBlock} The `pack` block, ready to hand to `defineConfig`.
 */
export function packConfig(options: Readonly<PackOptions> = {}): PackBlock {
  const { bin, staticExports } = options

  return {
    attw: { excludeEntrypoints: [/\.css$/u], profile: 'esm-only' },
    dts: { tsgo: true },
    exports: {
      ...(bin === undefined ? {} : { bin: { ...bin } }),

      // tsdown's option, which vite-plus passes through without re-exporting its type, so
      // the callback's parameters are annotated rather than inferred.
      customExports: staticExports
        ? { ...staticExports }
        : (exports: ExportMap, { pkg }: PackedPackage): ExportMap => ({
            ...exports,
            ...stylesheetExports(pkg.files),
          }),
      devExports: SOURCE_CONDITION,
    },
    publint: true,
  }
}
