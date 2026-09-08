import { describe, expect, it } from 'vite-plus/test'

import * as pkg from './index.ts'
import * as vite from './vite/index.ts'

describe('the package barrel', () => {
  it("carries the toolchain configuration, which is this package's primary job", () => {
    expect(Object.keys(pkg).toSorted()).toEqual(Object.keys(vite).toSorted())
  })

  it('is the same binding, not a copy, so there is one of each', () => {
    const exported = new Map(Object.entries(pkg))
    const bindings = Object.entries(vite)

    expect(bindings.length, 'there is something to compare').toBeGreaterThan(0)
    for (const [name, binding] of bindings) {
      expect(exported.get(name), name).toBe(binding)
    }
  })
})
