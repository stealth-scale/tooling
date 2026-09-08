# @stealthscale/core-logging

A **library**: every tier that reports what it did installs it on its own.

The contract a library logs through. A package takes a `Logger` and says what happened; a
deployment binds one implementation, once, and decides where the words go.

```ts
import { SILENT, type Logger } from '@stealthscale/core-logging'

export function migrate(database: Database, log: Logger = SILENT): void {
  log.info('applying migrations', { pending: 3 })
}
```

`Logger` is structural on purpose: pino's logger and a console wrapper both satisfy it
without being told about it, so binding one is an assignment rather than an adapter. The five
levels are the ones pino and the console share.

A message says what happened, in the present tense. A field carries the data — which package,
which request, which row — so nothing interpolates a value into a sentence a reader would
then have to parse back out.

`SILENT` is the default a library takes when a caller passes none, so no package guards
against an absent logger.

## Testing what a package reported

`recordingLogger()` keeps its records instead of writing them, which lets a specification
assert on what a package said rather than on what it printed:

```ts
const log = recordingLogger()
migrate(database, log)
expect(log.at('info')[0]?.fields).toEqual({ pending: 3 })
```

A child's records go into the same list, so one assertion sees everything.

## No OpenTelemetry

`@opentelemetry/api-logs` is 9 KB but drags `@opentelemetry/api` at 65 KB, and it is an API
for _exporting_ telemetry rather than a contract a library logs through. A deployment that
wants OTel binds an OTel-backed `Logger` here; nothing above the binding changes.

## Install

```sh
bun add @stealthscale/core-logging
```
