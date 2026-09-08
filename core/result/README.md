# @stealthscale/core-result

A **library**: every tier installs it on its own.

Success or refusal as a value. A step returns a `Result` rather than throwing when refusing
is an ordinary outcome the caller handles — a boundary that rejects input, a lookup that
finds nothing, a step that cannot run yet. It throws only for a fault the caller can do
nothing about.

```ts
import { andThen, collect, refused, succeeded, type Result } from '@stealthscale/core-result'

function port(raw: string): Result<number, string> {
  const value = Number(raw)
  return Number.isInteger(value) && value > 0 ? succeeded(value) : refused('not a port')
}
```

A caller narrows on `ok`; there are no `isSuccess` predicates, because the discriminator is
the narrowing.

| Function                 | What it does                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| `succeeded`, `refused`   | build the two cases                                                           |
| `valueOr`                | read the value, falling back on a refusal                                     |
| `mapValue`, `mapFailure` | change one side, leaving the other untouched                                  |
| `andThen`                | run the next step only where the one before worked                            |
| `collect`                | turn many results into one, reporting **every** refusal rather than the first |

`collect` is what lets a form show a person every bad field at once instead of the first.

## Install

```sh
bun add @stealthscale/core-result
```
