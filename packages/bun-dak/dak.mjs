import { plugin } from 'bun'

plugin({
  name: 'dak',
  async setup(builder) {
    const { transpileStr } = await import('@daklang/transpiler')
    const { readFileSync } = await import('fs')
    builder.onLoad({ filter: /\.dak$/ }, ({ path }) => ({
      contents: transpileStr(readFileSync(path, 'utf8'), {
        filename: path,
        sourcemap: 'inline',
      }).code,
      loader: 'js',
    }))
  },
})

await import(process.argv[2])
