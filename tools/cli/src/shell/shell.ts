/**
 * @fileoverview Runs the commands the `stealth` tool needs: bun, npm and a registry, as real
 * processes that the tool owns. A specification hands the tool a shell that records instead.
 */

import { spawn } from 'node:child_process'
import { closeSync, openSync } from 'node:fs'
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
   * It sends `SIGTERM` first and gives the process five seconds to leave on its own, then
   * sends `SIGKILL`, so a child that traps the first signal cannot hold the tool open. It
   * resolves after the exit either way, and closing the log file is part of that exit.
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
 * Sets how long a stopped process is given to leave on `SIGTERM` before it is killed.
 */
const GRACE_MS = 1000

/**
 * Starts one long-lived process, owned by its pid.
 *
 * The log file is opened here and closed when the process exits, so a tool that starts and
 * stops several registries over a run does not run out of descriptors.
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
  /**
   * Waits for the process to end, however it ends, and closes its log.
   *
   * A process that never spawned reports `error` and one that ran reports `exit`, so the
   * wait settles on either; a promise settles once, so the log is closed once.
   *
   * @returns {Promise<void>} Resolves after the exit, with the log closed.
   */
  async function untilClosed(): Promise<void> {
    await new Promise<void>((resolve) => {
      child.once('exit', () => {
        resolve()
      })
      child.once('error', () => {
        resolve()
      })
    })
    closeSync(log)
  }

  const exited = untilClosed()

  return {
    pid: child.pid ?? 0,
    /**
     * Asks the process to leave, kills it if it will not, and waits for the exit.
     *
     * @returns {Promise<void>} Resolves after the exit.
     */
    stop: async () => {
      child.kill('SIGTERM')
      const killer = setTimeout(() => {
        child.kill('SIGKILL')
      }, GRACE_MS)
      try {
        await exited
      } finally {
        clearTimeout(killer)
      }
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
