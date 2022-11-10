import { tokens, transpile } from '../src/parser.mjs'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

const tostr = code => {
  const pieces = []
  try {
    for (let p of transpile(code)) {
      pieces.push(p)
    }
  } catch (e) {
    console.log([...tokens(code)])
    console.error(pieces.join(''))
    throw e
  }
  return pieces.join('')
}

test('transpile', () => {
  assert.equal(
    tostr('{:a 1 :b [1 2] :c [3 4]}'),
    '{["a"]:1,["b"]:[1,2,],["c"]:[3,4,],}',
  )
  assert.equal(tostr('[[1 2 3] [4 5 6]]'), '[[1,2,3,],[4,5,6,],]')
  assert.equal(tostr('(a {:b c})'), 'a({["b"]:c,},)')
  assert.equal(tostr('(.a b {:c d})'), 'b.a({["c"]:d,},)')
  assert.equal(
    tostr(`
    (import ["./a.js" [A B c-d]]
            ["./b/c.js" [E]])
    `),
    `import {A,B,c-d,} from "./a.js";import {E,} from "./b/c.js";`,
  )
})

test.run()
