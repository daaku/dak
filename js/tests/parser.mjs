import { tokens } from '../src/parser.mjs'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

test('tokens', () => {
  assert.equal(
    [...tokens('(+ 1 42)')],
    [
      {
        kind: '(',
        offset: 0,
        line: 0,
        column: 0,
      },
      {
        kind: 'symbol',
        value: '+',
        offset: 1,
        line: 0,
        column: 1,
      },
      {
        kind: 'symbol',
        value: '1',
        offset: 3,
        line: 0,
        column: 2,
      },
      {
        kind: 'symbol',
        value: '42',
        offset: 5,
        line: 0,
        column: 3,
      },
      {
        kind: ')',
        offset: 7,
        line: 0,
        column: 3,
      },
    ],
  )
})

test.run()
