import { describe, expect, it } from 'vite-plus/test'

import { fixture, many, SEED } from '#fixtures.ts'

/** A person, as a specification or a story would want one. */
interface Person {
  email: string
  name: string
  role: string
}

/** A person fixture, built from the seeded source. */
const person = fixture<Person>((source) => ({
  email: source.internet.email(),
  name: source.person.fullName(),
  role: 'Reviewer',
}))

describe('fixture', () => {
  it('answers the same value every run, so a snapshot means what it says', () => {
    expect(person()).toEqual(person())
    expect(person().name).toBe(person(undefined, { index: 0 }).name)
  })

  it('lets a caller state the fields the case is about, and builds the rest', () => {
    const named = person({ name: 'Noor Haddad' })

    expect(named.name).toBe('Noor Haddad')
    expect(named.email, 'what the case does not state is still filled in').toBe(person().email)
  })

  it('answers a different value at a different position', () => {
    expect(person(undefined, { index: 1 })).not.toEqual(person(undefined, { index: 0 }))
  })

  it('tells the build where in the series it is', () => {
    const counted = fixture<{ index: number }>((_source, index) => ({ index }))

    expect(counted(undefined, { index: 7 }).index).toBe(7)
  })

  it('builds another fixture without disturbing the value it is part of', () => {
    const team = fixture<{ lead: Person; name: string }>((source) => ({
      lead: person(),
      name: source.company.name(),
    }))

    expect(team().lead).toEqual(person())
    expect(team().name, 'the outer source carried on where it was').toBe(team().name)
  })
})

describe('locale', () => {
  it('draws from the locale that was asked for', () => {
    const dutch = person(undefined, { locale: 'nl' })

    expect(dutch.name, 'a different corpus gives a different name').not.toBe(person().name)
    expect(dutch, 'the same locale answers the same person').toEqual(
      person(undefined, { locale: 'nl' }),
    )
  })

  it('reaches the nearest locale the sample data ships', () => {
    expect(person(undefined, { locale: 'nl-NL' })).toEqual(person(undefined, { locale: 'nl' }))
  })

  it('gives every value in a series the same locale', () => {
    const dutch = many(person, 2, {}, 'nl')

    expect(dutch).toEqual([
      person(undefined, { index: 0, locale: 'nl' }),
      person(undefined, { index: 1, locale: 'nl' }),
    ])
  })
})

describe('many', () => {
  it('makes a series that differs within itself and repeats across runs', () => {
    const people = many(person, 3)

    expect(people).toHaveLength(3)
    expect(new Set(people.map((one) => one.email)).size, 'each from its own position').toBe(3)
    expect(many(person, 3)).toEqual(people)
  })

  it('gives every value in the series the fields the caller states', () => {
    expect(many(person, 2, { role: 'Admin' }).map((one) => one.role)).toEqual(['Admin', 'Admin'])
  })

  it('makes nothing when asked for nothing', () => {
    expect(many(person, 0)).toEqual([])
  })
})

describe('SEED', () => {
  it('is fixed, because changing it rewrites every fixture everywhere', () => {
    expect(SEED).toBe(20_260_908)
  })
})
