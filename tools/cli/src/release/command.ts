/**
 * @fileoverview The `stealth release` command: what it takes from the command line, and how
 * it turns that into a release run. Everything the run touches from outside arrives as a
 * dependency, so a specification drives the whole command without a registry or a process.
 */

import { type CommandContext, type CommandDef, defineCommand, type ParsedArgs } from 'citty'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { workspaceRoot } from '@stealthscale/tool-workspace'

import { failures, render } from '#report/report.ts'
import { type Shell, shell } from '#shell/shell.ts'

import { release } from './release.ts'

/**
 * Prefixes the directory the tarballs are written to, so a leftover run is recognisable in
 * the temporary directory.
 */
const TARBALL_PREFIX = 'stealth-release-'

/**
 * What `stealth release` takes from the command line.
 *
 * The registry and the token are absent by default: npm reads its own configuration, and a
 * manifest's `publishConfig` overrides it per package. Naming either here is for a run that
 * publishes somewhere else, such as a local registry in a smoke test.
 */
const RELEASE_ARGS = {
  'dry-run': {
    default: false,
    description: 'Report what would be published, and publish nothing.',
    type: 'boolean',
  },
  provenance: {
    default: false,
    description: "Attest provenance through the CI job's token. Npm refuses it elsewhere.",
    type: 'boolean',
  },
  registry: {
    description: 'Publish to this registry instead of the one npm is configured for.',
    type: 'string',
    valueHint: 'url',
  },
  tarballs: {
    description: 'Write the tarballs here instead of a new temporary directory.',
    type: 'string',
    valueHint: 'dir',
  },
  userconfig: {
    description: "Read npm's configuration, and so the token, from this file.",
    type: 'string',
    valueHint: 'file',
  },
} as const

/**
 * Describes everything the release command reaches outside itself.
 */
export interface ReleaseDeps {
  /**
   * Names the file changesets/action reads the published tags from, which it hands the run
   * in `CHANGESETS_OUTPUT`. Outside that action there is nothing to tell and nothing here.
   */
  changesetsOutput: string | undefined

  /**
   * Names the directory the command was run in, which is where the workspace is looked for.
   */
  cwd: string

  /**
   * Asks a registry what it already holds.
   */
  fetch: typeof fetch

  /**
   * Writes the report where a person reads it. Whatever it answers is not read, so a stream's
   * own `write` is passed straight in.
   */
  log: (text: string) => unknown

  /**
   * Runs bun and npm.
   */
  shell: Shell
}

/**
 * Runs a release from the parsed command line and reports it.
 *
 * The exit code is set rather than thrown: a failed publish is an outcome the report already
 * explains, and throwing would print a stack trace over it.
 *
 * @param {ParsedArgs<typeof RELEASE_ARGS>} args - The command line, as citty parsed it.
 * @param {ReleaseDeps} deps - The workspace, the registry, the shell and where to write.
 * @returns {Promise<void>} Resolves once the report is written.
 */
async function runRelease(args: ParsedArgs<typeof RELEASE_ARGS>, deps: ReleaseDeps): Promise<void> {
  const report = await release(
    {
      changesetsOutput: deps.changesetsOutput,
      dryRun: args['dry-run'],
      fetch: deps.fetch,
      provenance: args.provenance,
      registry: args.registry,
      root: workspaceRoot(deps.cwd),
      tarballs: args.tarballs ?? mkdtempSync(join(tmpdir(), TARBALL_PREFIX)),
      userconfig: args.userconfig,
    },
    deps.shell,
  )
  deps.log(render(report))
  if (failures(report).length > 0) process.exitCode = 1
}

/**
 * Builds the release command against the outside world it is given.
 *
 * @param {ReleaseDeps} deps - The workspace, the registry, the shell and where to write.
 * @returns {CommandDef} The command, ready to hand to citty.
 */
export function releaseCommandWith(deps: ReleaseDeps): CommandDef<typeof RELEASE_ARGS> {
  return defineCommand({
    args: RELEASE_ARGS,
    meta: {
      description: 'Publish every public package the registry does not have yet.',
      name: 'release',
    },
    /**
     * Runs the release the command line asks for.
     *
     * @param {CommandContext<typeof RELEASE_ARGS>} context - The command line, as citty
     *     parsed it.
     * @returns {Promise<void>} Resolves once the report is written.
     */
    run: ({ args }: CommandContext<typeof RELEASE_ARGS>) => runRelease(args, deps),
  })
}

/**
 * The release command as the `stealth` bin runs it: this process, the real registry, a real
 * shell and the terminal.
 */
export const releaseCommand = releaseCommandWith({
  changesetsOutput: process.env['CHANGESETS_OUTPUT'],
  cwd: process.cwd(),
  fetch,
  log: process.stdout.write.bind(process.stdout),
  shell: shell(),
})
