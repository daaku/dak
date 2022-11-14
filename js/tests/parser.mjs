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

const cases = [
  [':foo', '"foo"'],
  ['{:a 1 :b [1 2] :c [3 4]}', '{["a"]:1,["b"]:[1,2,],["c"]:[3,4,],}'],
  ['[[1 2 3] [4 5 6]]', '[[1,2,3,],[4,5,6,],]'],
  ['(a {:b c})', 'a({["b"]:c,},)'],
  ['(.a b {:c d})', 'b.a({["c"]:d,},)'],
  [
    `
    (import ["./a.js" [A B c-d]]
            ["./b/c.js" [E]])
    `,
    `import {A,B,c-d,} from "./a.js";import {E,} from "./b/c.js";`,
  ],
  ['(def a 42)', 'let a=42;'],
  [
    `
    (fn err [expected offset]
      (str "expected " expected " at position " offset))
    `,
    `const err=(expected,offset,)=>{return "expected "+expected+" at position "+offset;}`,
  ],
  [
    `
    (fn first [[first second] other]
      first)
    `,
    `const first=([first,second,],other,)=>{return first;}`,
  ],
  [
    `
    (fn run [{x :y :keys [b c] :or {a 1 b 2 d 3}}]
      a)
    `,
    `const run=({y:x,b=2,c,a=1,d=3},)=>{return a;}`,
  ],
  [
    `
    (fn run []
      (let [a 0
            b (inc a)]
        (console.log a)
        b))
    `,
    `const run=()=>{return (() => {let a=0,b=inc(a,);console.log(a,);return b;})();}`,
  ],
  ['(throw (error "foo"))', 'throw error("foo",);'],
  [
    `
    (for [i 0 len step]
      (console.log i))
    `,
    `for(let i=0;i<len;i+=step){console.log(i,);}`,
  ],
  [
    `
    (case (inc 1)
      "foo" :bar
      "baz" :boo
      :otherwise)
    `,
    `switch (inc(1,)){case "foo":"bar";break;case "baz":"boo";break;default:"otherwise";break}`,
  ],
]

test('transpile', () => {
  cases.forEach(([input, output]) => {
    assert.equal(tostr(input), output)
  })
})

test.run()
