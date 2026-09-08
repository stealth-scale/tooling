/**
 * @fileoverview The contract a library logs through, so a package can report what it did
 * without choosing where the words go. A deployment binds one implementation once; every
 * library above it takes a `Logger` and never imports a sink.
 */

/**
 * How much a record matters, from the most detailed to the most serious.
 *
 * The five are pino's and the console's, which is what lets an implementation of {@link
 * Logger} be either without a shim.
 */
export type Level = 'debug' | 'error' | 'info' | 'trace' | 'warn'

/**
 * Every level, from the most detailed to the most serious.
 *
 * The order is the contract `atLeast` compares on; a caller that renders a selector reads it
 * rather than writing the list again.
 */
export const LEVELS: readonly Level[] = ['trace', 'debug', 'info', 'warn', 'error']

/**
 * What a record carries beside its message: the values a reader needs to act on it.
 *
 * A field holds data, never a sentence. The message says what happened; the fields say which
 * package, which request, which row.
 */
export type Fields = Readonly<Record<string, unknown>>

/**
 * Writes one record at one level.
 *
 * @param {string} message - What happened, as a sentence in the present tense. It never
 *     interpolates a value a field could carry instead.
 * @param {Fields} [fields] - The values a reader needs to act on the record. Default: none.
 */
export type Write = (message: string, fields?: Fields) => void

/**
 * What a library logs through.
 *
 * Structural on purpose: pino's logger and a console wrapper both satisfy it without being
 * told about it, so binding one is an assignment rather than an adapter. A library takes this
 * as a parameter and never reaches for a global.
 */
export interface Logger {
  /**
   * Builds a logger that adds these fields to every record it writes, so a caller states
   * which request or which package once rather than at each line.
   *
   * @param {Fields} fields - The values to add to every record. A field the record itself
   *     sets wins over one set here.
   * @returns {Logger} The child. The parent is unchanged.
   */
  child: (fields: Fields) => Logger

  /**
   * Records what a maintainer needs while diagnosing, and nothing a deployment reads.
   */
  debug: Write

  /**
   * Records that something failed and the caller could not go on.
   */
  error: Write

  /**
   * Records a step a deployment expects: started, connected, migrated.
   */
  info: Write

  /**
   * Records the finest detail, such as a value at each step of a loop.
   */
  trace: Write

  /**
   * Records something a person should look at that did not stop the work.
   */
  warn: Write
}

/**
 * Whether a record at one level is serious enough for a threshold.
 *
 * @param {Level} level - The record's level.
 * @param {Level} threshold - The least serious level being kept.
 * @returns {boolean} `true` when the record is at least as serious as the threshold.
 */
export function atLeast(level: Level, threshold: Level): boolean {
  return LEVELS.indexOf(level) >= LEVELS.indexOf(threshold)
}

/**
 * A logger that writes nothing.
 *
 * It is the default a library takes when a caller passes none, so nothing has to guard a
 * logger against being absent. It is a constant rather than a builder because it holds no
 * state and every child of it is itself.
 */
export const SILENT: Logger = {
  child: () => SILENT,
  debug: () => {},
  error: () => {},
  info: () => {},
  trace: () => {},
  warn: () => {},
}
