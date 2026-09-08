/**
 * @fileoverview Checks that a person may follow a link: an absolute URL on a scheme the
 * browser navigates to, or a path within the application, and never a script. A
 * `javascript:` href cannot reach an anchor through a schema.
 */

import * as v from 'valibot'

/**
 * Lists the schemes a link may use: the two the browser navigates to, and the two that open
 * a program rather than a page. A `URL`'s `protocol` carries the trailing colon.
 */
export const NAVIGABLE_SCHEMES: ReadonlySet<string> = new Set([
  'http:',
  'https:',
  'mailto:',
  'tel:',
])

/**
 * Stands in for a link a person may not follow. `navigableOrBlocked` returns it. It is an
 * empty href, and every browser renders that as a link to nowhere.
 */
export const BLOCKED_URL = ''

/**
 * Resolves a link that has no scheme, so a path within the application counts as navigable.
 * The host never appears in a result, because a result is the input itself.
 */
const APPLICATION_BASE = 'https://application.invalid/'

/**
 * Returns `true` when a person may follow the link. The link must not be blank, the URL
 * parser must read it, and its scheme must be one of `NAVIGABLE_SCHEMES`. A link without a
 * scheme resolves against the application, so a path counts.
 *
 * The parser cleans the string the way a browser does: it drops tabs, newlines and leading
 * controls. So it reads `java\tscript:` as the scheme it is, and the check refuses it.
 *
 * @param {string} url - The link to check.
 * @returns {boolean} `true` for `https://…`, `/account`, `mailto:…` and `tel:…`. `false` for
 *     `javascript:…`, `data:…`, `file:…` and a blank string.
 */
export function isNavigableUrl(url: string): boolean {
  if (url.trim() === '') return false
  const parsed = URL.parse(url, APPLICATION_BASE)
  return parsed !== null && NAVIGABLE_SCHEMES.has(parsed.protocol)
}

/**
 * Returns the link when a person may follow it, and `BLOCKED_URL` otherwise. A component
 * that puts whatever it is given into an `href` calls this first.
 *
 * @param {string} [url] - The link to check. Leave it out when there is no link.
 * @returns {string} The link when `isNavigableUrl` accepts it, and `BLOCKED_URL` otherwise.
 */
export function navigableOrBlocked(url?: string): string {
  return url !== undefined && isNavigableUrl(url) ? url : BLOCKED_URL
}

/**
 * Describes the issue `navigableUrl` adds: the string is not a link a person may follow.
 *
 * @template {string} Input - The string type the action ran on.
 */
export interface NavigableUrlIssue<Input extends string> extends v.BaseIssue<Input> {
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
  readonly requirement: typeof isNavigableUrl

  /**
   * Carries the code a catalogue translates.
   */
  readonly type: 'navigable_url'
}

/**
 * Describes the action `navigableUrl` builds. Its type follows valibot's own validation
 * actions.
 *
 * @template {string} Input - The string type the action runs on.
 */
export interface NavigableUrlAction<Input extends string> extends v.BaseValidation<
  Input,
  Input,
  NavigableUrlIssue<Input>
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
  readonly reference: typeof navigableUrl

  /**
   * Applies this predicate to the string.
   */
  readonly requirement: typeof isNavigableUrl

  /**
   * Carries the code a catalogue translates.
   */
  readonly type: 'navigable_url'
}

/**
 * Builds a validation that refuses a link a person may not follow. It reports the code
 * `navigable_url` and no words; a catalogue keyed on the code supplies what a person reads.
 *
 * @template {string} Input - The string type the action runs on.
 * @returns {NavigableUrlAction<Input>} The action. Put it in a `pipe` after `string`.
 */
export function navigableUrl<Input extends string>(): NavigableUrlAction<Input> {
  return {
    /**
     * Adds the issue when a person may not follow the link, and passes the dataset on.
     * The pipe calls it once per value.
     *
     * @param {v.OutputDataset<Input, v.BaseIssue<unknown>>} dataset - The dataset the pipe carries: the value and the issues so far.
     * @param {v.Config<v.BaseIssue<unknown>>} config - The parse configuration.
     * @returns {v.OutputDataset<Input, v.BaseIssue<unknown> | NavigableUrlIssue<Input>>} The same dataset. It carries the new issue when a person may not follow the link.
     */
    '~run'(dataset, config) {
      if (dataset.typed && !this.requirement(dataset.value)) {
        v._addIssue(this, 'navigable URL', dataset, config)
      }
      return dataset
    },
    async: false,
    expects: null,
    kind: 'validation',
    message: undefined,
    reference: navigableUrl,
    requirement: isNavigableUrl,
    type: 'navigable_url',
  }
}

/**
 * Names the schema `link` builds: a string a person may follow as a link.
 */
export type LinkSchema = v.SchemaWithPipe<
  readonly [v.StringSchema<undefined>, NavigableUrlAction<string>]
>

/**
 * Builds the schema for a link a person may follow: `https://…`, a path within the
 * application, `mailto:…` or `tel:…`.
 *
 * @returns {LinkSchema} The schema. It refuses a non-string with the code `string`, and a
 *     string that is not a navigable link with `navigable_url`.
 */
export function link(): LinkSchema {
  return v.pipe(v.string(), navigableUrl())
}
