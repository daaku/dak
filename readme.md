# dak

## TODO

### Features

- symbol name mangling
- binding context (allow shadowing any symbol)
- macros
- hiccup

### Forms

- try/catch/finally
- new: (Error. "foo")
- return
- break
- yield
- yield star
- math ops
- ?.
- .

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
