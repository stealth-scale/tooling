# @stealthscale/tool-workspace

A **kit**: another repository takes it at development time.

Reads a workspace off its manifests. It answers which packages the root names, what each one
declares, and the order their dependencies put them in, so a release, a guard and a catalogue
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

## What it does not decide

`Manifest.contributions` carries a package's `stealth` field exactly as written, unread. This
package knows the field exists and nothing about what a package may put in it: the schema for
a theme, for what a catalogue draws with, or for the words a package ships belongs to whatever
owns those words, and that consumer holds the field to it.

## Install

```sh
bun add -d @stealthscale/tool-workspace
```
