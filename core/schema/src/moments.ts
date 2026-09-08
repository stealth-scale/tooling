/**
 * @fileoverview Checks days and timestamps written as ISO 8601 strings beyond their shape.
 * The pattern valibot ships accepts `2026-02-30`; the schemas here refuse it.
 */

import * as v from 'valibot'

/**
 * Returns `true` when the calendar has the day the string names. The ISO pattern alone does
 * not check this.
 *
 * Reads the year, the month and the day at the start of the string. An ISO date and an ISO
 * timestamp both put them there. It then asks the UTC calendar whether that month has that
 * day: `Date.UTC` rolls an impossible day into the next month, and the comparison catches
 * that.
 *
 * @param {string} value - The date or timestamp to check. It must already match the ISO format.
 * @returns {boolean} `true` for a day the month has. `false` for `2026-02-30` or `2025-04-31`.
 */
export function existsOnTheCalendar(value: string): boolean {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const dayOfMonth = Number(value.slice(8, 10))
  const date = new Date(Date.UTC(year, month - 1, dayOfMonth))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === dayOfMonth
}

/**
 * Describes the issue `calendarDay` adds: the string matched the ISO format and names a day
 * its month does not have.
 *
 * @template {string} Input - The string type the action ran on.
 */
export interface CalendarDayIssue<Input extends string> extends v.BaseIssue<Input> {
  /**
   * States nothing, because the requirement is a function and not a value.
   */
  readonly expected: null

  /**
   * Marks a validation. Every action's issue carries this kind.
   */
  readonly kind: 'validation'

  /**
   * Quotes the refused string in valibot's form.
   */
  readonly received: `"${string}"`

  /**
   * Points at the predicate that refused the string.
   */
  readonly requirement: typeof existsOnTheCalendar

  /**
   * Carries the code a catalogue translates.
   */
  readonly type: 'calendar_day'
}

/**
 * Describes the action `calendarDay` builds. Its type follows valibot's own validation
 * actions.
 *
 * @template {string} Input - The string type the action runs on.
 */
export interface CalendarDayAction<Input extends string> extends v.BaseValidation<
  Input,
  Input,
  CalendarDayIssue<Input>
> {
  /**
   * States nothing, because the requirement is a function and not a value.
   */
  readonly expects: null

  /**
   * Carries no words. A catalogue translates the code.
   */
  readonly message: undefined

  /**
   * Points at the builder. Every valibot action records its builder here.
   */
  readonly reference: typeof calendarDay

  /**
   * Applies this predicate to the string.
   */
  readonly requirement: typeof existsOnTheCalendar

  /**
   * Carries the code a catalogue translates.
   */
  readonly type: 'calendar_day'
}

/**
 * Builds a validation that refuses a date the calendar does not have. It runs after the ISO
 * pattern accepted the shape. It reports the code `calendar_day` and no words; a catalogue
 * keyed on the code supplies what a person reads. While an earlier action's refusal stands,
 * it adds nothing, because it needs the shape the pattern accepted.
 *
 * @template {string} Input - The string type the action runs on.
 * @returns {CalendarDayAction<Input>} The action. Put it in a `pipe` after `isoDate` or `isoTimestamp`.
 */
export function calendarDay<Input extends string>(): CalendarDayAction<Input> {
  return {
    /**
     * Adds the issue when the calendar does not have the day, and passes the dataset on.
     * The pipe calls it once per value.
     *
     * @param {v.OutputDataset<Input, v.BaseIssue<unknown>>} dataset - The dataset the pipe carries: the value and the issues so far.
     * @param {v.Config<v.BaseIssue<unknown>>} config - The parse configuration.
     * @returns {v.OutputDataset<Input, v.BaseIssue<unknown> | CalendarDayIssue<Input>>} The same dataset. It carries the new issue when the day is not on the calendar.
     */
    '~run'(dataset, config) {
      if (dataset.typed && dataset.issues === undefined && !this.requirement(dataset.value)) {
        v._addIssue(this, 'calendar day', dataset, config)
      }
      return dataset
    },
    async: false,
    expects: null,
    kind: 'validation',
    message: undefined,
    reference: calendarDay,
    requirement: existsOnTheCalendar,
    type: 'calendar_day',
  }
}

/**
 * Names the schema `day` builds: a string in the ISO date format that the calendar has.
 */
export type DaySchema = v.SchemaWithPipe<
  readonly [
    v.StringSchema<undefined>,
    v.IsoDateAction<string, undefined>,
    CalendarDayAction<string>,
  ]
>

/**
 * Names the schema `timestamp` builds: a string in the ISO timestamp format that the
 * calendar has.
 */
export type TimestampSchema = v.SchemaWithPipe<
  readonly [
    v.StringSchema<undefined>,
    v.IsoTimestampAction<string, undefined>,
    CalendarDayAction<string>,
  ]
>

/**
 * Builds the schema for a calendar day written as `2026-09-08`.
 *
 * @returns {DaySchema} The schema. It refuses a non-string with the code `string`, a string
 *     outside the ISO date format with `iso_date`, and a day the month does not have with
 *     `calendar_day`.
 */
export function day(): DaySchema {
  return v.pipe(v.string(), v.isoDate(), calendarDay())
}

/**
 * Builds the schema for a moment written as an ISO 8601 timestamp with its zone:
 * `2026-09-08T06:30:00Z` or `2026-09-08 08:30:00+02:00`. The zone is required, so a moment
 * reads the same wherever it is read.
 *
 * @returns {TimestampSchema} The schema. It refuses a non-string with the code `string`, a
 *     string outside the ISO timestamp format with `iso_timestamp`, and a day the month does
 *     not have with `calendar_day`.
 */
export function timestamp(): TimestampSchema {
  return v.pipe(v.string(), v.isoTimestamp(), calendarDay())
}
