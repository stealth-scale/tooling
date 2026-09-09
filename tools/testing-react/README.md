# @stealthscale/tool-testing-react

A **kit**: a dev-time library another repository takes.

Reads a rendered component in a specification. `part` finds what a component drew through the
`data-slot` it marked it with, `attr` and `renderedAs` read what became of it, and
`describeContract` registers the suite every component owes whoever installs it.

It is a package of its own rather than an entry of `@stealthscale/tool-testing`, because that
one reads a workspace off the disk and a specification doing that should not have the document
and the JSX runtime in scope to do it. One package compiles under one tsconfig, so the two
surfaces are two packages.

## The contract suite

Each case is something a consumer does on the first day and something a port can break without
saying so: a merge order that concatenates where it should override, a forgotten spread, a
reference that stops at a wrapper, a missing slot. They read the same for every component, so a
specification calls one function rather than copying five cases.

```tsx
import { describeContract, part } from '@stealthscale/tool-testing-react'

describeContract<HTMLDivElement>({
  element: (props) => <Card {...props} />,
  overrides: ['rounded-none', 'rounded-xl'],
  slot: 'card',
})
```

`overrides` is the pair that has to collide: the first is what a consumer passes, the second is
what the component ships, and the consumer's has to win. That only happens where the component
merges its classes rather than joining them.

A component whose root is a function component that never declared a `ref`, or whose inline
styles are written by the library that owns it, sets `skipRef` or `skipStyle`. Set either only
with that kind of reason: a reference that stops in one of our own wrappers is a defect to fix
rather than a case to skip.

## Reading a part

```tsx
const { container } = render(<Card render={<article />} />)

expect(renderedAs(container, 'card')).toBe('ARTICLE')
expect(attr(container, 'card', 'surface')).toBe('own')
```

`part` throws where the slot is absent, naming it, so a specification needs neither a non-null
assertion, which the lint refuses, nor a guard at every call site. A rename then reads as "no
such part" rather than as an assertion about `undefined` three lines later.

## Install

```sh
bun add -d @stealthscale/tool-testing-react
```

React and `@testing-library/react` are peers, since the repository installing this already
renders.
