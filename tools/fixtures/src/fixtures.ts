/**
 * @fileoverview Builds the sample values a specification or a story shows. A fixture answers
 * the same value on every run, so a snapshot, a visual diff and a failing assertion each
 * mean what they say rather than reporting the weather.
 */

import { Faker } from '@faker-js/faker'

import { DEFAULT_LOCALE, definitionsFor } from '#locales.ts'

/**
 * Seeds every fixture.
 *
 * The number is arbitrary and fixed. What matters is that it never changes, because changing
 * it rewrites every value every fixture in every repository has ever produced.
 */
export const SEED = 20_260_908

/**
 * Says which value of a series to build, and which locale to draw it from.
 */
export interface At {
  /**
   * The position in the series, counting from zero. Two positions differ, and the same
   * position answers the same values on every run. Default: 0.
   */
  index?: number

  /**
   * The locale to draw from, as a BCP-47 tag. The nearest locale the sample data ships
   * answers it. Default: `en`.
   */
  locale?: string
}

/**
 * Builds one value of a series.
 *
 * @template Value - What the fixture produces.
 * @param {Faker} source - Sample data, seeded for this position and drawn from the locale
 *     that was asked for.
 * @param {number} index - The position in the series, counting from zero.
 * @returns {Value} The value, before a caller's overrides go on top of it.
 */
export type Build<Value> = (source: Faker, index: number) => Value

/**
 * Makes one value of a fixture.
 *
 * @template Value - What the fixture produces.
 * @param {Partial<Value>} [overrides] - The fields this caller states itself, which win over
 *     what the fixture built. Default: none.
 * @param {At} [at] - Which value of the series to build, and which locale to draw it from.
 *     Default: the first, in `en`.
 * @returns {Value} The value.
 */
export type Maker<Value> = (overrides?: Partial<Value>, at?: At) => Value

/**
 * Seeds a source for one position, drawn from one locale.
 *
 * The instance is fresh rather than shared and re-seeded. A fixture that builds another
 * fixture would otherwise re-seed the source its caller is part-way through, and the outer
 * value would change according to what it happened to contain.
 *
 * @param {number} index - The position in the series.
 * @param {string} locale - The locale to draw from, as a BCP-47 tag.
 * @returns {Faker} The source, seeded.
 */
function sourceFor(index: number, locale: string): Faker {
  const source = new Faker({ locale: definitionsFor(locale) })

  source.seed(SEED + index)

  return source
}

/**
 * Declares a fixture from the function that builds one value out of a seeded source and its
 * position.
 *
 * @template Value - What the fixture produces.
 * @param {Build<Value>} build - Builds one value.
 * @returns {Maker<Value>} The maker, which takes overrides, a position and a locale.
 */
export function fixture<Value extends object>(build: Build<Value>): Maker<Value> {
  return (overrides = {}, at = {}) => {
    const index = at.index ?? 0

    return { ...build(sourceFor(index, at.locale ?? DEFAULT_LOCALE), index), ...overrides }
  }
}

/**
 * Makes a series of values, each from its own position, so they differ from one another and
 * every run produces the same series.
 *
 * @template Value - What the fixture produces.
 * @param {Maker<Value>} make - The fixture to draw from.
 * @param {number} count - How many to make.
 * @param {Partial<Value>} [overrides] - The fields every value in the series carries.
 *     Default: none.
 * @param {string} [locale] - The locale to draw them from, as a BCP-47 tag. Default: `en`.
 * @returns {Value[]} The values, in order.
 */
export function many<Value extends object>(
  make: Maker<Value>,
  count: number,
  overrides: Partial<Value> = {},
  locale: string = DEFAULT_LOCALE,
): Value[] {
  return Array.from({ length: count }, (_, index) => make(overrides, { index, locale }))
}
