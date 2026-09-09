# @stealthscale/tool-config

## 0.1.3

### Patch Changes

- 4cdf822: Keeps a changelog out of the formatter and the linter. Changesets writes `CHANGELOG.md` in its own shape when it versions a package, and holding it to the formatter stops the release: the version commit lands on the default branch, the check refuses what changesets wrote, and the publish that only runs after a green check never runs.

## 0.1.2

### Patch Changes

- e2390be: Allows `@component` in a docblock. react-docgen recognises a component by the JSX it returns and so cannot see one drawn through `useRender`; the Storybook kit reads that tag to catch those. The tag list refused it, which left a component needing the annotation as a lint error and a component without it as an empty props table.

## 0.1.1

### Patch Changes

- 2ea6c72: Publishes the manifest that ships rather than the one a contributor works against. `bin` names the built file, so `npx stealth` runs under Node, and `exports` names what a tarball carries instead of a `src` directory it does not.

## 0.1.0

### Minor Changes

- Holds the toolchain every stealth repository runs: the formatter, the linter, how a library is packed and how a specification runs.
