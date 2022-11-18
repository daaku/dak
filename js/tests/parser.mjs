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
    //console.log([...tokens(code)])
    console.error(pieces.join(''))
    throw e
  }
  return pieces.join('')
}

const cases = [
  ['string escape', '"\\t"', '"\\t"'],
  ['string with escaped newline', '"\\\n"', '"\\\n"'],
  ['string with unescaped newline', '"hello\nworld"', '"hello\\\nworld"'],
  ['symbol: dash special case', 'foo-bar', 'fooBar'],
  ['symbol: bang', 'foo!', 'foo_BANG_'],
  ['symbol: qmark', 'foo?', 'foo_QMARK_'],
  ['symbol: star', 'foo*', 'foo_STAR_'],
  ['symbol: plus', 'foo+', 'foo_PLUS_'],
  ['symbol: gt', '>', '_GT_'],
  ['symbol: lt', '<', '_LT_'],
  ['symbol: eq', '=', '_EQ_'],
  ['plain keyword', ':foo', '"foo"'],
  [
    'data structures',
    '{:a 1 :b [1 2] :c [3 4]}',
    '{["a"]:1,["b"]:[1,2,],["c"]:[3,4,],}',
  ],
  ['nested arrays', '[[1 2 3] [4 5 6]]', '[[1,2,3,],[4,5,6,],]'],
  ['function call', '(a {:b c})', 'a({["b"]:c,},)'],
  ['method call', '(.a b {:c d})', 'b.a({["c"]:d,},)'],
  ['constructor call', '(String. 42)', 'new String(42,)'],
  [
    'comments',
    `
    ; this is the truth
    "use strict" ; really sure
    `,
    `"use strict"`,
  ],
  [
    'builtin: import',
    `
    (import ["./a.js" [A B c-d]]
            ["./b/c.js" [E]])
    `,
    `import {A,B,cD,} from "./a.js";import {E,} from "./b/c.js";`,
  ],
  ['builtin: def', '(def a 42)', 'let a=42;'],
  [
    'builtin: def with hoist',
    `
    (def a (case v
             42 :answer
             43 :not))
  `,
    'let gensym__0;switch (v){case 42:gensym__0="answer";break;case 43:gensym__0="not";break;}let a=gensym__0;',
  ],
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
  [
    'builtin: let with destructuring',
    `(fn run []
      (let [{:keys [a b]} (foo)]
        [a b]))
    `,
    `const run=()=>{{let gensym__0;gensym__0=foo();let {a,b}=gensym__0;return [a,b,];};}`,
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
  [
    'builtin: if hoisted',
    `
    (def a (if true 42 43))`,
    'let gensym__0;if(true){gensym__0=42}else{gensym__0=43}let a=gensym__0;',
  ],
  [
    'builtin: if without else',
    `
    (fn run [] (if true 42))`,
    'const run=()=>{if(true){return 42};}',
  ],
  [
    'builtin: if and else if',
    `
    (fn run [a b] (if a 42 b 43))`,
    'const run=(a,b,)=>{if(a){return 42}else if(b){return 43};}',
  ],
  [
    'builtin: if return',
    `
    (fn run [] (if true 42 43))`,
    'const run=()=>{if(true){return 42}else{return 43};}',
  ],
  [
    'builtin: if let',
    `
    (.foo (let [a (if true 42 43)] a) :bar)`,
    'let gensym__0;{let a;if(true){a=42}else{a=43};gensym__0=a;}gensym__0.foo("bar",)',
  ],
  [
    'builtin: double if hoisting',
    `
    (.foo (if (if true 40 41) 42 43) :bar)`,
    'let gensym__1;if(true){gensym__1=40}else{gensym__1=41}let gensym__0;if(gensym__1){gensym__0=42}else{gensym__0=43}gensym__0.foo("bar",)',
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
