# @stealthscale/tool-workspace

A **kit**: another repository takes it at development time.

Reads a workspace off its manifests. It answers which packages the root names, what each one
declares, and the order their dependencies put them in, so a release, a guard and a Storybook
all work from one reading of the tree rather than a list somebody keeps in step.

```ts
import { dependencyClosure, workspaceManifests, workspaceRoot } from '@stealthscale/tool-workspace'

const root = workspaceRoot(process.cwd())
const manifests = workspaceManifests(root)
const { missing, ordered } = dependencyClosure(['@acme/web'], manifests)
```

`workspaceRoot` walks up until a manifest names workspaces; `packageRoot` walks up until a
manifest names anything, which is how a module reads its own package's version whatever depth
it was emitted at. `workspacePatterns` and `expandWorkspacePattern` turn the root's globs into
directories, and `readManifest` narrows one manifest to the fields the toolchain reads.
`dependencyClosure` orders a set of roots so a list walked front to back never meets a package
before what it needs.

## What a package registers

`Manifest.contributions` carries a package's `stealth` field exactly as written, unread. A
consumer reads one kind of contribution out of it by naming the key and handing over the
schema for what sits under that key:

```ts
import { contributions, workspaceManifests } from '@stealthscale/tool-workspace'
import { THEME_CONTRIBUTION, THEME_KEY } from '@stealthscale/core-theme'

const read = contributions(workspaceManifests(root), THEME_KEY, THEME_CONTRIBUTION)
```

Every package that registered that kind comes back in workspace order, each beside the
manifest that declared it, so a relative path inside the contribution resolves against the
package it came from. A field that does not fit the schema is a refusal rather than a throw,
and every malformed package is reported at once, each issue pointing at
`@scope/pkg.stealth.theme.title`.

This package knows the field exists and nothing about what a package may put in it. The words
a theme, an appearance or a set of messages is declared with belong to whatever owns those
words, and adding a kind of contribution changes nothing here.

## Install

```sh
bun add -d @stealthscale/tool-workspace
```
