/**
 * @fileoverview The toolchain configuration, which is this package's primary job and so what
 * the main entry carries. The other domains — the guards, and the taxonomy derived from the
 * tree — are subpath entries of their own, because a root config loads one and a spec loads
 * the other.
 */

export * from './vite/index.ts'
