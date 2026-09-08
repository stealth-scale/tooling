/**
 * @fileoverview Records what a run of the tool did, step by step, and renders it for a
 * terminal: one line per step, the reason under a failure, and where the run's files are.
 */

/**
 * Describes one thing a run did, and how it went.
 */
export interface Step {
  /**
   * Carries what was found or what went wrong. It is empty when there is nothing to add.
   */
  detail: string

  /**
   * Names the stage and its subject: `publish @stealthscale/core-schema@0.1.0`.
   */
  name: string

  /**
   * Marks whether the step went as it should.
   */
  ok: boolean
}

/**
 * Describes everything a run did, in order, and where its files are.
 */
export interface Report {
  /**
   * Lists the steps in the order they ran.
   */
  steps: readonly Step[]

  /**
   * Names the directory that holds the run's tarballs and logs, kept for reading after a
   * failure.
   */
  workdir: string
}

/**
 * Matches a stack frame, which says where a tool was when it failed rather than why.
 */
const STACK_FRAME = /^\s+at\s/u

/**
 * Builds a step that went as it should.
 *
 * @param {string} name - The stage and its subject.
 * @param {string} [detail] - Text worth reading even so, such as a checker's warnings.
 *     Default: nothing.
 * @returns {Step} The step.
 */
export function passed(name: string, detail = ''): Step {
  return { detail, name, ok: true }
}

/**
 * Builds a step that did not go as it should.
 *
 * @param {string} name - The stage and its subject.
 * @param {string} detail - The reason: the command's last lines, or what was found wanting.
 * @returns {Step} The step.
 */
export function failed(name: string, detail: string): Step {
  return { detail, name, ok: false }
}

/**
 * Lists the steps of a run that failed.
 *
 * @param {Report} report - The run.
 * @returns {Step[]} The failed steps, in order.
 */
export function failures(report: Report): Step[] {
  return report.steps.filter((step) => !step.ok)
}

/**
 * Keeps the end of what a command wrote, which is where the reason usually is. Stack frames
 * go first: a bundler's failure is one line of cause over thirty lines of frames.
 *
 * @param {string} output - Everything the command wrote, both streams together.
 * @param {number} [keep] - How many lines to keep at most. Default: 20.
 * @returns {string} The last lines, with blank lines at either end dropped.
 */
export function lastLines(output: string, keep = 20): string {
  const lines = output.split('\n').filter((line) => !STACK_FRAME.test(line))
  const first = lines.findIndex((line) => line.trim() !== '')
  if (first === -1) return ''
  const last = lines.findLastIndex((line) => line.trim() !== '') + 1
  return lines.slice(Math.max(first, last - keep), last).join('\n')
}

/**
 * Renders a report as text: one line per step, a step's detail indented under it, then the
 * count and, when something failed, where to look.
 *
 * @param {Report} report - The run.
 * @returns {string} The text, ending in a newline.
 */
export function render(report: Report): string {
  const lines = report.steps.flatMap((step) => [
    `${step.ok ? 'ok  ' : 'FAIL'}  ${step.name}`,
    ...(step.detail === '' ? [] : step.detail.split('\n').map((line) => `      ${line}`)),
  ])
  const count = failures(report).length
  const summary =
    count === 0
      ? `${report.steps.length} steps, all passed`
      : `${report.steps.length} steps, ${count} failed; the run's files are in ${report.workdir}`
  return [...lines, '', summary, ''].join('\n')
}
