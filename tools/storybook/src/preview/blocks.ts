/**
 * @fileoverview Draws Storybook's docs blocks on the theme's own surfaces. A canvas comes out
 * of the box as a rounded, raised card and the props table does not, so a page reads as one
 * block somebody styled and one they forgot. The values are the theme's own custom
 * properties, which resolve on a docs page, so this follows the toolbars rather than pinning
 * a second palette.
 */

/**
 * Selects the block a props table sits in, tab bar and all.
 *
 * Storybook wraps the tabs and the table in one element whose class is generated, so there is
 * no name to hold on to. What it does have is a table with a class Storybook keeps stable,
 * and `:has` reaches the wrapper from it. It is one selector rather than a list, because a
 * list interpolated into a descendant rule splits on its comma and the first half then
 * matches everything.
 */
const BLOCK = '.sbdocs-content > div:has(table.docblock-argstable)'

/**
 * Holds the stylesheet a docs page carries.
 *
 * A props table is drawn as the surface a canvas already is: the theme's card, its hairline,
 * its corner and one step of its own elevation. `overflow: hidden` is what makes the tab bar
 * and the table one box rather than two, because it clips both to the rounded corner. The tab
 * bar sits on the same card as the table under it and is separated by a hairline alone, so
 * one component's tab is not a different surface from another's table.
 */
export const DOCS_STYLE = `
${BLOCK} {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  margin-block-end: 2.5rem;
  overflow: hidden;
}

${BLOCK} > div:first-child:has([role='tablist']) {
  background: transparent;
  border-bottom: 1px solid var(--border);
}

${BLOCK} table.docblock-argstable {
  margin: 0;
}

${BLOCK} .docblock-argstable-body {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  filter: none;
}
`
