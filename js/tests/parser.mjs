import { tokens, transpile } from '../src/parser.mjs'
import { test } from 'uvu'
import * as assert from 'uvu/assert'

const tostr = (code, log) => {
  const pieces = []
  try {
    for (const p of transpile(code)) {
      pieces.push(p)
    }
  } catch (e) {
    //console.log([...tokens({}, code)])
    if (log) {
      console.error(pieces.join(''))
    }
    throw e
  }
  return pieces.join('')
}

const cases = [
  ['string escape', '"\\t"', '"\\t"'],
  ['string with escaped newline', '"\\\n"', '"\\\n"'],
  ['string with unescaped newline', '"hello\nworld"', '"hello\\\nworld"'],
  ['symbol: dash special case', 'foo-bar', 'fooBar'],
  ['symbol: dash special case 2x', 'foo-bar-baz', 'fooBarBaz'],
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
  ['function call', '(a {:b c})', 'a({["b"]:c,})'],
  ['method call', '(.a b {:c d})', 'b.a({["c"]:d,})'],
  ['constructor call', '(String. 42)', 'new String(42)'],
  [
    'value call',
    '(fn run [a] ((. Array :isArray) a))',
    `const run=(a)=>{return (Array["isArray"])(a);};`,
  ],
  ['multiple: list', '(add 1)(add 2)', 'add(1)add(2)'],
  [
    'call nested hoisted',
    '(do (String. (Number. (if true 42 43))))',
    'let gensym__0;if(true){gensym__0=42}else{gensym__0=43}new String(new Number(gensym__0));',
  ],
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
    (import ["./named.js" [A B c-d]]
            ["./default.js" TheDefault :rename {A MyA D MyD} [E F]]
            ["./index.css"]
            ["./as.js" :as TheNamed])
    `,
    `import {A,B,cD} from "./named.js";import TheDefault,{A as MyA,D as MyD,E,F} from "./default.js";import "./index.css";import * as TheNamed from "./as.js";`,
  ],
  ['builtin: const', '(const a 42)', 'const a=42;'],
  [
    'builtin: const with hoist',
    `
    (const a (case v
                42 :answer
                43 :not))
  `,
    'let gensym__0;switch (v){case 42:gensym__0="answer";break;case 43:gensym__0="not";break;}const a=gensym__0;',
  ],
  ['builtin: var', '(var a 42)', 'var a=42;'],
  ['builtin: let', '(let a 42)', 'let a=42;'],
  [
    'builtin: fn',
    `
    (fn err [expected offset]
      (str "expected " expected " at position " offset))
    `,
    `const err=(expected,offset)=>{return "expected "+expected+" at position "+offset;};`,
  ],
  [
    'fn with array destructuring',
    `
    (fn first [[first second] other]
      first)
    `,
    `const first=([first,second,],other)=>{return first;};`,
  ],
  [
    'fn with object destructuring',
    `(fn run [{x :y :keys [b c] :or {a 1 b 2 d 3}}]
      a)
    `,
    `const run=({y:x,b=2,c,a=1,d=3})=>{return a;};`,
  ],
  [
    'fn with rest',
    `(fn run [a ...rest]
       (a ...rest))
    `,
    `const run=(a,...rest)=>{return a(...rest);};`,
  ],
  [
    'builtin: fn@',
    `
    (fn@ run [v]
      @(v 42))
    `,
    `const run=async(v)=>{return await (v(42));};`,
  ],
  [
    'builtin: fn*',
    `
    (fn* run [v]
      (yield v))
    `,
    `const run=function*(v){yield v;;};`,
  ],
  [
    'builtin: fn@*',
    `
    (fn@* run [v]
      (yield v))
    `,
    `const run=async function*(v){yield v;;};`,
  ],
  [
    'builtin: anonymous fn',
    `
    (fn [v]
      (v 42))
    `,
    `(v)=>{return v(42);};`,
  ],
  [
    'builtin: anonymous fn@',
    `
    (fn@ [v]
      @(v 42))
    `,
    `async(v)=>{return await (v(42));};`,
  ],
  [
    'builtin: anonymous fn*',
    `
    (fn* [v]
      (yield v))
    `,
    `function*(v){yield v;;};`,
  ],
  [
    'builtin: anonymous fn@*',
    `
    (fn@* [v]
      (yield v))
    `,
    `async function*(v){yield v;;};`,
  ],
  [
    'builtin: let',
    `(fn run []
      (let [a 0
            b (inc a)]
        (console.log a)
        b))
    `,
    `const run=()=>{{let a;a=0;let b;b=inc(a);console.log(a);return b;};};`,
  ],
  [
    'builtin: let without assign',
    `(fn run []
      (let [a 0
            b (inc a)]
        (console.log a)
        b)
       null)
    `,
    `const run=()=>{let gensym__0;{let a;a=0;let b;b=inc(a);console.log(a);gensym__0=b;}gensym__0;return null;};`,
  ],
  [
    'builtin: let as arg',
    `
    (fn run [a] a)
    (do (run (let [a 0
                   b (inc a)]
               (+ a b))))
    `,
    `const run=(a)=>{return a;};let gensym__0;{let a;a=0;let b;b=inc(a);gensym__0=a+b;}run(gensym__0);`,
  ],
  [
    'builtin: let with destructuring',
    `(fn run []
      (let [{:keys [a b]} (foo)]
        [a b]))
    `,
    `const run=()=>{{let gensym__0;gensym__0=foo();let {a,b}=gensym__0;return [a,b,];};};`,
  ],
  ['builtin: throw', '(throw (error "foo"))', 'throw error("foo");'],
  ['builtin: return with value', '(return 42)', 'return 42;'],
  ['builtin: return bare', '(return)', 'return;'],
  [
    'builtin: return hoist',
    `(fn run []
      (return (if true 42)))
    `,
    `const run=()=>{let gensym__0;if(true){gensym__0=42}return gensym__0;;};`,
  ],
  ['builtin: yield', '(yield)', 'yield;'],
  ['builtin: yield*', '(yield* [1 2])', 'yield* [1,2,];'],
  ['builtin: break', '(break)', 'break;'],
  ['builtin: continue', '(continue)', 'continue;'],
  [
    'builtin: for with step',
    `
    (for [i 0 len step]
      (console.log i))
    `,
    `for(let i=0;i<len;i+=step){console.log(i);}`,
  ],
  [
    'builtin: for without step',
    `
    (for [i 0 len]
      (console.log i))
    `,
    `for(let i=0;i<len;i++){console.log(i);}`,
  ],
  [
    'builtin: for-of',
    `
    (for-of [v vs]
      (console.log v))
    `,
    `for(let v of vs){console.log(v);}`,
  ],
  [
    'builtin: for-in',
    `
    (for-in [v vs]
      (console.log v))
    `,
    `for(let v in vs){console.log(v);}`,
  ],
  [
    'builtin: for@',
    `
    (for@ [v vs]
      (console.log v))
    `,
    `for await(let v of vs){console.log(v);}`,
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
    `const run=()=>{switch (inc(1)){case "foo":return "bar";case "baz":return "boo";default:return "otherwise";};};`,
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
    `const run=()=>{{let v;switch (inc(1)){case "foo":v="bar";break;case "baz":v="boo";break;default:v="otherwise";break};return v;};};`,
  ],
  [
    'builtin: do',
    `
    (do
      (add 1 1)
      42)
    `,
    `add(1,1);42;`,
  ],
  [
    'builtin: if hoisted',
    `
    (const a (if true 42 43))`,
    'let gensym__0;if(true){gensym__0=42}else{gensym__0=43}const a=gensym__0;',
  ],
  [
    'builtin: if without else',
    `
    (fn run [] (if true 42))`,
    'const run=()=>{if(true){return 42};};',
  ],
  [
    'builtin: if and else if',
    `
    (fn run [a b] (if a 42 b 43))`,
    'const run=(a,b)=>{if(a){return 42}else if(b){return 43};};',
  ],
  [
    'builtin: if return',
    `
    (fn run [] (if true 42 43))`,
    'const run=()=>{if(true){return 42}else{return 43};};',
  ],
  [
    'builtin: if let',
    `
    (.foo (let [a (if true 42 43)] a) :bar)`,
    'let gensym__0;{let a;if(true){a=42}else{a=43};gensym__0=a;}gensym__0.foo("bar")',
  ],
  [
    'builtin: double if hoisting',
    `
    (do (.foo (if (if true 40 41) 42 43) :bar))`,
    'let gensym__1;if(true){gensym__1=40}else{gensym__1=41}let gensym__0;if(gensym__1){gensym__0=42}else{gensym__0=43}gensym__0.foo("bar");',
  ],
  ['builtin: dot', '(. foo bar)', 'foo[bar]'],
  ['builtin: dot double', '(. foo bar baz)', 'foo[bar][baz]'],
  [
    'builtin: dot hoist',
    `(fn run []
      (. foo (if true 42)))
    `,
    `const run=()=>{let gensym__0;if(true){gensym__0=42}return foo[gensym__0];};`,
  ],
  ['builtin: await', `@42`, `await (42)`],
  ['builtin: await method call', `@(make :promise)`, `await (make("promise"))`],
  ['builtin: op str', '(str :a :b :c)', '"a"+"b"+"c"'],
  ['builtin: op +', '(+ 1 2 3)', '1+2+3'],
  ['builtin: op + unary', '(+ 1)', '+1'],
  ['builtin: op -', '(- 1 2 3)', '1-2-3'],
  ['builtin: op - unary', '(- 1)', '-1'],
  ['builtin: op *', '(* 1 2 3)', '1*2*3'],
  ['builtin: op /', '(/ 1 2 3)', '1/2/3'],
  ['builtin: op **', '(** 1 2 3)', '1**2**3'],
  ['builtin: op %', '(% 1 2 3)', '1%2%3'],
  [
    'lambda',
    `#([(if $ true false) $2])`,
    `(gensym__0,gensym__1)=>{let gensym__2;if(gensym__0){gensym__2=true}else{gensym__2=false}return [gensym__2,gensym__1,]}`,
  ],
  ['builtin: typeof', '(typeof 1)', 'typeof 1'],
  ['builtin: set!', '(set! a 1)', 'a=1'],
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
    assert.equal(tostr(input, true), output)
  })
})

const errorCases = [
  ['lone paren', '(', '<anonymous>:1:1: unterminated list'],
  ['unterminated string', '(foo "', '<anonymous>:1:6: unterminated string'],
  ['keyword symbol', '(foo :', '<anonymous>:1:6: input ended, wanted "symbol"'],
  ['unterminated map', '{', '<anonymous>:1:1: unterminated map'],
  ['unterminated array', '[', '<anonymous>:1:1: unterminated array'],
  ['unterminated list', '(do ', '<anonymous>:1:2: unterminated list'],
  [
    'destructure unexpected',
    '(let [:foo] ',
    '<anonymous>:1:7: unexpected destructure ":"',
  ],
  [
    'destructure unterminated',
    '(let [[ ',
    '<anonymous>:1:7: unterminated destructure',
  ],
  [
    'destructure map',
    '(let [{(',
    '<anonymous>:1:8: unexpected destructure map "("',
  ],
  [
    'destructure map op',
    '(let [{:foo',
    '<anonymous>:1:9: unexpected destructuring map op "foo"',
  ],
  [
    'destructure unexpected keys',
    '(let [{:keys [:foo',
    '<anonymous>:1:15: unexpected destructure :keys ":"',
  ],
  [
    'destructure unexpected or',
    '(let [{:or [',
    '<anonymous>:1:12: unexpected "[" wanted "{"',
  ],
  [
    'destructure unexpected or item',
    '(let [{:or {:',
    '<anonymous>:1:13: unexpected destructure :or ":"',
  ],
  [
    'op: not unary operator',
    '(* 1)',
    '<anonymous>:1:5: "*" is not a unary operator',
  ],
  ['op: unterminated list', '(+', '<anonymous>:1:2: unterminated list'],
  [
    'keyword expr: unterminated return',
    '(return',
    '<anonymous>:1:2: unterminated return',
  ],
  ['unterminated for', '(for [a b', '<anonymous>:1:9: unterminated for'],
  [
    'unterminated for list',
    '(for [a b c]',
    '<anonymous>:1:12: unterminated list',
  ],
  ['unterminated if', '(if', '<anonymous>:1:2: unterminated if'],
  ['unterminated if', '(if :foo', '<anonymous>:1:6: unterminated if'],
  ['unterminated case', '(case :foo', '<anonymous>:1:8: unterminated case'],
  [
    'unterminated case expr',
    '(case :foo :bar',
    '<anonymous>:1:13: unterminated case',
  ],
  ['unterminated "."', '(.', '<anonymous>:1:2: unterminated "."'],
  ['unterminated list', '(foo', '<anonymous>:1:2: unterminated list'],
  ['unterminated import', '(import', '<anonymous>:1:2: unterminated import'],
  [
    'import unexpected token ',
    '(import :',
    '<anonymous>:1:9: unexpected ":", wanted "["',
  ],
  [
    'import unterminated',
    '(import ["a"',
    '<anonymous>:1:10: unterminated import',
  ],
  [
    'import unexpected',
    '(import ["a" @',
    '<anonymous>:1:14: unexpected import',
  ],
  [
    'import unexpected name',
    '(import ["a" [@',
    '<anonymous>:1:15: unexpected import name "@"',
  ],
  [
    'import unterminated import name list',
    '(import ["a" [',
    '<anonymous>:1:14: unterminated import name list',
  ],
  [
    'import unexpected op',
    '(import ["a" :f',
    '<anonymous>:1:15: unexpected import op "f"',
  ],
  [
    'import unterminated rename',
    '(import ["a" :rename {',
    '<anonymous>:1:22: unterminated import rename',
  ],
  ['unterminated hash', '#', '<anonymous>:1:1: unterminated "#"'],
  ['hash: unexpected {', '#{', '<anonymous>:1:2: unexpected "{" after "#"'],
  [
    'unterminated function arguments',
    '(fn run [a',
    '<anonymous>:1:10: unterminated function arguments',
  ],
  ['unterminated function', '(fn', '<anonymous>:1:2: unterminated function'],
  ['unterminated function', '(fn (', '<anonymous>:1:5: unexpected "("'],
  [
    'unterminated for list',
    '(for-of [a b]',
    '<anonymous>:1:13: unterminated list',
  ],
  ['unterminated let', '(let', '<anonymous>:1:2: unterminated let'],
  ['call unexpected', '([', '<anonymous>:1:2: unexpected "["'],
]

errorCases.forEach(([name, input, msg]) => {
  test(`error case: ${name}`, () => {
    let output
    try {
      output = tostr(input, false)
    } catch (err) {
      assert.equal(err.message, msg)
      return
    }
    throw Error(
      `was expecting error: "${msg}"
INPUT:
${input}
OUTPUT:
${output}`,
    )
  })
})

test.run()
