# dak

## TODO

- hoist statements in expression positions (arguments etc)
- add assign/return operations in final positions

- new: (Error. "foo")
- return
- break
- yield
- yield star
- math ops
- ?.
- .
- symbol name mangling
- binding context

- (do ) needs final assignment
- (let )
- (case )
- (try )
- (if )

## Notes

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

{}
[]
#{} Set
defn ()
defn* function*
defn@ async
...args
{ a, b }
import
await
default argument values
defmacro
try/catch/finally
throw
class
for
for await
for of
set
set-in
typeof
regex
tagged templates
new
?. null safe
math
string interp
jsx (hiccup macro?)
--
sourcemaps
repl
lsp
fmt
--
lit-html?
