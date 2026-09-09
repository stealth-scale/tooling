# @stealthscale/core-appearance

A **library**: the host, Storybook and a settings screen all install it.

How a product is drawn for one person, as one value: which theme resolves the tokens, light
or dark within it, the control density, whether motion is reduced, the locale the words are
rendered in, and the direction its text runs. Every writer builds the same value and one
provider reads it, so the host, Storybook's toolbars and a settings form cannot disagree
about what the document carries.

```ts
import { appearanceFor, applyToDocument, machine } from '@stealthscale/core-appearance'

const offered = { densities: ['comfortable', 'compact'], locales: ['en', 'nl'], themes: ['acme'] }
const appearance = appearanceFor(offered, machine(), stored)

applyToDocument(appearance, document.documentElement)
```

## What the machine decides

`machine()` reads what the person's machine says: the colour scheme it prefers, whether it
asks for reduced motion, and the languages it lists. `appearanceFor` negotiates that against
what the product offers, so the locale is one the product ships words for and the direction
follows the locale's script. Anything a caller states on top, a stored setting or a scene's
own choice, wins. Nothing branches on an environment's name: on a server the machine says
nothing and every value takes its one written default.

## The document

`ATTRIBUTES` names the attribute each value is written to, and `MODE_CLASS` the class that
marks dark mode. The table is the contract between three parties that never import each
other's code: the base stylesheet writes its selectors against it, the host and
Storybook write the document with it, and a spec holds the stylesheet to it.

`appearanceSchema(offered)` refuses a value a boundary receives that names a theme, a density
or a mode the product does not offer, or a locale that is no tag, with codes a catalogue
translates.

## What a design system contributes

Before the first pixel, a host and a Storybook both need the provider to render, the
stylesheets to load before any theme, and the densities on offer. The package that has them
says so in its manifest, under the `stealth` field the toolchain reads:

```json
{
  "name": "@acme/foundation-theme",
  "stealth": {
    "appearance": {
      "densities": ["comfortable", "compact"],
      "provider": "./src/provider.tsx",
      "stylesheets": ["./src/base.css"]
    }
  }
}
```

`APPEARANCE_KEY` names that entry and `APPEARANCE_CONTRIBUTION` is the schema it is held to.
Every member is optional, because a package contributes what it has: one registers the
provider and the base stylesheet, another adds a stylesheet of its own and nothing else. The
densities are what an `Offered` is built from, alongside the themes and the locales a
workspace registers elsewhere.

## Install

```sh
bun add @stealthscale/core-appearance
```
