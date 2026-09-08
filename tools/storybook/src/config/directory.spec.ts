import { describe, expect, it } from 'vite-plus/test'

import { CONFIG_DIR } from './directory.ts'

describe('CONFIG_DIR', () => {
  it("is Storybook's own default, so a repository passes no flag to reach it", () => {
    expect(CONFIG_DIR).toBe('.storybook')
  })
})
