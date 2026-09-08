/**
 * @fileoverview Runs the commands the `stealth` tool needs: bun, npm and a registry, as real
 * processes that the tool owns. A specification hands the tool a shell that records instead.
 */

import { spawn } from 'node:child_process'
import { openSync } from 'node:fs'
import { createServer } from 'node:net'

import { looseObject, number, parse } from '@stealthscale/core-schema'

/**
 * Describes what a finished command left behind.
 */
export interface CommandOutcome {
  /**
   * Carries the exit code. It is `1` when the command could not start or a signal killed it.
   */
  code: number

  /**
   * Carries everything the command wrote to stderr.
   */
  stderr: string

  /**
   * Carries everything the command wrote to stdout.
   */
  stdout: string
}

/**
 * Describes where a command runs and what it sees.
 */
export interface RunOptions {
  /**
   * Names the working directory.
   */
  cwd: string

  /**
   * Adds variables to this process's environment for the command.
   */
  env?: Readonly<Record<string, string>> | undefined
}

/**
 * Describes where a long-lived process runs and where its output goes.
 */
export interface StartOptions extends RunOptions {
  /**
   * Names the file its stdout and stderr are appended to.
   */
  log: string
}

/**
 * Describes a process the tool started and so may stop.
 */
export interface StartedProcess {
  /**
   * Carries the process id, so the tool stops exactly what it started. It is `0` when the
   * process never started.
   */
  pid: number

  /**
   * Ends the process and resolves once it has exited.
   *
   * @returns {Promise<void>} Resolves after the exit.
   */
  stop: () => Promise<void>
}

/**
 * Describes how the tool runs commands. A specification hands one that answers.
 */
export interface Shell {
  /**
   * Finds a port nothing is listening on right now.
   *
   * @returns {Promise<number>} A port that was free when asked.
   */
  freePort: () => Promise<number>

  /**
   * Runs a command to completion and returns what it wrote. A non-zero exit does not throw.
   *
   * @param {string} file - The executable.
   * @param {readonly string[]} args - The arguments.
   * @param {RunOptions} options - The working directory and the environment.
   * @returns {Promise<CommandOutcome>} The exit code and both streams.
   */
  run: (file: string, args: readonly string[], options: RunOptions) => Promise<CommandOutcome>

  /**
   * Starts a long-lived process. Its output goes to the log file.
   *
   * @param {string} file - The executable.
   * @param {readonly string[]} args - The arguments.
   * @param {StartOptions} options - The working directory, the environment and the log file.
   * @returns {StartedProcess} The process, with its pid and a way to stop it.
   */
  start: (file: string, args: readonly string[], options: StartOptions) => StartedProcess
}

/**
 * Describes what a listening server answers for its address, in the one field the tool reads.
 */
const BOUND_ADDRESS = looseObject({ port: number() })

/**
 * Builds this process's environment with the command's own additions on top.
 *
 * @param {RunOptions} options - The options the command was given.
 * @returns {Readonly<Record<string, string | undefined>>} This process's variables, with the
 *     command's additions written over them.
 */
function environment(options: RunOptions): Readonly<Record<string, string | undefined>> {
  return { ...process.env, ...options.env }
}

/**
 * Runs one command to completion.
 *
 * @param {string} file - The executable.
 * @param {readonly string[]} args - The arguments.
 * @param {RunOptions} options - The working directory and the environment.
 * @returns {Promise<CommandOutcome>} The exit code and both streams.
 */
function run(file: string, args: readonly string[], options: RunOptions): Promise<CommandOutcome> {
  return new Promise((resolve) => {
    const child = spawn(file, [...args], {
      cwd: options.cwd,
      env: environment(options),
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => {
      resolve({ code: 1, stderr: error.message, stdout })
    })
    child.on('close', (code) => {
      resolve({ code: code ?? 1, stderr, stdout })
    })
  })
}

/**
 * Starts one long-lived process, owned by its pid.
 *
 * @param {string} file - The executable.
 * @param {readonly string[]} args - The arguments.
 * @param {StartOptions} options - The working directory, the environment and the log file.
 * @returns {StartedProcess} The process.
 */
function start(file: string, args: readonly string[], options: StartOptions): StartedProcess {
  const log = openSync(options.log, 'a')
  const child = spawn(file, [...args], {
    cwd: options.cwd,
    env: environment(options),
    stdio: ['ignore', log, log],
  })
  const exited = new Promise<void>((resolve) => {
    child.on('exit', () => {
      resolve()
    })
    child.on('error', () => {
      resolve()
    })
  })
  return {
    pid: child.pid ?? 0,
    /**
     * Kills the child and waits for it to exit.
     *
     * @returns {Promise<void>} Resolves after the exit.
     */
    stop: async () => {
      child.kill()
      await exited
    },
  }
}

/**
 * Asks the operating system for a port and gives it straight back.
 *
 * @returns {Promise<number>} A port that was free when asked.
 */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = parse(BOUND_ADDRESS, server.address())
      server.close(() => {
        resolve(port)
      })
    })
  })
}

/**
 * Builds the shell the tool runs under: real processes and real ports. `start` returns the
 * very process it spawned, so `stop` never reaches a process somebody else owns.
 *
 * @returns {Shell} A shell backed by real processes and real ports.
 */
export function shell(): Shell {
  return { freePort, run, start }
}

/**
 * Runs a step for each item, one after the other, and collects the results. The steps here
 * share a registry, a directory or a build order, so they must not overlap.
 *
 * @template Item - The type of one item.
 * @template Result - The type one step resolves to.
 * @param {readonly Item[]} items - The items to step through.
 * @param {(item: Item) => Promise<Result>} step - The step to run for each item.
 * @returns {Promise<Result[]>} Every result, in the items' order.
 */
export function inOrder<Item, Result>(
  items: readonly Item[],
  step: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  return items.reduce<Promise<Result[]>>(
    async (before, item) => [...(await before), await step(item)],
    Promise.resolve([]),
  )
}
