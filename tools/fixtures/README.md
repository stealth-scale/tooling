# @stealthscale/tool-fixtures

A **kit**: another repository takes it at development time.

A fixture builds the sample values a specification or a story shows. It answers the same
value on every run, so a snapshot, a visual diff and a failing assertion each mean what they
say.

```ts
import { fixture, many } from '@stealthscale/tool-fixtures'

const person = fixture<Person>((source) => ({
  email: source.internet.email(),
  name: source.person.fullName(),
  role: 'Reviewer',
}))

person() // the same person, every run
person({ name: 'Noor Haddad' }) // the case states what it is about; the rest is filled in
person(undefined, { locale: 'nl-BE' }) // a Flemish name, address and telephone number
many(person, 3) // three different people, the same three every run
```

## Determinism

A fixture is seeded by its position in a series, not by the order it was called in. `person()`
is position 0 and answers the same values whatever else ran first, so two specifications
cannot disturb each other and a case can be read on its own.

Each position gets its own source rather than one shared source that is re-seeded. A fixture
that builds another fixture would otherwise re-seed the source its caller is part-way
through, and the outer value would change according to what it happened to contain.

## Locales

A locale is named as a BCP-47 tag, the same vocabulary the rest of the workspace uses, and
the nearest locale the sample data ships answers it. `nl-NL` reaches `nl`, `zh-Hans` reaches
`zh-CN`, and a tag nothing answers falls back to `en` rather than throwing, because a fixture
that refuses to build fails a specification about something else.

`LOCALES` lists every locale the sample data ships, as canonical tags, so a story that renders
in each of them reads the list rather than restating it. A layout that survives `Noor Haddad`
may still break on a German compound or an Arabic right-to-left label, and this is how a story
shows that before a customer does.

## What belongs here, and what does not

This package holds the machinery. The values themselves belong to whichever repository owns
the domain, because a fixture is only worth having if it reads as something a person could
plausibly see in the product. `Lorem ipsum` and `Button` tell a reviewer nothing about
whether a layout survives a real label.

## Install

```sh
bun add -d @stealthscale/tool-fixtures
```
