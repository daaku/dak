import { tokens, transpile } from '../src/parser.mjs'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

test('transpile', () => {
  assert.equal([...transpile('{:a 1}')].join(''), '{["a"]:1,}')
})

test.run()
