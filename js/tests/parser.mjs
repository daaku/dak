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
  ['plain keyword', ':foo', '"foo"'],
  [
    'data structures',
    '{:a 1 :b [1 2] :c [3 4]}',
    '{["a"]:1,["b"]:[1,2,],["c"]:[3,4,],}',
  ],
  ['nested arrays', '[[1 2 3] [4 5 6]]', '[[1,2,3,],[4,5,6,],]'],
  ['function call', '(a {:b c})', 'a({["b"]:c,},)'],
  ['method call', '(.a b {:c d})', 'b.a({["c"]:d,},)'],
  [
    'special: import',
    `
    (import ["./a.js" [A B c-d]]
            ["./b/c.js" [E]])
    `,
    `import {A,B,c-d,} from "./a.js";import {E,} from "./b/c.js";`,
  ],
  ['special: def', '(def a 42)', 'let a=42;'],
  [
    'special: fn',
    `
    (fn err [expected offset]
      (str "expected " expected " at position " offset))
    `,
    `const err=(expected,offset,)=>{return "expected "+expected+" at position "+offset;}`,
  ],
  [
    'fn with array destructuring',
    `
    (fn first [[first second] other]
      first)
    `,
    `const first=([first,second,],other,)=>{return first;}`,
  ],
  [
    'fn with object destructuring',
    `(fn run [{x :y :keys [b c] :or {a 1 b 2 d 3}}]
      a)
    `,
    `const run=({y:x,b=2,c,a=1,d=3},)=>{return a;}`,
  ],
  [
    'special: let',
    `(fn run []
      (let [a 0
            b (inc a)]
        (console.log a)
        b))
    `,
    `const run=()=>{return (() => {let a=0,b=inc(a,);console.log(a,);return b;})();}`,
  ],
  ['special: throw', '(throw (error "foo"))', 'throw error("foo",);'],
  [
    'special: for',
    `
    (for [i 0 len step]
      (console.log i))
    `,
    `for(let i=0;i<len;i+=step){console.log(i,);}`,
  ],
  [
    'special: case',
    `
    (case (inc 1)
      "foo" :bar
      "baz" :boo
      :otherwise)
    `,
    `switch (inc(1,)){case "foo":"bar";break;case "baz":"boo";break;default:"otherwise";break}`,
  ],
  // [
  //   'compound: read-string',
  //   `(fn read-string [input len start]
  //     (let [lines 0]
  //       (for [end start len]
  //         (case (. input end)
  //           "\"" (return [(input.substring start end) (inc end) lines])
  //           "\n" (set! lines (inc lines)))))
  //     (throw (Error. "unterminated string")))
  //   `,
  //   ``,
  // ],
]

cases.forEach(([name, input, output]) => {
  test(name, () => {
    assert.equal(tostr(input), output)
  })
})

test.run()
