/**
 * @fileoverview What the `stealth` command is made of, for a tool that runs a piece of it
 * rather than the bin: the command tree, the release harness, and the shell, report and
 * workspace readers the commands are built on.
 */

export { commandMeta, stealth } from './cli.ts'
export { type TagEvent, tagEvent, writeTagEvents } from './release/changesets.ts'
export { releaseCommand, releaseCommandWith, type ReleaseDeps } from './release/command.ts'
export {
  missingFiles,
  pack,
  type Packed,
  type PackResult,
  type PublishOptions,
  publishTarball,
} from './release/packages.ts'
export { configuredRegistry, registryHasVersion, withTrailingSlash } from './release/registry.ts'
export { release, type ReleaseOptions, releaseSet, type ReleaseSet } from './release/release.ts'
export {
  failed,
  failures,
  lastLines,
  passed,
  render,
  type Report,
  type Step,
} from './report/report.ts'
export {
  type CommandOutcome,
  inOrder,
  type RunOptions,
  shell,
  type Shell,
  type StartedProcess,
  type StartOptions,
} from './shell/shell.ts'
export {
  type Closure,
  dependencyClosure,
  expandWorkspacePattern,
  type Manifest,
  packageRoot,
  readManifest,
  workspaceManifests,
  workspacePatterns,
  workspaceRoot,
} from './workspace/manifests.ts'
