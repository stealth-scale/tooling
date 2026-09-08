# Contributing

## Getting set up

bun 1.4 or later. `bun install` downloads the pinned bun when yours is older, and runs
`vp config`, which writes the git hooks.

```sh
git clone git@github.com:stealth-scale/tooling.git
cd tooling
bun install
vp run ci
```

A dependency published in the last three days is refused by `bun install`; `bunfig.toml`
says why and how to override it for one install.

## Before you open a pull request

```sh
vp check --fix   # format and lint, applying what can be fixed
vp test          # every specification, at a 100% floor
vp run ci        # what CI runs: install, audit, build, check, test
```

`vp run ci` is the same task the workflow runs, on the same lockfile.

## A change to a published package

`bunx changeset` writes a changeset naming the package and the bump: a `!` commit is a
major, a `feat` a minor, a `fix` a patch. The release workflow turns pending changesets into
one version pull request, and merging that pull request publishes.

## Conventions

The standards every stealth repository follows are at https://docs.stealthscale.io:
repositories and packages, code standards, docblocks, commit messages, documentation.

## Review

A pull request is reviewed by a maintainer of the stealth-scale organisation. A change to
the toolchain preset names the repositories it changes the gates for.
