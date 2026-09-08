import { describe, expect, it } from 'vite-plus/test'

import { safeParse } from './parse.ts'
import {
  BLOCKED_URL,
  isNavigableUrl,
  link,
  NAVIGABLE_SCHEMES,
  navigableOrBlocked,
  navigableUrl,
} from './urls.ts'

describe('isNavigableUrl', () => {
  it('accepts an absolute URL on a scheme the browser navigates to', () => {
    expect(isNavigableUrl('https://stealthscale.io/docs')).toBe(true)
    expect(isNavigableUrl('http://localhost:4200/')).toBe(true)
    expect(isNavigableUrl('//stealthscale.io/docs')).toBe(true)
  })

  it('accepts a path, a fragment and a query within the application', () => {
    expect(isNavigableUrl('/account')).toBe(true)
    expect(isNavigableUrl('account/1')).toBe(true)
    expect(isNavigableUrl('#top')).toBe(true)
    expect(isNavigableUrl('?page=2')).toBe(true)
  })

  it('accepts the two schemes that open a program rather than a page', () => {
    expect(isNavigableUrl('mailto:hello@stealthscale.io')).toBe(true)
    expect(isNavigableUrl('tel:+31201234567')).toBe(true)
  })

  it('refuses a script, however the scheme is spelled or padded', () => {
    expect(isNavigableUrl('javascript:alert(1)')).toBe(false)
    expect(isNavigableUrl('java\tscript:alert(1)')).toBe(false)
    expect(isNavigableUrl('  JAVASCRIPT:alert(1)')).toBe(false)
    expect(isNavigableUrl('vbscript:msgbox(1)')).toBe(false)
  })

  it('refuses a scheme that carries content or reaches the disk', () => {
    expect(isNavigableUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    expect(isNavigableUrl('file:///etc/passwd')).toBe(false)
  })

  it('refuses a blank string and one the parser cannot read', () => {
    expect(isNavigableUrl('')).toBe(false)
    expect(isNavigableUrl('   ')).toBe(false)
    expect(isNavigableUrl('http://[not-an-address')).toBe(false)
  })

  it('lists the four schemes, with the colon the URL parser reports', () => {
    expect([...NAVIGABLE_SCHEMES]).toEqual(['http:', 'https:', 'mailto:', 'tel:'])
  })
})

describe('navigableOrBlocked', () => {
  it('returns the link when a person may follow it', () => {
    expect(navigableOrBlocked('https://stealthscale.io/')).toBe('https://stealthscale.io/')
  })

  it('returns the blocked href for a script and for no link at all', () => {
    expect(navigableOrBlocked('javascript:alert(1)')).toBe(BLOCKED_URL)
    expect(navigableOrBlocked()).toBe(BLOCKED_URL)
    expect(BLOCKED_URL).toBe('')
  })
})

describe('navigableUrl', () => {
  it('is a validation action that reports a code and no words', () => {
    const action = navigableUrl()

    expect(action.kind).toBe('validation')
    expect(action.type).toBe('navigable_url')
    expect(action.message).toBeUndefined()
    expect(action.reference).toBe(navigableUrl)
    expect(action.requirement).toBe(isNavigableUrl)
  })
})

describe('link', () => {
  it('accepts a link a person may follow', () => {
    expect(safeParse(link(), '/account')).toEqual({ ok: true, value: '/account' })
  })

  it('refuses a script with navigable_url, and the refused string as its only scalar', () => {
    const result = safeParse(link(), 'javascript:alert(1)')

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.failure).toEqual([
      {
        code: 'navigable_url',
        params: { received: '"javascript:alert(1)"' },
        path: '',
        reason: 'Invalid navigable URL: Received "javascript:alert(1)"',
      },
    ])
  })

  it('refuses a value that is not a string with that code alone, and adds nothing of its own', () => {
    const result = safeParse(link(), 42)

    expect(result.ok ? [] : result.failure.map((issue) => issue.code)).toEqual(['string'])
  })
})
