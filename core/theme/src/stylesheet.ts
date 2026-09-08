/**
 * @fileoverview Reads custom properties back out of a stylesheet's text. The scales are
 * authored CSS, and Tailwind registers them under `@theme inline`, which emits no custom
 * property to read at runtime, so the text is the only source a specification or a
 * catalogue can check them against.
 */

/**
 * Matches one `--name: value;` declaration.
 */
const DECLARATION = /--([a-z0-9-]+):\s*([^;]+);/gu

/**
 * Reads the custom properties declared inside one `selector { … }` block, as a map from name
 * to value in the order written.
 *
 * The first block whose selector text matches is read, and a selector is matched as written,
 * whitespace included.
 *
 * @param {string} css - The stylesheet's text.
 * @param {string} selector - The block's selector, as it appears in the text.
 * @returns {Record<string, string>} Each property name without the leading `--`, mapped to
 *     its value with internal whitespace collapsed.
 * @throws {Error} When no block carries the selector.
 */
export function declarations(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`no block for ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  return Object.fromEntries(
    [...body.matchAll(DECLARATION)].map((match) => {
      const [, name, value] = match.slice(0)
      return [String(name), String(value).replaceAll(/\s+/gu, ' ').trim()]
    }),
  )
}
