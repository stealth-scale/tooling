# @stealthscale/tool-storybook

A **kit**: another repository takes it at development time.

Builds a repository's Storybook. A story states the component and the scene; where it sits in
the sidebar, what it is drawn in and what it is tested for are all read off the workspace, so
adding a package puts its stories in Storybook and no file outside that package changes. Five
pages that document the theme contract open every Storybook.

## Setting a repository up

Storybook resolves its addons from the repository and holds every one to its own version, so
the repository installs them beside the kit:

```sh
bun add -d @stealthscale/tool-storybook storybook @storybook/react-vite @storybook/addon-docs \
  @storybook/addon-a11y @storybook/addon-vitest storybook-addon-pseudo-states \
  @tailwindcss/vite @vitest/browser-playwright playwright
```

One file configures Storybook:

```ts
// .storybook/main.ts
import { storybookConfig } from '@stealthscale/tool-storybook/config'

export default storybookConfig({ sourceCondition: 'ui-source' })
```

The condition is the repository's own, the one its root config names, because Storybook
assembles a Vite configuration that inherits nothing from the repository's. Two lines in the
root config run it. The tasks serve and build Storybook, and the project plays every story in
Chromium as part of `vp test`:

```ts
export default defineConfig({
  ...stealthDefaults({ sourceCondition: 'ui-source' }),
  run: runConfig({ storybook: true }),
  test: testConfig({ dom: true, projects: [storiesProject()] }),
})
```

`vp run storybook` serves it and `vp run storybook:build` writes `storybook-static/`, which
`ci` does after the specifications pass. Both build the workspace first, because Storybook
loads this kit and every theme from what each package packed.

## What a repository never states

`storybookConfig` reads the workspace and answers the rest of Storybook's configuration:

- **Where the stories are.** Every workspace package's `src`, named one directory at a time
  rather than as one glob, because Storybook derives a story's fallback title from the
  directory it was found under.
- **What each story is called.** The group directory is the section, the rest of the package's
  path is the next level, and what sits below `src` is the rest:
  `components/library/src/button/button.stories.tsx` is `Components/Library/Button`. A file
  named after its own directory names it once.
- **Which stories the sidebar shows.** The Playground, and nothing else. Every other story is
  an example: its page shows it under the section that argues for it, and the runner plays it,
  so a second sidebar entry says nothing. A story file with no Playground is refused at index
  time, naming the file. The rule is applied in the indexer rather than written per story,
  because Storybook reads a story file without evaluating it and a tag reached through an
  imported binding never arrives.
- **The preview and the frame.** The kit registers its own preset, which loads the preview
  every story is drawn in and the manager entry that draws Storybook's frame in the story's
  theme.

## What a package registers

A theme registers itself under `stealth.theme`, and a design system registers what everything
draws with under `stealth.appearance`. The kit reads both and carries them into the browser as
modules it answers itself: every theme's solved table and its scoped stylesheet, read from
the artefacts the theme package exports at `./values` and `./scoped.css`; the provider that
wraps every story; the stylesheets that come before any theme; and what each toolbar may
offer. Every path is resolved against the package that registered it, so nothing at the
repository's root has to depend on a theme.

The six toolbars are `core-appearance`'s six values, so what a person picks in Storybook is
exactly what a host would put on the document. A toolbar that would offer one choice is not
drawn.

## The pages

Every Storybook opens with `Foundations`: Colours, Typography, Shape, Motion and
Accessibility. Each page draws the theme the toolbars are on from the contract in `core-theme`,
so a token added to the contract appears on the page and one removed disappears from it. The
accessibility page measures every pair the contract guarantees against the theme, so a theme
that fails one says so on its own page.

## Entries

| Entry       | Taken by                                                                                |
| ----------- | --------------------------------------------------------------------------------------- |
| `.`         | Every story file: `example`, `interactive`, `Grid`, `StateGrid`, `forcedBy`, `localeOf` |
| `./config`  | `.storybook/main.ts`, and the root config through `storiesProject()`                    |
| `./docs`    | A page of a repository's own: the blocks the five pages are drawn with                  |
| `./preset`  | Storybook, registered by `storybookConfig`                                              |
| `./preview` | Storybook, through the preset                                                           |
| `./manager` | Storybook, through the preset                                                           |

## Install

```sh
bun add -d @stealthscale/tool-storybook
```
