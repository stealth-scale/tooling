import type { CommandOutcome, Shell } from './shell.ts'

/**
 * Describes one command a recording shell was asked to run.
 */
export interface RecordedCommand {
  /**
   * Carries the file and its arguments as one line.
   */
  command: string

  /**
   * Names the working directory the command was given.
   */
  cwd: string

  /**
   * Carries what was added to the environment, when anything was.
   */
  env: Readonly<Record<string, string>> | undefined
}

/**
 * Answers a command in a recording shell. `undefined` means a clean, silent success.
 */
export type Answer = (command: string, cwd: string) => Partial<CommandOutcome> | undefined

/**
 * Describes a shell that runs nothing and remembers everything it was told.
 */
export interface RecordingShell {
  /**
   * Lists every command `run` was given, in order.
   */
  asked: RecordedCommand[]

  /**
   * Carries the shell itself, to hand to the code under test.
   */
  shell: Shell

  /**
   * Lists every command `start` was given, as one line each.
   */
  started: string[]

  /**
   * Counts how many times a started process was stopped.
   */
  stopped: number
}

/**
 * Builds a shell for a specification: `run` answers from `answer`, `start` returns a process
 * with a fixed pid, and `freePort` always hands out `port`.
 *
 * @param {Answer} [answer] - What a command gets back. Default: success with no output.
 * @param {number} [port] - The one free port. Default: 4999.
 * @returns {RecordingShell} The shell and the record of what it was asked.
 */
export function recordingShell(answer: Answer = () => ({}), port = 4999): RecordingShell {
  const state: RecordingShell = { asked: [], shell: {} as Shell, started: [], stopped: 0 }
  state.shell = {
    freePort: () => Promise.resolve(port),
    run: (file, args, options) => {
      const command = [file, ...args].join(' ')
      state.asked.push({ command, cwd: options.cwd, env: options.env })
      return Promise.resolve({ code: 0, stderr: '', stdout: '', ...answer(command, options.cwd) })
    },
    start: (file, args) => {
      state.started.push([file, ...args].join(' '))
      return {
        pid: 4242,
        stop: () => {
          state.stopped += 1
          return Promise.resolve()
        },
      }
    },
  }
  return state
}
