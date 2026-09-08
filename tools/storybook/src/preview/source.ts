/**
 * @fileoverview Cuts the code panel down to the markup a reader came for. Storybook prints a
 * story that renders through `render` as its whole object, play function and parameters
 * included, which is the test rather than the example.
 */

/**
 * Matches a top-level property of the story object, as Storybook's printer indents one.
 */
const PROPERTY = /^ {2}["'\w.$[]/u

/**
 * Matches the `render` property, wherever it sits in the object.
 */
const RENDER = /^ {2}render:/u

/**
 * Matches an arrow taking nothing or `args`, whose body is the element it renders.
 */
const ARROW = /^\((?:|args|_args)\)\s*=>\s*/u

/**
 * Reads the smallest indentation any non-empty line has, so a block moves to the left margin
 * without disturbing what is nested inside it.
 *
 * @param {readonly string[]} lines - The block.
 * @returns {number} How many spaces every line shares.
 */
function commonIndent(lines: readonly string[]): number {
  let smallest = Infinity
  for (const line of lines) {
    if (line.trim() === '') continue
    smallest = Math.min(smallest, line.length - line.trimStart().length)
  }
  return smallest === Infinity ? 0 : smallest
}

/**
 * Finds where the `render` value ends: at the next top-level property, or at the object's own
 * closing brace. The brace is matched at the left margin, so the one closing a render
 * function survives.
 *
 * @param {readonly string[]} lines - The whole snippet.
 * @param {number} start - The line `render:` is on.
 * @returns {number} The line after the value.
 */
function endOf(lines: readonly string[], start: number): number {
  const after = lines.slice(start + 1).findIndex((line) => PROPERTY.test(line))
  let end = after === -1 ? lines.length : start + 1 + after
  while (end > start + 1 && lines[end - 1] === '}') end -= 1
  return end
}

/**
 * Moves a block to the left margin: the first line as it is, the rest by the indent they
 * share.
 *
 * @param {string} block - The block, its first line already at the margin.
 * @returns {string} The block, with the shared indent taken off every later line.
 */
function dedented(block: string): string {
  const [first = '', ...rest] = block.split('\n')
  const indent = commonIndent(rest)
  return [first, ...rest.map((line) => line.slice(indent))].join('\n')
}

/**
 * Unwraps an arrow that returns an element, so `() => (<div />)` and `() => <div />` both
 * read as the element.
 *
 * @param {string} value - The `render` value, trimmed and without its trailing comma.
 * @returns {string} The element, or the value as it was for a function with a body.
 */
function unwrapped(value: string): string {
  if (!ARROW.test(value)) return value

  const body = value.replace(ARROW, '').trim()
  if (body.startsWith('{')) return value
  return dedented(body.replace(/^\(\s*/u, '').replace(/\s*\)$/u, ''))
}

/**
 * Reads what the code panel shows for a story: the markup, and nothing else.
 *
 * Only the `render` value survives, unwrapped when it is an arrow that returns an element and
 * kept whole when it is a function, because a story that holds state is not explained by its
 * markup alone. A story with no `render` is left as it arrived: Storybook has already printed
 * the component with its args, which is the right answer for a Playground.
 *
 * The scan is by line rather than by bracket depth. Storybook's printer puts one top-level
 * property per line at a fixed indent, and an apostrophe in JSX text is the kind of thing
 * that derails a depth counter.
 *
 * @param {string} code - The snippet Storybook generated.
 * @returns {string} The markup to show.
 */
export function sourceOf(code: string): string {
  const lines = code.split('\n')
  const start = lines.findIndex((line) => RENDER.test(line))
  if (start === -1) return code

  const block = lines.slice(start, endOf(lines, start))
  const rest = block.slice(1)
  const indent = commonIndent(rest)
  const body = [block[0], ...rest.map((line) => line.slice(indent))]
    .join('\n')
    .replace(RENDER, '')
    .trim()

  return unwrapped(body.replace(/,$/u, ''))
}
