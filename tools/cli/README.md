# @stealthscale/tool-cli

A **cli**: it ships the `stealth` bin.

| Command                                            | What it does                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `stealth create product\|plugin\|component\|theme` | writes a new one from a template                                             |
| `stealth dev`                                      | runs a product from its document                                             |
| `stealth messages`                                 | compiles ICU catalogues to one typed function per key                        |
| `stealth derive`                                   | writes what the tree implies — barrels, READMEs, theme stylesheets           |
| `stealth smoke`                                    | packs, publishes to a local registry, installs into a consumer and builds it |
| `stealth release`                                  | publishes the closure of the public packages in dependency order             |

The generators, the codegen and the publish harness are modules of this package, not
packages of their own.

The command tree is [citty](https://github.com/unjs/citty): a subcommand is one object with
its arguments typed from their declarations, and it is imported when a run asks for it, so
`stealth --help` loads nothing else. Commander and cac both hand a command's options to its
callback as `any`, which is the one place a typo in an option name would otherwise be caught.

`stealth create` writes the files itself and validates options with
[`@stealthscale/core-schema`](../../core/schema). There is no bingo and no zod: bingo brings
fourteen dependencies, prompts and repository creation for a job that is writing files, and
a template that cannot place itself produces a tsconfig whose `extends` does not resolve.

## Install

```sh
bun add -d @stealthscale/tool-cli
```
