/**
 * @fileoverview A logger that keeps what it was told, so a specification can assert on what a
 * package reported rather than on what it printed. It is the one implementation this package
 * ships; a deployment binds a real sink.
 */

import { atLeast, type Fields, type Level, type Logger } from './logger.ts'

/**
 * One record a {@link RecordingLogger} kept.
 */
export interface LogRecord {
  /**
   * The fields the record carried, a child's fields included.
   */
  fields: Fields

  /**
   * How serious the record was.
   */
  level: Level

  /**
   * What the caller said happened.
   */
  message: string
}

/**
 * A logger that keeps its records instead of writing them.
 *
 * A specification asserts on `records`, which is what lets a test say "it warned about the
 * held-back version" without capturing output or matching a printed line.
 */
export interface RecordingLogger extends Logger {
  /**
   * The records at one level, for a specification that cares about only those.
   *
   * @param {Level} level - The level to keep.
   * @returns {LogRecord[]} The records at exactly that level, in order.
   */
  at: (level: Level) => LogRecord[]

  /**
   * Every record kept, in the order it was written, a child's records included.
   */
  readonly records: readonly LogRecord[]
}

/**
 * Builds a logger that keeps what it is told.
 *
 * @param {Level} [threshold] - The least serious level to keep, so a specification can prove
 *     that a level below it is dropped. Default: `trace`, which keeps everything.
 * @returns {RecordingLogger} The logger. Its children write into the same list, so one
 *     assertion sees everything a package reported.
 */
export function recordingLogger(threshold: Level = 'trace'): RecordingLogger {
  const records: LogRecord[] = []

  /**
   * Builds a logger that adds these inherited fields to every record it writes.
   *
   * @param {Fields} inherited - The fields every record gets, from this logger's ancestors.
   * @returns {RecordingLogger} The logger, writing into the same list as its parent.
   */
  const build = (inherited: Fields): RecordingLogger => {
    /**
     * Builds the write for one level, which keeps a record when the threshold allows it.
     *
     * @param {Level} level - The level the returned function writes at.
     * @returns {(message: string, fields?: Fields) => void} The write for that level.
     */
    const write =
      (level: Level) =>
      (message: string, fields: Fields = {}): void => {
        if (atLeast(level, threshold)) {
          records.push({ fields: { ...inherited, ...fields }, level, message })
        }
      }

    return {
      at: (level) => records.filter((record) => record.level === level),
      child: (fields) => build({ ...inherited, ...fields }),
      debug: write('debug'),
      error: write('error'),
      info: write('info'),
      records,
      trace: write('trace'),
      warn: write('warn'),
    }
  }

  return build({})
}
