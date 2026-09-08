#!/usr/bin/env node
/**
 * @fileoverview The `stealth` bin. It hands the command to citty and does nothing else, so
 * everything worth a specification lives beside it rather than in an entry a build rewrites.
 */

import { runMain } from 'citty'

import { stealth } from '#cli.ts'

await runMain(stealth)
