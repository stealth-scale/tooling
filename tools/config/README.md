# @stealthscale/tool-config

A **kit**: a dev-time library another repository takes.

What every stealth repository's toolchain is, so no repository settles it twice: how files are
formatted, what the linter enforces, how libraries are packed, how specifications run, and
what CI does. It ships the tsconfig bases beside them.

## The root config composes it

`stealthDefaults` builds every block at its shared value. Spread it, then replace the blocks
this repository configures by calling that block's own builder:

```ts
import { defineConfig } from 'vite-plus'
import { lintConfig, stealthDefaults, testConfig } from '@stealthscale/tool-config'

export default defineConfig({
  ...stealthDefaults({ sourceCondition: 'ui-source' }),
  lint: lintConfig({ web: ['components/**'] }),
  test: testConfig({ dom: true }),
})
```

The source condition is named after the repository, `ui-source` in ui and `tooling-source`
here, never one name every repository shares. A repository turns its condition on for
everything it resolves, installed packages included, so a shared name would send a published
package to a `src` directory its tarball does not carry. The one name reaches both resolvers
and the pack step, which writes it into every exports map.

A replaced block is replaced whole rather than merged, which is why each builder returns a
complete block and takes options instead of a patch.

| Builder                  | Configures                                                                     |
| ------------------------ | ------------------------------------------------------------------------------ |
| `formatConfig`           | `fmt` — width, quotes, what a build wrote                                      |
| `lintConfig`             | `lint` — the rules, the plugins, which globs render or run in Node             |
| `packConfig`             | `pack` — the declaration build, attw and publint, static exports               |
| `testConfig`             | `test` — the projects, the coverage floor                                      |
| `runConfig`              | `run` — the task graph and what `ci` does                                      |
| `stagedConfig`           | `staged` — the pre-commit pass                                                 |
| `sourceConditions`       | `resolve.conditions` — the source condition ahead of Vite's defaults           |
| `serverSourceConditions` | `ssr.resolve.conditions` — the same condition for the resolver Node runs under |

## The tsconfigs

```jsonc
// tsconfig.base.json, once at the repository root
{
  "extends": "@stealthscale/tool-config/tsconfig/base.json",
  "compilerOptions": { "customConditions": ["ui-source"] },
}
```

```jsonc
// a package's tsconfig.json
{ "extends": "../../tsconfig.base.json", "include": ["src"] }
```

`base.json` is what every package compiles under. A repository extends it once, in a
`tsconfig.base.json` of its own that names the repository's source condition, so the type
checker reads a workspace package's source exactly as the bundler does; every package extends
that. `react.json` adds the document and the automatic JSX runtime, and a repository that
renders extends it the same way beside the first. A package extending either declares this
package as a devDependency, which is what puts it on disk.

## Install

```sh
bun add -d @stealthscale/tool-config
```
