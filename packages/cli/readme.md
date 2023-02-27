# @daklang/cli

This package provides a CLI for the [Dak Language](https://www.daklang.com/).

## Wrapper

Adding this as a dependency provides a [shell script](dak) wrapper that executes
`node` with the [loader](../loader). This is handy if you want to write CLI
scripts. See for example the scripts section of how the
[website](../website/package.json) is built.

```sh
npm i @daklang/cli
echo '(console.log :hello)' > hello.dak
./node_modules/.bin/dak hello.dak
```

## NPX

This also allows for usage via `npx`:

```sh
echo '(console.log :hello)' > hello.dak
npx @daklang/cli hello.dak
```

`npx` is slow, so install the package and use the `dak` script directly for best
results.

## Transpiler

A simple transpiler for CLI usage is also available:

```sh
echo '(console.log :hello)' | npx --package @daklang/cli -c dak-transpile
```
