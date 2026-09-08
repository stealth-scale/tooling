import { describe, expect, it } from 'vite-plus/test'

import { failed, failures, lastLines, passed, render } from './report.ts'

describe('passed and failed', () => {
  it('build a step with its name, its detail and how it went', () => {
    expect(passed('pack @t/a')).toEqual({ detail: '', name: 'pack @t/a', ok: true })
    expect(passed('pack @t/a', 'a.tgz')).toEqual({ detail: 'a.tgz', name: 'pack @t/a', ok: true })
    expect(failed('pack @t/a', 'no files')).toEqual({
      detail: 'no files',
      name: 'pack @t/a',
      ok: false,
    })
  })
})

describe('failures', () => {
  it('lists the failed steps in order', () => {
    const report = {
      steps: [passed('one'), failed('two', 'x'), passed('three'), failed('four', 'y')],
      workdir: '/run',
    }

    expect(failures(report).map((step) => step.name)).toEqual(['two', 'four'])
  })
})

describe('lastLines', () => {
  it('keeps the end of the output and drops the blank lines around it', () => {
    expect(lastLines('\n\nfirst\nsecond\n\n')).toBe('first\nsecond')
  })

  it('drops stack frames, so the cause stays inside the window', () => {
    const frames = Array.from({ length: 30 }, (_, index) => `    at frame${index} (file.js:1:1)`)

    expect(lastLines(['error: refused', ...frames].join('\n'))).toBe('error: refused')
  })

  it('keeps twenty lines unless told how many', () => {
    const lines = Array.from({ length: 25 }, (_, index) => `line ${index}`)

    expect(lastLines(lines.join('\n')).split('\n')).toHaveLength(20)
    expect(lastLines(lines.join('\n')).split('\n')[0]).toBe('line 5')
    expect(lastLines(lines.join('\n'), 3)).toBe('line 22\nline 23\nline 24')
  })

  it('is empty for output with nothing in it', () => {
    expect(lastLines('')).toBe('')
    expect(lastLines('\n  \n')).toBe('')
  })
})

describe('render', () => {
  it('writes one line per step, the detail under it, and the count', () => {
    const report = {
      steps: [passed('release set', '2 packages'), passed('publish @t/a@0.1.0')],
      workdir: '/run',
    }

    expect(render(report)).toBe(
      [
        'ok    release set',
        '      2 packages',
        'ok    publish @t/a@0.1.0',
        '',
        '2 steps, all passed',
        '',
      ].join('\n'),
    )
  })

  it('names the directory to read after a failure', () => {
    const report = {
      steps: [failed('pack @t/a', 'error: no files\nerror: nothing to pack')],
      workdir: '/run',
    }

    expect(render(report)).toBe(
      [
        'FAIL  pack @t/a',
        '      error: no files',
        '      error: nothing to pack',
        '',
        "1 steps, 1 failed; the run's files are in /run",
        '',
      ].join('\n'),
    )
  })
})
