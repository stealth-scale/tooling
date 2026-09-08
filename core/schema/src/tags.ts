/**
 * @fileoverview Checks that a string is a BCP-47 language tag the engine reads, so a locale a
 * document or a request names is refused with a code at the boundary rather than carried
 * until `Intl` throws on it.
 */

import * as v from 'valibot'

import { canonical } from '@stealthscale/core-locale'

/**
 * Returns `true` when the engine reads the string as a language tag.
 *
 * @param {string} value - The tag to check, as it arrived.
 * @returns {boolean} `true` for `nl-BE` and `EN-gb`. `false` for `not a tag` and for an empty
 *     string.
 */
export function isLanguageTag(value: string): boolean {
  return canonical(value) !== undefined
}

/**
 * Describes the issue `languageTag` adds: the string is no language tag the engine reads.
 *
 * @template {string} Input - The string type the action ran on.
 */
export interface LanguageTagIssue<Input extends string> extends v.BaseIssue<Input> {
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
  readonly requirement: typeof isLanguageTag

  /**
   * Carries the code a catalogue translates.
   */
  readonly type: 'language_tag'
}

/**
 * Describes the action `languageTag` builds. Its type follows valibot's own validation
 * actions.
 *
 * @template {string} Input - The string type the action runs on.
 */
export interface LanguageTagAction<Input extends string> extends v.BaseValidation<
  Input,
  Input,
  LanguageTagIssue<Input>
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
  readonly reference: typeof languageTag

  /**
   * Applies this predicate to the string.
   */
  readonly requirement: typeof isLanguageTag

  /**
   * Carries the code a catalogue translates.
   */
  readonly type: 'language_tag'
}

/**
 * Builds a validation that refuses a string the engine does not read as a language tag. It
 * reports the code `language_tag` and no words; a catalogue keyed on the code supplies what a
 * person reads.
 *
 * @template {string} Input - The string type the action runs on.
 * @returns {LanguageTagAction<Input>} The action. Put it in a `pipe` after `string`.
 */
export function languageTag<Input extends string>(): LanguageTagAction<Input> {
  return {
    /**
     * Adds the issue when the string is no tag, and passes the dataset on. The pipe calls it
     * once per value.
     *
     * @param {v.OutputDataset<Input, v.BaseIssue<unknown>>} dataset - The dataset the pipe
     *     carries: the value and the issues so far.
     * @param {v.Config<v.BaseIssue<unknown>>} config - The parse configuration.
     * @returns {v.OutputDataset<Input, v.BaseIssue<unknown> | LanguageTagIssue<Input>>} The
     *     same dataset. It carries the new issue when the string is no tag.
     */
    '~run'(dataset, config) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        v._addIssue(this, 'language tag', dataset, config)
      }
      return dataset
    },
    async: false,
    expects: null,
    kind: 'validation',
    message: undefined,
    reference: languageTag,
    requirement: isLanguageTag,
    type: 'language_tag',
  }
}

/**
 * Names the schema `locale` builds: a string that is a language tag.
 */
export type LocaleSchema = v.SchemaWithPipe<
  readonly [v.StringSchema<undefined>, LanguageTagAction<string>]
>

/**
 * Builds the schema for a locale written as a BCP-47 tag: `nl-BE`, `zh-Hant-TW`.
 *
 * @returns {LocaleSchema} The schema. It refuses a non-string with the code `string`, and a
 *     string the engine does not read as a tag with `language_tag`.
 */
export function locale(): LocaleSchema {
  return v.pipe(v.string(), languageTag())
}
