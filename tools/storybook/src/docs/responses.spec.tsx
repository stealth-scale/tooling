import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it } from 'vite-plus/test'

import { Responses } from './responses.tsx'

describe('Responses', () => {
  it('draws the two classes beside a control that opts into neither', () => {
    const { container } = render(<Responses />)
    const controls = [...container.querySelectorAll('[data-slot="response"]')]

    expect(controls.map((control) => control.textContent)).toEqual([
      'no class',
      'motion-state',
      'motion-press',
    ])
    // The one carrying no class is what the other two are read against.
    expect(controls.map((control) => control.className)).toEqual([
      '',
      'motion-state',
      'motion-press',
    ])
  })

  it('changes the fill under a pointer, which is what the class either eases or does not', () => {
    const { container } = render(<Responses />)
    const [control] = [...container.querySelectorAll('[data-slot="response"]')]

    expect(control?.getAttribute('style')).toContain('var(--secondary)')

    fireEvent.pointerEnter(control as Element)
    expect(control?.getAttribute('style')).toContain('var(--accent)')

    fireEvent.pointerLeave(control as Element)
    expect(control?.getAttribute('style')).toContain('var(--secondary)')
  })

  it('says what each one shows, since a transition cannot be read off a class name', () => {
    const { container } = render(<Responses />)
    const notes = [...container.querySelectorAll('span')].map((note) => note.textContent)

    expect(notes[0]).toContain('arrives with the pointer')
    expect(notes[1]).toContain('crosses')
    expect(notes[2]).toContain('held down')
  })
})
