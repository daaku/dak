# @daklang/loader

This package provides a [ESM
Loader](https://nodejs.org/api/esm.html#esm_loaders) to allow loading
[Dak](https://daklang.com/) files with the extension `.dak` in Node without
having to first transpile them.

```sh
echo '(console.log :hello)' > hello.dak
node --no-warnings --enable-source-maps --loader @daklang/loader hello.dak
```
