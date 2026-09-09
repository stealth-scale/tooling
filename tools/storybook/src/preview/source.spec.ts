import { describe, expect, it } from 'vite-plus/test'

import { sourceOf } from './source.ts'

/** A story object as Storybook prints one, with a render arrow that returns an element. */
const ARROW = [
  '{',
  '  args: {',
  "    tone: 'quiet'",
  '  },',
  '  render: (args) => (',
  '    <Button {...args}>',
  "      Save shadcn's demo",
  '    </Button>',
  '  ),',
  '  play: async ({ canvas }) => {',
  "    await canvas.findByRole('button')",
  '  }',
  '}',
].join('\n')

/** A story whose render holds state, which its markup alone does not explain. */
const FUNCTION = [
  '{',
  '  render: function Controlled(args) {',
  '    const [open, setOpen] = useState(false)',
  '    return <Sheet open={open} onOpenChange={setOpen} {...args} />',
  '  }',
  '}',
].join('\n')

describe('sourceOf', () => {
  it('shows the element a render arrow returns, and nothing else of the story', () => {
    expect(sourceOf(ARROW)).toBe(
      ['<Button {...args}>', "  Save shadcn's demo", '</Button>'].join('\n'),
    )
  })

  it('keeps a render function whole, because its state is part of the example', () => {
    expect(sourceOf(FUNCTION)).toBe(
      [
        'function Controlled(args) {',
        '  const [open, setOpen] = useState(false)',
        '  return <Sheet open={open} onOpenChange={setOpen} {...args} />',
        '}',
      ].join('\n'),
    )
  })

  it('keeps a blank line inside the markup, and lets it say nothing about the indent', () => {
    const spaced = [
      '{',
      '  render: () => (',
      '    <List>',
      '',
      '      <Item />',
      '    </List>',
      '  ),',
      '}',
    ]

    expect(sourceOf(spaced.join('\n'))).toBe(['<List>', '', '  <Item />', '</List>'].join('\n'))
  })

  it('unwraps an arrow returning an element without parentheses', () => {
    expect(sourceOf('{\n  render: () => <Badge />,\n}')).toBe('<Badge />')
  })

  it('unwraps an arrow that states its return type, which every story is asked for', () => {
    expect(sourceOf('{\n  render: (): ReactElement => <Badge />,\n}')).toBe('<Badge />')
    expect(sourceOf('{\n  render: (args): JSX.Element => <Badge />,\n}')).toBe('<Badge />')
  })

  it('keeps an arrow whose body is a block', () => {
    expect(sourceOf('{\n  render: () => {\n    return <Badge />\n  }\n}')).toBe(
      '() => {\n  return <Badge />\n}',
    )
  })

  it('leaves a story with no render as Storybook printed it', () => {
    const printed = '<Button tone="quiet">Save</Button>'

    expect(sourceOf(printed)).toBe(printed)
  })

  it('stops at the next top-level property, whatever nests inside the render', () => {
    const nested = [
      '{',
      '  render: (args) => (',
      '    <List>',
      "      {['a', 'b'].map((item) => <Item key={item} />)}",
      '    </List>',
      '  ),',
      '  tags: [],',
      '}',
    ].join('\n')

    expect(sourceOf(nested)).toBe(
      ['<List>', "  {['a', 'b'].map((item) => <Item key={item} />)}", '</List>'].join('\n'),
    )
  })
})
