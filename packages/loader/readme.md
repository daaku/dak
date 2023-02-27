# @daklang/loader

This package provides a [ESM
Loader](https://nodejs.org/api/esm.html#esm_loaders) to allow loading
[Dak](https://www.daklang.com/) files with the extension `.dak` in Node without
having to manually transpile them.

```sh
npm i @daklang/loader
echo '(console.log :hello)' > hello.dak
node --no-warnings --enable-source-maps --loader @daklang/loader hello.dak
```

This is the recommended setup for writing Dak CLI scripts.
<sub>(NOTE: `--no-warnings` is a hammer for quiet `--loader` use.)</sub>
