# @stealthscale/tool-cli

A **cli**: it ships the `stealth` bin.

| Command           | What it does                                                     |
| ----------------- | ---------------------------------------------------------------- |
| `stealth release` | publishes the closure of the public packages in dependency order |

The publish harness is a module of this package, not a package of its own.

The command tree is [citty](https://github.com/unjs/citty): a subcommand is one object with
its arguments typed from their declarations, and it is imported when a run asks for it, so
`stealth --help` loads nothing else. Commander and cac both hand a command's options to its
callback as `any`, which is the one place a typo in an option name would otherwise be caught.

## Install

```sh
bun add -d @stealthscale/tool-cli
```
