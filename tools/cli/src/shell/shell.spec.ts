import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { describe, expect, it, vi } from 'vite-plus/test'

import { scratchWorkspace } from '@stealthscale/tool-testing'

import { inOrder, shell } from './shell.ts'

/** Node, run with a one-line script. */
function node(script: string): [string, string[]] {
  return [process.execPath, ['-e', script]]
}

describe('shell', () => {
  const real = shell()

  describe('run', () => {
    it('returns the exit code and both streams, and does not throw on a failure', async () => {
      const [file, args] = node(
        'process.stdout.write("out"); process.stderr.write("err"); process.exit(3)',
      )

      await expect(real.run(file, args, { cwd: tmpdir() })).resolves.toEqual({
        code: 3,
        stderr: 'err',
        stdout: 'out',
      })
    })

    it('hands the command its working directory and the added environment', async () => {
      const [file, args] = node(
        'process.stdout.write(process.cwd() + "|" + process.env.STEALTH_PROBE)',
      )

      const outcome = await real.run(file, args, { cwd: tmpdir(), env: { STEALTH_PROBE: 'seen' } })

      expect(outcome.stdout).toBe(`${tmpdir()}|seen`)
    })

    it('reports a command that could not start as a failure with the reason', async () => {
      const outcome = await real.run('/nowhere/no-such-command', [], { cwd: tmpdir() })

      expect(outcome.code).toBe(1)
      expect(outcome.stderr).toContain('ENOENT')
    })

    it('reports a process a signal killed as a failure', async () => {
      const [file, args] = node('process.kill(process.pid, "SIGKILL")')

      const outcome = await real.run(file, args, { cwd: tmpdir() })

      expect(outcome.code).toBe(1)
    })
  })

  describe('start', () => {
    it('owns the process it started: a pid, a log, and a stop that waits for the exit', async () => {
      const workspace = scratchWorkspace()
      const log = workspace.path('out.log')
      const [file, args] = node('console.log("up"); setInterval(() => {}, 1000)')

      const running = real.start(file, args, { cwd: workspace.root, log })

      expect(running.pid).toBeGreaterThan(0)
      await vi.waitFor(() => {
        expect(readFileSync(log, 'utf8')).toContain('up')
      })
      await running.stop()
      expect(() => process.kill(running.pid, 0)).toThrow('ESRCH')
      workspace.remove()
    })

    it('answers pid 0 for a process that never started, and still stops cleanly', async () => {
      const workspace = scratchWorkspace()

      const running = real.start('/nowhere/no-such-command', [], {
        cwd: workspace.root,
        log: workspace.path('out.log'),
      })

      expect(running.pid).toBe(0)
      await expect(running.stop()).resolves.toBeUndefined()
      workspace.remove()
    })
  })

  describe('freePort', () => {
    it('answers a port in the ephemeral range', async () => {
      const port = await real.freePort()

      expect(port).toBeGreaterThan(1024)
      expect(port).toBeLessThan(65_536)
    })
  })
})

describe('inOrder', () => {
  it('runs the steps one after another and keeps their results in order', async () => {
    const started: number[] = []

    const results = await inOrder([30, 10, 20], async (delay) => {
      started.push(delay)
      await new Promise((resolve) => {
        setTimeout(resolve, delay)
      })
      return delay * 2
    })

    expect(results).toEqual([60, 20, 40])
    expect(started).toEqual([30, 10, 20])
  })

  it('answers nothing for nothing', async () => {
    await expect(inOrder([], () => Promise.resolve(1))).resolves.toEqual([])
  })
})
