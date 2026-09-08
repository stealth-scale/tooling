# @stealthscale/core-appearance

A **library**: the host, the catalogue and a settings screen all install it.

How a product is drawn for one person, as one value: which theme resolves the tokens, light
or dark within it, the control density, whether motion is reduced, the locale the words are
rendered in, and the direction its text runs. Every writer builds the same value and one
provider reads it, so the host, the catalogue's toolbars and a settings form cannot disagree
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
other's code: the base stylesheet writes its selectors against it, the host and the
catalogue write the document with it, and a spec holds the stylesheet to it.

`appearanceSchema(offered)` refuses a value a boundary receives that names a theme, a density
or a mode the product does not offer, or a locale that is no tag, with codes a catalogue
translates.

## Install

```sh
bun add @stealthscale/core-appearance
```
