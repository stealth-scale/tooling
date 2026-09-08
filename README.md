# tooling

How a stealth repository is built. Read this if you are setting one up.

`core/` is what every tier stands on. `tools/` is what builds, checks, tests and releases.

| Package                          | Kind    | What it is                                            |
| -------------------------------- | ------- | ----------------------------------------------------- |
| [`core/env`](core/env)           | library | the environment as a value; layered `.env` files      |
| [`core/locale`](core/locale)     | library | which locale to answer in; BCP-47 and ECMA-402 lookup |
| [`core/logging`](core/logging)   | library | the contract a library logs through                   |
| [`core/result`](core/result)     | library | success or refusal as a value, rather than a throw    |
| [`core/schema`](core/schema)     | library | validation and parsing; owns valibot                  |
| [`tools/cli`](tools/cli)         | cli     | the `stealth` bin                                     |
| [`tools/config`](tools/config)   | kit     | the toolchain config and the tsconfig bases           |
| [`tools/testing`](tools/testing) | kit     | the scratch workspace a spec reads a tree from        |

A package's name is its group's word in the singular, then its path below it, dashes for
slashes: `core/schema` is `@stealthscale/core-schema`, `tools/config` is
`@stealthscale/tool-config`. The rule has no exceptions and a guard refuses a manifest whose
name is not its path.

A module is the default; a package needs one of four reasons, and its README's first line
names which. A concern inside a package is a directory and a subpath entry, not a package.

## Working here

```sh
bun install
vp check          # format and lint, with --fix to apply
vp test           # the specs, at a 100% floor
vp run -r build   # pack every library
vp run ci         # what CI runs: install, audit, build, check, test
```

Every package resolves to its source through the `stealth-source` export condition, so there
is no build step between editing a package and running its consumers' specs. A consumer
outside the workspace never sees that condition and resolves `dist`.

A change to a published package carries a changeset, written by `bunx changeset`. The
release workflow turns the pending changesets into one version pull request, and merging it
publishes every package whose version is not on the registry yet, with provenance.
[CONTRIBUTING.md](CONTRIBUTING.md) is the rest.
