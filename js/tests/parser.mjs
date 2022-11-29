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

test('string escape', () => {
  assert.equal(tostr('"\\t"'), '"\\t";')
})
test('string with escaped newline', () => {
  assert.equal(tostr('"\\\n"'), '"\\\n";')
})
test('string with unescaped newline', () => {
  assert.equal(tostr('"hello\nworld"'), '"hello\\\nworld";')
})
test('symbol: dash special case', () => {
  assert.equal(tostr('foo-bar'), 'fooBar;')
})
test('symbol: dash special case 2x', () => {
  assert.equal(tostr('foo-bar-baz'), 'fooBarBaz;')
})
test('symbol: replaces all', () => {
  assert.equal(tostr('>>'), '_GT__GT_;')
})
test('symbol: bang', () => {
  assert.equal(tostr('foo!'), 'foo_BANG_;')
})
test('symbol: qmark', () => {
  assert.equal(tostr('foo?'), 'foo_QMARK_;')
})
test('symbol: star', () => {
  assert.equal(tostr('foo*'), 'foo_STAR_;')
})
test('symbol: plus', () => {
  assert.equal(tostr('foo+'), 'foo_PLUS_;')
})
test('symbol: gt', () => {
  assert.equal(tostr('>'), '_GT_;')
})
test('symbol: lt', () => {
  assert.equal(tostr('<'), '_LT_;')
})
test('symbol: eq', () => {
  assert.equal(tostr('='), '_EQ_;')
})
test('plain keyword', () => {
  assert.equal(tostr(':foo'), '"foo";')
})
test('nested arrays', () => {
  assert.equal(tostr('[[1 2 3] [4 5 6]]'), '[[1,2,3,],[4,5,6,],];')
})
test('data structures', () => {
  assert.equal(
    tostr('{:a 1 :b [1 2] :c [3 4]}'),
    '{["a"]:1,["b"]:[1,2,],["c"]:[3,4,],};',
  )
})
test('function call', () => {
  assert.equal(tostr('(a {:b c})'), 'a({["b"]:c,});')
})
test('method call', () => {
  assert.equal(tostr('(.a b {:c d})'), 'b.a({["c"]:d,});')
})
test('constructor call', () => {
  assert.equal(tostr('(String. 42)'), 'new String(42);')
})
test('multiple: list', () => {
  assert.equal(tostr('(add 1)(add 2)'), 'add(1);add(2);')
})
test('value call', () => {
  assert.equal(
    tostr('(fn run [a] ((. Array :isArray) a))'),
    `const run=(a)=>{return Array["isArray"](a);};`,
  )
})
test('call nested hoisted', () => {
  assert.equal(
    tostr('(do (String. (Number. (if true 42 43))))'),
    'let gensym__0;if(true){gensym__0=42}else{gensym__0=43}new String(new Number(gensym__0));;',
  )
})
test('comments', () => {
  assert.equal(
    tostr(`
    ; this is the truth
    "use strict" ; really sure
    `),
    `;"use strict";;`,
  )
})
test('builtin: import', () => {
  assert.equal(
    tostr(`
    (import ["./named.js" [A B c-d]]
            ["./default.js" TheDefault {A MyA D MyD} [E F]]
            ["./index.css"]
            ["./as.js" :as TheNamed])
    `),
    `import {A,B,cD} from "./named.js";import TheDefault,{A as MyA,D as MyD,E,F} from "./default.js";import "./index.css";import * as TheNamed from "./as.js";;`,
  )
})
test('builtin: const', () => {
  assert.equal(tostr('(const a 42)'), 'const a=42;;')
})
test('builtin: const with hoist', () => {
  assert.equal(
    tostr(`
    (const a (case v
                42 :answer
                43 :not))
  `),
    'let gensym__0;switch (v){case 42:gensym__0="answer";break;case 43:gensym__0="not";break;}const a=gensym__0;;',
  )
})
test('builtin: var', () => {
  assert.equal(tostr('(var a 42)'), 'var a=42;;')
})
test('builtin: let', () => {
  assert.equal(tostr('(let a 42)'), 'let a=42;;')
})
test('builtin: fn', () => {
  assert.equal(
    tostr(`
    (fn err [expected offset]
      (str "expected " expected " at position " offset))
    `),
    `const err=(expected,offset)=>{return "expected "+expected+" at position "+offset;};`,
  )
})
test('fn with array destructuring', () => {
  assert.equal(
    tostr(`
    (fn first [[first second] other]
      first)
    `),
    `const first=([first,second,],other)=>{return first;};`,
  )
})
test('fn with object destructuring', () => {
  assert.equal(
    tostr(`
    (fn run [{y x :keys [b c] :or {a 1 b 2 d 3}}]
      a)
    `),
    `const run=({y:x,b=2,c,a=1,d=3})=>{return a;};`,
  )
})
test('fn with rest', () => {
  assert.equal(
    tostr(`
    (fn run [a ...rest]
       (a ...rest))
    `),
    `const run=(a,...rest)=>{return a(...rest);};`,
  )
})
test('builtin: fn@', () => {
  assert.equal(
    tostr(`
    (fn@ run [v]
      @(v 42))
    `),
    `const run=async(v)=>{return await v(42);};`,
  )
})
test('builtin: fn*', () => {
  assert.equal(
    tostr(`
    (fn* run [v]
      (yield v))
    `),
    `const run=function*(v){return yield v;};`,
  )
})
test('builtin: fn@*', () => {
  assert.equal(
    tostr(`
    (fn@* run [v]
      (yield v))
    `),
    `const run=async function*(v){return yield v;};`,
  )
})
test('builtin: anonymous fn', () => {
  assert.equal(
    tostr(`
    (fn [v]
      (v 42))
    `),
    `(v)=>{return v(42);};`,
  )
})
test('builtin: anonymous fn@', () => {
  assert.equal(
    tostr(`
    (fn@ [v]
      @(v 42))
    `),
    `async(v)=>{return await v(42);};`,
  )
})
test('builtin: anonymous fn*', () => {
  assert.equal(
    tostr(`
    (fn* [v]
      (yield v))
    `),
    `function*(v){return yield v;};`,
  )
})
test('builtin: anonymous fn@*', () => {
  assert.equal(
    tostr(`
    (fn@* [v]
      (yield v))
    `),
    `async function*(v){return yield v;};`,
  )
})
test('builtin: let', () => {
  assert.equal(
    tostr(`
    (fn run []
      (let [a 0
            b (inc a)]
        (console.log a)
        b))
    `),
    `const run=()=>{{let a;a=0;let b;b=inc(a);console.log(a);return b;};};`,
  )
})
test('builtin: let without assign', () => {
  assert.equal(
    tostr(`
    (fn run []
      (let [a 0
            b (inc a)]
        (console.log a)
        b)
       null)
    `),
    `const run=()=>{let gensym__0;{let a;a=0;let b;b=inc(a);console.log(a);gensym__0=b;}gensym__0;return null;};`,
  )
})
test('builtin: let as arg', () => {
  assert.equal(
    tostr(`
    (fn run [a] a)
    (do (run (let [a 0
                   b (inc a)]
               (+ a b))))
    `),
    `const run=(a)=>{return a;};let gensym__0;{let a;a=0;let b;b=inc(a);gensym__0=a+b;}run(gensym__0);;`,
  )
})
test('builtin: let with destructuring', () => {
  assert.equal(
    tostr(`
    (fn run []
      (let [{:keys [a b]} (foo)]
        [a b]))
    `),
    `const run=()=>{{let gensym__0;gensym__0=foo();let {a,b}=gensym__0;return [a,b,];};};`,
  )
})
test('builtin: throw', () => {
  assert.equal(tostr('(throw (error "foo"))'), 'throw error("foo");')
})
test('builtin: return with value', () => {
  assert.equal(tostr('(return 42)'), 'return 42;')
})
test('builtin: return bare', () => {
  assert.equal(tostr('(return)'), 'return;')
})
test('builtin: return hoist', () => {
  assert.equal(
    tostr(`
    (fn run []
      (return (if true 42)))
    `),
    `const run=()=>{if(true){return 42};};`,
  )
})
test('builtin: yield', () => {
  assert.equal(tostr('(yield)'), 'yield;')
})
test('builtin: yield*', () => {
  assert.equal(tostr('(yield* [1 2])'), 'yield* [1,2,];')
})
test('builtin: break', () => {
  assert.equal(tostr('(break)'), 'break;')
})
test('builtin: continue', () => {
  assert.equal(tostr('(continue)'), 'continue;')
})
test('builtin: for with step', () => {
  assert.equal(
    tostr(`
    (for [i 0 len step]
      (console.log i))
    `),
    `for(let i=0;i<len;i+=step){console.log(i);};`,
  )
})
test('builtin: for without step', () => {
  assert.equal(
    tostr(`
    (for [i 0 len]
      (console.log i))
    `),
    `for(let i=0;i<len;i++){console.log(i);};`,
  )
})
test('builtin: for-of', () => {
  assert.equal(
    tostr(`
    (for-of [v vs]
      (console.log v))
    `),
    `for(let v of vs){console.log(v);};`,
  )
})
test('builtin: for-in', () => {
  assert.equal(
    tostr(`
    (for-in [v vs]
      (console.log v))
    `),
    `for(let v in vs){console.log(v);};`,
  )
})
test('builtin: for@', () => {
  assert.equal(
    tostr(`
    (for@ [v vs]
      (console.log v))
    `),
    `for await(let v of vs){console.log(v);};`,
  )
})
test('builtin: case return position', () => {
  assert.equal(
    tostr(`
    (fn run []
      (case (inc 1)
      "foo" :bar
      "baz" :boo
      :otherwise))
    `),
    `const run=()=>{switch (inc(1)){case "foo":return "bar";case "baz":return "boo";default:return "otherwise";};};`,
  )
})
test('builtin: case assign', () => {
  assert.equal(
    tostr(`
    (fn run []
      (let [v (case (inc 1)
                "foo" :bar
                "baz" :boo
                :otherwise)]
        v))
    `),
    `const run=()=>{{let v;switch (inc(1)){case "foo":v="bar";break;case "baz":v="boo";break;default:v="otherwise";break};return v;};};`,
  )
})
test('builtin: do', () => {
  assert.equal(
    tostr(`
    (do
      (add 1 1)
      42)
    `),
    `add(1,1);42;;`,
  )
})
test('builtin: if hoisted', () => {
  assert.equal(
    tostr(`
    (const a (if true 42 43))
    `),
    'let gensym__0;if(true){gensym__0=42}else{gensym__0=43}const a=gensym__0;;',
  )
})
test('builtin: if without else', () => {
  assert.equal(
    tostr(`
    (fn run []
      (if true 42))
    `),
    'const run=()=>{if(true){return 42};};',
  )
})
test('builtin: if and else if', () => {
  assert.equal(
    tostr(`
    (fn run [a b]
      (if a 42 b 43))
    `),
    'const run=(a,b)=>{if(a){return 42}else if(b){return 43};};',
  )
})
test('builtin: if return', () => {
  assert.equal(
    tostr(`
    (fn run []
      (if true 42 43))
    `),
    'const run=()=>{if(true){return 42}else{return 43};};',
  )
})
test('builtin: if let', () => {
  assert.equal(
    tostr(`
    (.foo (let [a (if true 42 43)]
             a)
          :bar)
    `),
    'let gensym__0;{let a;if(true){a=42}else{a=43};gensym__0=a;}gensym__0.foo("bar");',
  )
})
test('builtin: double if hoisting', () => {
  assert.equal(
    tostr(`
    (.foo (if (if true 40 41) 42 43)
          :bar)
    `),
    'let gensym__1;if(true){gensym__1=40}else{gensym__1=41}let gensym__0;if(gensym__1){gensym__0=42}else{gensym__0=43}gensym__0.foo("bar");',
  )
})
test('builtin: dot', () => {
  assert.equal(tostr('(. foo bar)'), 'foo[bar];')
})
test('builtin: dot double', () => {
  assert.equal(tostr('(. foo bar baz)'), 'foo[bar][baz];')
})
test('builtin: dot hoist', () => {
  assert.equal(
    tostr(`
    (fn run []
      (. foo (if true 42)))
    `),
    `const run=()=>{let gensym__0;if(true){gensym__0=42}return foo[gensym__0];};`,
  )
})
test('builtin: await', () => {
  assert.equal(tostr(`@42`), `await 42;`)
})
test('builtin: await method call', () => {
  assert.equal(tostr(`@(make :promise)`), `await make("promise");`)
})
test('builtin: op str', () => {
  assert.equal(tostr('(str :a :b :c)'), '"a"+"b"+"c";')
})
test('builtin: op +', () => {
  assert.equal(tostr('(+ 1 2 3)'), '1+2+3;')
})
test('builtin: op + unary', () => {
  assert.equal(tostr('(+ 1)'), '+1;')
})
test('builtin: op -', () => {
  assert.equal(tostr('(- 1 2 3)'), '1-2-3;')
})
test('builtin: op - unary', () => {
  assert.equal(tostr('(- 1)'), '-1;')
})
test('builtin: op *', () => {
  assert.equal(tostr('(* 1 2 3)'), '1*2*3;')
})
test('builtin: op /', () => {
  assert.equal(tostr('(/ 1 2 3)'), '1/2/3;')
})
test('builtin: op **', () => {
  assert.equal(tostr('(** 1 2 3)'), '1**2**3;')
})
test('builtin: op %', () => {
  assert.equal(tostr('(% 1 2 3)'), '1%2%3;')
})
test('builtin: cmp =', () => {
  assert.equal(tostr('(= a b)'), 'a===b;')
})
test('builtin: cmp ==', () => {
  assert.equal(tostr('(== a b)'), 'a==b;')
})
test('builtin: cmp <', () => {
  assert.equal(tostr('(< a b)'), 'a<b;')
})
test('builtin: cmp >', () => {
  assert.equal(tostr('(> a b)'), 'a>b;')
})
test('builtin: cmp >=', () => {
  assert.equal(tostr('(>= a b)'), 'a>=b;')
})
test('builtin: cmp <=', () => {
  assert.equal(tostr('(<= a b)'), 'a<=b;')
})
test('lambda', () => {
  assert.equal(
    tostr(`#([(if $ true false) $2 :$3])`),
    `(gensym__0,gensym__1)=>{let gensym__2;if(gensym__0){gensym__2=true}else{gensym__2=false}return [gensym__2,gensym__1,"$3",];};`,
  )
})
test('builtin: typeof', () => {
  assert.equal(tostr('(typeof 1)'), 'typeof 1;')
})
test('builtin: set!', () => {
  assert.equal(tostr('(set! a 1)'), 'a=1;')
})
test('macro: ->', () => {
  assert.equal(
    tostr('(-> :hello (.toUpperCase) (str " world"))'),
    '"hello".toUpperCase()+" world";',
  )
})
test('macro: -> with symbol', () => {
  assert.equal(
    tostr('(-> :hello .toUpperCase (str " world"))'),
    '"hello".toUpperCase()+" world";',
  )
})
test('macro: when', () => {
  assert.equal(
    tostr('(when true (prn :hello) (prn :world))'),
    'let gensym__0;if(true){prn("hello");gensym__0=prn("world");}gensym__0;',
  )
})
test('macro: array?', () => {
  assert.equal(tostr('(array? v)'), 'Array.isArray(v);')
})
test('macro: hoist unquote', () => {
  assert.equal(
    tostr(`
    (macro doto* [v form]
      '(do
         ,(if (array? form)
            (do
              (.splice form 1 0 v)
              form)
           '(,form ,v))
          ,v))
  (return (doto* v (.push 1)))
  `),
    ';v.push(1);return v;;',
  )
})

const testErr = (input, msg) => () => {
  let output
  try {
    output = tostr(input, false)
  } catch (err) {
    assert.equal(err.message, msg, err)
    return
  }
  throw Error(
    `was expecting error: "${msg}"
INPUT:
${input}
OUTPUT:
${output}`,
  )
}

test('lone paren', testErr('(', '<anonymous>:1:1: unterminated form'))
test(
  'unterminated string',
  testErr('(foo "', '<anonymous>:1:6: unterminated string'),
)
test(
  'unterminated keyword',
  testErr('(foo :', '<anonymous>:1:6: unterminated form'),
)
test('unterminated map', testErr('{', '<anonymous>:1:1: unterminated form'))
test('unterminated array', testErr('[', '<anonymous>:1:1: unterminated form'))
test('unterminated list', testErr('(do ', '<anonymous>:1:2: unterminated form'))
test(
  'destructure unexpected',
  testErr(
    '(let [:foo :bar] :bar)',
    '<anonymous>:1:8: unexpected destructure "string"',
  ),
)
test(
  'destructure unexpected op',
  testErr(
    '(let [{:foo [bar]} :bar] :bar)',
    '<anonymous>:1:9: unexpected destructuring map op "foo"',
  ),
)
test(
  'map uneven forms map',
  testErr(
    '{:a}',
    '<anonymous>:1:1: object literal must contain even number of forms',
  ),
)
test('invalid keyword', testErr('::a', '<anonymous>:1:1: invalid keyword'))
test(
  'unexpected import',
  testErr('(import [:a (a)])', '<anonymous>:1:13: unexpected import'),
)
test(
  'unexpected import',
  testErr('(import [:a :foo])', '<anonymous>:1:14: unexpected import'),
)
test(
  'unexpected hash',
  testErr('#"foo"', '<anonymous>:1:2: unexpected hash "string"'),
)

test.run()
