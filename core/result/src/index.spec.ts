import { describe, expect, it } from 'vite-plus/test'

import * as result from './index.ts'

describe('the package barrel', () => {
  it('exports the two constructors and the combinators, and nothing else', () => {
    expect(Object.keys(result).toSorted()).toEqual([
      'andThen',
      'collect',
      'mapFailure',
      'mapValue',
      'refused',
      'succeeded',
      'valueOr',
    ])
  })
})
