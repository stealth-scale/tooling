import { describe, expect, it } from 'vite-plus/test'

import * as env from './index.ts'

describe('the package barrel', () => {
  it('exports the environment, the two readers and the file layer, and nothing else', () => {
    expect(Object.keys(env).toSorted()).toEqual([
      'MissingVariableError',
      'envFiles',
      'environment',
      'onlyDefined',
      'read',
      'readEnvFile',
      'readEnvFiles',
      'readRequired',
    ])
  })
})
