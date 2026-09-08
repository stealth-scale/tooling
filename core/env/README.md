# @stealthscale/core-env

A **library**: every tier that reads configuration installs it on its own.

The environment as a value. Layered `.env` files, the machine winning over them, and one
written default per absence — so nothing branches on an environment's _name_.

```ts
import { environment, read, readRequired } from '@stealthscale/core-env'

const variables = environment({ mode: 'test' })

const database = readRequired(variables, 'DATABASE_URL')
const mail = read(variables, 'MAIL_URL', 'sink:')
```

## Precedence

Files are read nearest-the-machine last, then the machine's own variables go on top:

```
.env  →  .env.local  →  .env.<mode>  →  .env.<mode>.local  →  the machine
```

The machine wins on purpose. A file is what a repository ships for a developer; an exported
variable is what a deployment sets, and a deployment must not be overridden by a file that
happened to be in the image. A machine entry set to nothing is not an override, so a file
below it still counts.

`environment()` returns a value and never touches `process.env`, which is what lets a
specification build a whole environment without leaking into the process running it.

## No dotenv

Node parses the format: `util.parseEnv` handles quotes, multiline values, `export` prefixes,
inline comments, CRLF and an `=` inside a value. What it does not do is `${VAR}`
interpolation, and neither does this — a value that restates another is a value in two
places, and the file that owns it should stay the only one.

What this package adds over the built-ins is the layering above, tolerance of a file that is
not there, and reading into a value rather than mutating the process.

## Install

```sh
bun add @stealthscale/core-env
```
