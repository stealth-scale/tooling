import { describe, expect, it } from 'vite-plus/test'

import { calendarDay, day, existsOnTheCalendar, timestamp } from './moments.ts'
import { safeParse } from './parse.ts'

/**
 * Lists the codes a schema refused a value with.
 *
 * @param {ReturnType<typeof safeParse>} result - The result `safeParse` returned.
 * @returns {string[]} The codes in the schema's order. Empty when the schema accepted the value.
 */
function codesOf(result: ReturnType<typeof safeParse>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code)
}

describe('existsOnTheCalendar', () => {
  it('accepts a day the month has, including the leap day', () => {
    expect(existsOnTheCalendar('2024-02-29')).toBe(true)
    expect(existsOnTheCalendar('2026-09-08')).toBe(true)
    expect(existsOnTheCalendar('2026-09-08T06:30:00Z')).toBe(true)
  })

  it('refuses a day the month does not have', () => {
    expect(existsOnTheCalendar('2026-02-30')).toBe(false)
    expect(existsOnTheCalendar('2025-04-31')).toBe(false)
    expect(existsOnTheCalendar('2025-02-29')).toBe(false)
  })

  it('refuses a string that names no date at all', () => {
    expect(existsOnTheCalendar('nope')).toBe(false)
  })
})

describe('calendarDay', () => {
  it('is a validation action that reports a code and no words', () => {
    const action = calendarDay()

    expect(action.kind).toBe('validation')
    expect(action.type).toBe('calendar_day')
    expect(action.message).toBeUndefined()
    expect(action.reference).toBe(calendarDay)
    expect(action.requirement).toBe(existsOnTheCalendar)
  })
})

describe('day', () => {
  it('accepts an ISO date the calendar has', () => {
    expect(safeParse(day(), '2026-09-08')).toEqual({ ok: true, value: '2026-09-08' })
  })

  it('refuses a value that is not a string with that code alone, and adds nothing of its own', () => {
    expect(codesOf(safeParse(day(), 42))).toEqual(['string'])
  })

  it('refuses a string outside the ISO date format with iso_date', () => {
    expect(codesOf(safeParse(day(), '2026-9-8'))).toEqual(['iso_date'])
  })

  it('refuses a day the month does not have with calendar_day, and the refused string as its only scalar', () => {
    const result = safeParse(day(), '2026-02-30')

    expect(codesOf(result)).toEqual(['calendar_day'])
    expect(result.ok ? [] : result.issues.map((issue) => issue.params)).toEqual([
      { received: '"2026-02-30"' },
    ])
  })
})

describe('timestamp', () => {
  it('accepts an ISO timestamp with a zone, in the T form and in the space form', () => {
    expect(safeParse(timestamp(), '2026-09-08T06:30:00Z').ok).toBe(true)
    expect(safeParse(timestamp(), '2026-09-08T06:30:00.250+02:00').ok).toBe(true)
    expect(safeParse(timestamp(), '2026-09-05 08:30:00 +02:00').ok).toBe(true)
  })

  it('refuses a timestamp without a zone with iso_timestamp', () => {
    expect(codesOf(safeParse(timestamp(), '2026-09-08T06:30:00'))).toEqual(['iso_timestamp'])
  })

  it('refuses a day the month does not have with calendar_day', () => {
    expect(codesOf(safeParse(timestamp(), '2026-02-30T00:00:00Z'))).toEqual(['calendar_day'])
  })
})
