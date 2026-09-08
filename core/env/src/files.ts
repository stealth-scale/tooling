/**
 * @fileoverview Reads the environment files a repository layers, in the order that decides
 * which value wins. Node parses the format; what this adds is the layering, tolerance of a
 * file that is not there, and reading into a value rather than mutating `process.env`.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'

/**
 * Maps a variable's name to the value read for it.
 */
export type Variables = Readonly<Record<string, string>>

/**
 * Drops the entries nothing set, so what is left satisfies {@link Variables}.
 *
 * `parseEnv` and `process.env` are both typed as holding `undefined` values. Neither produces
 * one in practice, and a caller should not have to ask: a name is either in the environment
 * with a value or it is not in it at all.
 *
 * @param {Readonly<Record<string, string | undefined>>} entries - The variables as the
 *     platform types them, with `undefined` allowed for a name it does not hold.
 * @returns {Variables} The same entries without those set to nothing.
 */
export function onlyDefined(entries: Readonly<Record<string, string | undefined>>): Variables {
  return Object.fromEntries(
    Object.entries(entries).filter((entry): entry is [string, string] => entry[1] !== undefined),
  )
}

/**
 * Names the files a mode reads, nearest the machine last, so a later file wins.
 *
 * A `.local` file holds what one machine sets and no repository commits. A mode's files sit
 * above the shared ones, so `.env.test.local` beats `.env.test`, which beats `.env.local`,
 * which beats `.env`.
 *
 * @param {string} [mode] - The mode to layer, such as `test` or `production`. Left out, only
 *     the two shared files are read.
 * @returns {string[]} The file names, in the order they are read.
 */
export function envFiles(mode?: string): string[] {
  const shared = ['.env', '.env.local']
  return mode === undefined ? shared : [...shared, `.env.${mode}`, `.env.${mode}.local`]
}

/**
 * Reads one environment file, treating a file that is not there as empty.
 *
 * Only absence is tolerated. A file that exists and cannot be read — a directory, a
 * permission refusal — is a fault the caller should hear about rather than a missing value
 * it will chase later.
 *
 * @param {string} path - The file to read.
 * @returns {Variables} The variables the file declares, empty when there is no such file.
 * @throws {Error} When the file exists and cannot be read.
 */
export function readEnvFile(path: string): Variables {
  try {
    return onlyDefined(parseEnv(readFileSync(path, 'utf8')))
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return {}
    throw error
  }
}

/**
 * Reads a directory's environment files and layers them into one set of variables.
 *
 * Nothing here reads or writes `process.env`. A caller that wants the process's own values to
 * win passes them to `environment`, which is where precedence between the machine and the
 * files is decided.
 *
 * The layers are collected as entries rather than assigned onto one object. `Object.assign`
 * writes through a setter, so a file that declares `__proto__` would be swallowed by the
 * setter on `Object.prototype` and read back as an object, which is not what
 * {@link Variables} promises.
 *
 * @param {string} directory - The directory holding the files, usually the repository root.
 * @param {string} [mode] - The mode to layer. Left out, only `.env` and `.env.local` are read.
 * @returns {Variables} Every variable the files declare, a later file's value winning.
 * @throws {Error} When one of the files exists and cannot be read.
 */
export function readEnvFiles(directory: string, mode?: string): Variables {
  return Object.fromEntries(
    envFiles(mode).flatMap((name) => Object.entries(readEnvFile(join(directory, name)))),
  )
}
