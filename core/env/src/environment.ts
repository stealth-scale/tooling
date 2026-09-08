/**
 * @fileoverview Puts the machine's variables above the files' and reads one out. A named
 * variable answers with its value, an unnamed one with the single written default, and
 * `readRequired` raises an error naming what to set rather than defaulting quietly.
 */

import { readEnvFiles, type Variables } from './files.ts'

/**
 * Describes where an environment is read from.
 */
export interface EnvironmentOptions {
  /**
   * Names the directory holding the environment files. Default: the process's working
   * directory.
   */
  directory?: string | undefined

  /**
   * Carries what the machine already set, which wins over every file. A name it set to
   * nothing did not set it. Default: `process.env`.
   */
  machine?: Readonly<Record<string, string | undefined>> | undefined

  /**
   * Names the mode whose files layer above the shared ones, such as `test`. Default: none,
   * so only `.env` and `.env.local` are read.
   */
  mode?: string | undefined
}

/**
 * Reports a required variable that nothing set. `readRequired` throws it.
 *
 * The message names the variable, so the person reading a failed start knows what to set
 * rather than which line threw.
 */
export class MissingVariableError extends Error {
  /**
   * Names the variable that was not set.
   */
  readonly variable: string

  /**
   * Builds the error for one variable.
   *
   * @param {string} variable - The name that was read and not found.
   */
  constructor(variable: string) {
    super(`${variable} is not set. Add it to .env, or export it before starting.`)
    this.name = 'MissingVariableError'
    this.variable = variable
  }
}

/**
 * Reads what the machine really set, dropping a name it set to nothing.
 *
 * An exported variable with an empty value is a deployment that interpolated a name nothing
 * filled in, not a deliberate empty. Letting it win would hide the file that does carry the
 * value, and hide it as an empty string rather than as an absence a default could answer.
 *
 * @param {Readonly<Record<string, string | undefined>>} machine - The machine's variables,
 *     as the platform types them.
 * @returns {Variables} The names the machine set to something.
 */
function machineVariables(machine: Readonly<Record<string, string | undefined>>): Variables {
  return Object.fromEntries(
    Object.entries(machine).filter(
      (entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '',
    ),
  )
}

/**
 * Reads a variable, or the written default where nothing set it.
 *
 * @param {Variables} variables - The layered environment, as `environment` builds it.
 * @param {string} name - The variable to read.
 * @param {string} fallback - The value to use when nothing set it. It is the one written
 *     default, and the reason absence needs no branch on an environment's name.
 * @returns {string} The value that was set, or the fallback.
 */
export function read(variables: Variables, name: string, fallback: string): string {
  return variables[name] ?? fallback
}

/**
 * Reads a variable that has no sensible default.
 *
 * @param {Variables} variables - The layered environment, as `environment` builds it.
 * @param {string} name - The variable to read.
 * @returns {string} The value that was set.
 * @throws {MissingVariableError} When nothing set the variable.
 */
export function readRequired(variables: Variables, name: string): string {
  const value = variables[name]
  if (value === undefined) throw new MissingVariableError(name)
  return value
}

/**
 * Builds the environment a process runs under: every file the mode layers, with whatever the
 * machine already set on top.
 *
 * The machine wins on purpose. A file is what a repository ships for a developer; an exported
 * variable is what a deployment sets, and a deployment must not be overridden by a file that
 * happened to be in the image. A name the machine set to nothing is not an override, so a
 * file below it still counts.
 *
 * @param {Readonly<EnvironmentOptions>} options - Where to read from; every member is
 *     documented on `EnvironmentOptions`, and anything absent takes its default.
 * @returns {Variables} Every variable, the machine's value winning over any file's.
 */
export function environment(options: Readonly<EnvironmentOptions> = {}): Variables {
  const files = readEnvFiles(options.directory ?? process.cwd(), options.mode)

  return { ...files, ...machineVariables(options.machine ?? process.env) }
}
