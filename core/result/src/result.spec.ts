import { describe, expect, it } from 'vite-plus/test'

import {
  andThen,
  collect,
  type Collected,
  mapFailure,
  mapValue,
  refused,
  type Result,
  succeeded,
  valueOr,
} from './result.ts'

/**
 * A refusal shape close to what a boundary reports, so a spec reads as the case it describes.
 */
interface Issue {
  code: string
  path: string
}

describe('succeeded', () => {
  it('carries the value under a discriminator a caller narrows on', () => {
    const result: Result<number, Issue> = succeeded(3)

    expect(result.ok).toBe(true)
    expect(result.ok && result.value, 'narrowing on ok reaches the value').toBe(3)
  })

  it('carries a value that is itself falsy, because absence is not refusal', () => {
    // `vp check --fix` deletes a literal `undefined` argument.
    const nothing = undefined

    expect(succeeded(0).value).toBe(0)
    expect(succeeded(nothing).ok, 'undefined succeeded, it did not refuse').toBe(true)
  })
})

describe('refused', () => {
  it('carries the reason without throwing it', () => {
    const result: Result<number, Issue> = refused({ code: 'too_short', path: 'name' })

    expect(result.ok).toBe(false)
    expect(result.ok || result.failure.code).toBe('too_short')
  })
})

describe('valueOr', () => {
  it('reads a success and falls back on a refusal', () => {
    expect(valueOr(succeeded(3), 0)).toBe(3)
    expect(valueOr(refused<string>('nope'), 0)).toBe(0)
  })

  it('does not fall back on a falsy value the step really produced', () => {
    expect(valueOr(succeeded(0), 99), 'zero is a value, not an absence').toBe(0)
  })
})

describe('mapValue', () => {
  it('changes the value of a success', () => {
    expect(mapValue(succeeded(3), (value) => value * 2)).toEqual(succeeded(6))
  })

  it('leaves a refusal alone, and never runs the function on it', () => {
    let ran = false

    const result = mapValue(refused<string>('nope'), (value: number) => {
      ran = true
      return value
    })

    expect(result).toEqual(refused('nope'))
    expect(ran, 'the function never sees a refusal').toBe(false)
  })
})

describe('mapFailure', () => {
  it('restates the reason of a refusal in the caller own terms', () => {
    const result = mapFailure(refused<Issue>({ code: 'too_short', path: 'name' }), (issue) =>
      issue.code.toUpperCase(),
    )

    expect(result).toEqual(refused('TOO_SHORT'))
  })

  it('leaves a success alone, and never runs the function on it', () => {
    let ran = false

    const result = mapFailure(succeeded(3), (failure: string) => {
      ran = true
      return failure
    })

    expect(result).toEqual(succeeded(3))
    expect(ran).toBe(false)
  })
})

describe('andThen', () => {
  it('runs the next step on a success and carries its result out', () => {
    expect(andThen(succeeded(3), (value) => succeeded(value + 1))).toEqual(succeeded(4))
  })

  it('lets the next step refuse a value the one before produced', () => {
    expect(
      andThen(succeeded(-1), (value) => (value < 0 ? refused('negative') : succeeded(value))),
    ).toEqual(refused('negative'))
  })

  it('stops the chain at the first refusal, without running what follows', () => {
    let ran = false

    const result = andThen(refused<string>('first'), (value: number) => {
      ran = true
      return succeeded(value)
    })

    expect(result).toEqual(refused('first'))
    expect(ran, 'a chain stops where it refused').toBe(false)
  })
})

describe('collect', () => {
  it('gives every value in order when each step worked', () => {
    expect(collect([succeeded(1), succeeded(2), succeeded(3)])).toEqual(succeeded([1, 2, 3]))
  })

  it('reports every refusal rather than the first, so a form shows them all at once', () => {
    const results: Result<number, string>[] = [
      succeeded(1),
      refused('second'),
      succeeded(3),
      refused('fourth'),
    ]

    expect(collect(results), 'in the order the caller made them').toEqual(
      refused(['second', 'fourth']),
    )
  })

  it('succeeds with an empty list when there was nothing to collect', () => {
    expect(collect([])).toEqual(succeeded([]))
  })

  it('answers a `Collected`, which a caller can name without writing the union out', () => {
    const collected: Collected<number, string> = collect([succeeded(1), succeeded(2)])

    expect(collected).toEqual(succeeded([1, 2]))
  })
})
