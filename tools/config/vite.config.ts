import { defineConfig } from 'vite-plus'

// By relative path: this is the package that defines the preset, so it cannot resolve itself
// through the source condition the preset sets.
import { packConfig } from './src/index.ts'

/**
 * This package ships two things a build does not write: the tsconfig bases every stealth
 * package extends.
 *
 * The pack step rewrites `exports` from what it built, so a file it did not build is dropped
 * from the map unless it is named. A package config replaces the root's `pack` block whole,
 * which is why this calls the same builder rather than adding to it.
 */
export default defineConfig({
  pack: packConfig({
    sourceCondition: 'tooling-source',
    staticExports: {
      './tsconfig/base.json': './tsconfig/base.json',
      './tsconfig/react.json': './tsconfig/react.json',
    },
  }),
})
