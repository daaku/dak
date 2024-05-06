import { plugin } from 'bun'

plugin({
  name: 'dak',
  async setup(builder) {
    const { transpileStr } = await import('./transpiler.dak')
    builder.onLoad({ filter: /\.dak$/ }, async ({ path }) => {
      const text = await Bun.file(path).text()
      const result = transpileStr(text, {
        source: path,
        sourcemap: 'inline',
      })
      return {
        contents: result.code,
        loader: 'js',
      }
    })
  },
})
