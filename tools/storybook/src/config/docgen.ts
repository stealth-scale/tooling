/**
 * @fileoverview Reads a component's own docblocks into the props table its page shows, so a
 * prop is described once, where it is declared. Storybook's own reader recognises a component
 * by the JSX it returns, which misses one that renders through a render prop and misses every
 * part of a compound component past the first. This reads a component that says so with
 * `@component` as well, and every exported one.
 */

import MagicString from 'magic-string'
import { builtinHandlers, builtinResolvers, type Handler, parse } from 'react-docgen'
import { type Plugin } from 'vite-plus'

/**
 * Holds the three ways react-docgen recognises a component that this chains together.
 */
const { ChainResolver, FindAnnotatedDefinitionsResolver, FindExportedDefinitionsResolver } =
  builtinResolvers

/**
 * Matches the files a component can be written in.
 */
const COMPONENTS = /\.tsx$/u

/**
 * Matches what is never a component: what a package manager put on disk, and the two kinds of
 * file written about components rather than being one.
 */
const NOT_COMPONENTS = /node_modules|\.(?:spec|stories)\.tsx$/u

/**
 * Matches the annotation that tells the reader a function is a component. It is for the
 * reader alone, so a page that printed it would be showing an implementation detail as
 * running text.
 */
const ANNOTATION = /^\s*\*?\s*@component\b/u

/**
 * Names what react-docgen reports about one component, in the fields this reads.
 */
interface Documented {
  /**
   * Names the binding `__docgenInfo` is hung on, which is what the injected assignment writes
   * to. For `const Card = …` this and the display name are read from different nodes.
   */
  actualName?: string

  /**
   * Carries the component's own docblock, which the page shows as its description.
   */
  description?: string
}

/**
 * Reads the name a declaration is bound to.
 *
 * @param {unknown} node - A node react-docgen resolved a component to.
 * @returns {string | undefined} The binding's name, or nothing where it has none.
 */
export function boundName(node: unknown): string | undefined {
  if (typeof node !== 'object' || node === null || !('id' in node)) return undefined

  const id: unknown = node.id
  if (typeof id !== 'object' || id === null || !('name' in id)) return undefined

  const name: unknown = id.name
  return typeof name === 'string' ? name : undefined
}

/**
 * Records the binding a component is declared under, and the file it came from.
 *
 * Storybook keeps this as a private handler of its own. The display name is what a page
 * shows; the binding is what the injected assignment has to name.
 *
 * @param {Parameters<Handler>[0]} documentation - The record gathered so far, to add to.
 * @param {Parameters<Handler>[1]} definition - The component being read.
 */
const bindingOf: Handler = (documentation, definition) => {
  const name = boundName(definition.node) ?? boundName(definition.parentPath?.node)
  if (name === undefined) return

  documentation.set('actualName', name)
}

/**
 * Returns `true` when react-docgen refused a file because it holds no component, which is the
 * ordinary case for everything that is not one.
 *
 * @param {unknown} error - The value the read threw.
 * @returns {boolean} `true` for the one code that means an empty answer.
 */
export function missingDefinition(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false
  return error.code === 'ERR_REACTDOCGEN_MISSING_DEFINITION'
}

/**
 * Reads every component in one file.
 *
 * @param {string} source - The file's own text.
 * @param {string} id - The file's path, which is what react-docgen reports back.
 * @param {InstanceType<typeof ChainResolver>} resolver - How a component is recognised.
 * @returns {Documented[]} One record per component, and none for a file holding none, which
 *     is the ordinary case for everything that is not a component.
 * @throws {Error} When the file cannot be parsed at all. A file holding no component is not
 *     that, and comes back empty.
 */
function documentedIn(
  source: string,
  id: string,
  resolver: InstanceType<typeof ChainResolver>,
): Documented[] {
  try {
    return parse(source, {
      babelOptions: { parserOpts: { plugins: ['typescript', 'jsx'] } },
      filename: id,
      handlers: [...Object.values(builtinHandlers), bindingOf],
      resolver,
    })
  } catch (error) {
    if (missingDefinition(error)) return []
    throw error
  }
}

/**
 * Describes a file this rewrote.
 */
export interface Rewritten {
  /**
   * Carries the file, with what was read hung off each component it declares.
   */
  code: string

  /**
   * Carries the source map, so a stack trace still names the line a reader wrote.
   */
  map: string
}

/**
 * Reads a component's description without the annotation that is for the reader alone.
 *
 * @param {string} [written] - The component's docblock. Default: nothing.
 * @returns {string} The description a page shows.
 */
function described(written = ''): string {
  return written
    .split('\n')
    .filter((line) => !ANNOTATION.test(line))
    .join('\n')
    .trim()
}

/**
 * Builds the plugin that reads a component's docblocks into its props table.
 *
 * It writes what Storybook's own plugin writes, so the docs blocks read it without being
 * told. A file with no component in it is left exactly as it arrived, rather than costing a
 * source map it does not need.
 *
 * @returns {Plugin} The plugin, for a Storybook configuration's `viteFinal`.
 */
export function stealthDocgen(): Plugin {
  const resolver = new ChainResolver(
    [new FindAnnotatedDefinitionsResolver(), new FindExportedDefinitionsResolver({ limit: 0 })],
    { chainingLogic: ChainResolver.Logic.ALL },
  )

  return {
    enforce: 'pre',
    name: 'stealth:docgen',

    /**
     * Hangs what was read off each component this file declares.
     *
     * @param {string} source - The file's own text.
     * @param {string} id - The file's path.
     * @returns {Rewritten | undefined} The rewritten file, or nothing where the file
     *     declares no component.
     */
    transform: (source: string, id: string): Rewritten | undefined => {
      const looks = COMPONENTS.test(id) && !NOT_COMPONENTS.test(id)
      const written = new MagicString(source)

      for (const { actualName, ...info } of looks ? documentedIn(source, id, resolver) : []) {
        if (actualName === undefined) continue

        const shown = { ...info, description: described(info.description) }
        written.append(`;${actualName}.__docgenInfo=${JSON.stringify(shown)}`)
      }

      if (!written.hasChanged()) return undefined
      return {
        code: written.toString(),
        map: written.generateMap({ hires: true, source: id }).toString(),
      }
    },
  }
}
