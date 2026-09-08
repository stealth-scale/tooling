/**
 * @fileoverview The `stealth` command: what it calls itself, and which subcommand takes a
 * run. Every subcommand is imported when it is asked for, so `stealth --help` loads this
 * file and nothing else.
 */

import { type CommandDef, type CommandMeta, defineCommand } from 'citty'

import { type Manifest, packageRoot, readManifest } from './workspace/manifests.ts'

/**
 * Reads what a command calls itself off the manifest of the package that ships it, so the
 * name, the summary and the version have one source.
 *
 * @param {Manifest} manifest - The manifest of the package that ships the bin.
 * @returns {CommandMeta} The first command the manifest installs, its summary and its version.
 */
export function commandMeta(manifest: Manifest): CommandMeta {
  return {
    description: manifest.description ?? '',
    name: Object.keys(manifest.bin)[0] ?? manifest.name,
    version: manifest.version,
  }
}

/**
 * The `stealth` command: the bin's name, its own version, and the subcommands under it.
 */
export const stealth: CommandDef = defineCommand({
  meta: commandMeta(readManifest(packageRoot(import.meta.dirname))),
  subCommands: {
    /**
     * Loads the release command the first time a run asks for it.
     *
     * @returns {Promise<CommandDef>} The release command.
     */
    release: () => import('./release/command.ts').then((module) => module.releaseCommand),
  },
})
