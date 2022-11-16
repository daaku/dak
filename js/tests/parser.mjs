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
    'builtin: import',
    `
    (import ["./a.js" [A B c-d]]
            ["./b/c.js" [E]])
    `,
    `import {A,B,c-d,} from "./a.js";import {E,} from "./b/c.js";`,
  ],
  ['builtin: def', '(def a 42)', 'let a=42;'],
  [
    'builtin: fn',
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
    'builtin: let',
    `(fn run []
      (let [a 0
            b (inc a)]
        (console.log a)
        b))
    `,
    `const run=()=>{{let a;a=0;let b;b=inc(a,);console.log(a,);return b;};}`,
  ],
  ['builtin: throw', '(throw (error "foo"))', 'throw error("foo",);'],
  [
    'builtin: for with step',
    `
    (for [i 0 len step]
      (console.log i))
    `,
    `for(let i=0;i<len;i+=step){console.log(i,);}`,
  ],
  [
    'builtin: for without step',
    `
    (for [i 0 len]
      (console.log i))
    `,
    `for(let i=0;i<len;i++){console.log(i,);}`,
  ],
  [
    'builtin: case return position',
    `
    (fn run []
      (case (inc 1)
      "foo" :bar
      "baz" :boo
      :otherwise))
    `,
    `const run=()=>{switch (inc(1,)){case "foo":return "bar";case "baz":return "boo";default:return "otherwise";};}`,
  ],
  [
    'builtin: case assign',
    `
    (fn run []
      (let [v (case (inc 1)
                "foo" :bar
                "baz" :boo
                :otherwise)]
        v))
    `,
    `const run=()=>{{let v;switch (inc(1,)){case "foo":v="bar";break;case "baz":v="boo";break;default:v="otherwise";break};return v;};}`,
  ],
  [
    'builtin: do',
    `
    (do
      (add 1 1)
      42)
    `,
    `add(1,1,);42;`,
  ],
  // [
  //   'compound: read-string',
  //   `(fn read-string [input len start]
  //     (let [lines 0]
  //       (for [end start len]
  //         (case (. input end)
  //           "a" (return [(input.substring start end) (inc end) lines])
  //           "b" (set! lines (inc lines)))))
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
