# @stealthscale/core-locale

A **library**: the browser, the server and the message compiler all install it.

Which locale to answer in. BCP-47 tags read with the engine's own `Intl`, and ECMA-402's
lookup matcher against what a catalogue actually ships.

```ts
import { chain, negotiate, preferences } from '@stealthscale/core-locale'

const wanted = preferences(request.headers.get('accept-language') ?? undefined)
const answer = negotiate(
  wanted.map((p) => p.tag),
  ['en', 'nl', 'zh-Hans'],
  'en',
)

chain('zh-Hant-TW') // ['zh-Hant-TW', 'zh-Hant', 'zh'] — the order a catalogue resolves in
```

`negotiate` truncates each requested tag until it names something available, so `en-GB`
reaches a catalogue that ships `en`, and `nl-BE` reaches one that ships `nl`. Where truncation
finds nothing it widens both sides to their likely script and region, so `zh` reaches
`zh-Hans` and `en` reaches `en-US`. It gives back the available tag **as the catalogue wrote
it**, because that string is a file name.

`preferences` drops what the client cannot use: the wildcard, anything that is not a tag, and
a tag at `q=0`, which RFC 9110 defines as "not acceptable" rather than as a weak preference.

## No locale library

`@formatjs/intl-localematcher` is the usual answer and it is 58 KB, almost all of it the
likely-subtags data. The engine already has that data: `Intl.Locale.prototype.maximize()`
turns `zh` into `zh-Hans-CN`, `Intl.getCanonicalLocales` fixes subtag case, and `Intl.Locale`
takes a tag apart. So this package carries no data at all — it is the lookup algorithm over
what `Intl` already knows.

## Install

```sh
bun add @stealthscale/core-locale
```
