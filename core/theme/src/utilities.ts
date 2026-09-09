/**
 * @fileoverview Writes the classes a component opts into, which neither a token nor a base
 * rule can express. A base rule applies to whatever is in the state it names, which is why
 * being disabled is one; responding under the pointer is a claim a component makes about
 * itself, so it is a utility a component writes rather than a rule that finds it.
 */

import { HEADER } from '#css.ts'

/**
 * Lists the properties a state change touches, and only those.
 *
 * `translate` and `scale` are named beside `transform` because Tailwind writes them as the
 * individual properties, and a list naming only `transform` eases neither: the press snapped
 * rather than moved.
 */
const CHANGES = [
  'color',
  'background-color',
  'border-color',
  'box-shadow',
  'opacity',
  'transform',
  'translate',
  'scale',
  'filter',
].join(', ')

/**
 * Sets the transition every hover, focus and press runs.
 *
 * Reduced motion is not named here. The keyframes stylesheet already holds every element on
 * the page to a hundredth of a millisecond when a reader asks for it, with `!important`, so a
 * clause here would restate a rule that has already won.
 */
const RESPONDS = [
  `transition-property: ${CHANGES}`,
  'transition-duration: var(--duration-fast)',
  'transition-timing-function: var(--ease-out)',
]

/**
 * Writes one utility, with its declarations indented inside it.
 *
 * A nested rule closes with its own brace and takes no semicolon after it, which a declaration
 * does. Both arrive here as strings, so the two are told apart by how they end.
 *
 * @param {string} name - The class a component writes.
 * @param {readonly string[]} declarations - The declarations it draws, and any nested rule.
 * @returns {string} The at-rule.
 */
function utility(name: string, declarations: readonly string[]): string {
  const body = declarations
    .map((declaration) => `  ${declaration}${declaration.endsWith('}') ? '' : ';'}`)
    .join('\n')

  return `@utility ${name} {\n${body}\n}`
}

/**
 * Writes the classes a component opts into.
 *
 * There are two, and both are about the pointer. Thirty-four components in the tree this was
 * drawn from wrote their own transition — `transition-all` in one, `transition-colors` in the
 * next, seven durations between them — which is why nothing felt the same under the hand.
 * Naming them here means a component states that it responds rather than deciding how.
 *
 * @returns {string} The stylesheet.
 */
export function emitUtilities(): string {
  return `${HEADER}
${utility('motion-state', RESPONDS)}

${utility('motion-press', [...RESPONDS, '&:active {\n    scale: var(--press-scale);\n  }'])}
`
}
