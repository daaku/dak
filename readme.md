# dak

Dak or DakLang is a Lisp that transpiles to JavaScript.

Zen:

1. Full access to JavaScript.
2. No runtime.
3. Participate in the ecosystem.

JavaScript is ubiquitous. It's ecosystem is diverse and populated. Dak attempts
to provide a path to leverage and participate in this ecosystem, as a modern
lisp like language. It's not Common Lisp or Scheme, but more like Clojure or
Fennel. It doesn't hide it's true nature, and aims to provide access to every
feature JavaScript has.

It has browser output as an important goal. Specifically, small bundle size and
tree shaking for pay-as-you-go, are key considerations that determine the design
choices. If you are making a browser based application in Dak, a [Vite based
setup is the recommended choice](#12).

## Programmable Language

Lisp is often regarded as a programmable language. Augmenting the syntax is a
powerful, and available tool. Since Dak is a transpiler, it only makes sense to
allow augmenting the transpile process directly. This has various implications.

1. Prefer functions where possible.
2. Macros when you need to control evaluation.
3. Syntax extension like delimited structures.
4. Trainspile extension as the ulimate last resort.

## Why Lisp?

Because they spark joy.

## Documentation

### Literals

- Numbers
- Strings: Multiline strings, Double Quoted, Escapes
- Array
- Object

### Destructuring

- rename
- :keys
- :or
- :as
- rest/spread

### Functions

- Named vs Anonymous
- Shorthand Lambda
- Documentation
- No Arity
- Metadata
- Async, Generator, Return, Yield, Yield\*
- Async / Await

### Macros

- Define
- Quoting
- Gensym

### Loops / Iteration

- Numeric Loop
- While Loop
- Iterator
- Async Iterator
- Break
- Continue

### Exceptions

- Try
- Catch
- Finally
- Throw

### Import

### Spread Operator

### Classes

- Define
- New
- This
- Prototype

### Mutation

- Set
- Set In

### Type Of

### Regex

### Null Safe

### Math

- Multi Argument Comparisons

### Hiccup

- lit-html?

### Source Maps

### Tooling

- Formatting
- Language Server
- Tests
- Repl
- nREPL

(fn pathological []
(.call (let [foo 1
bar 2]
(+ foo bar)
32)))

         const pathological = () => {
          let foo = 1;
          let bar = 2;
          let gen_1 = 32;
          return gen_1.call()
         }
