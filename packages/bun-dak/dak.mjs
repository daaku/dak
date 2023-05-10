import { plugin } from 'bun'
import { transpileStr } from '@daklang/transpiler'

plugin({
  name: 'dak',
  async setup(builder) {
    const { readFileSync } = await import('fs')
    builder.onLoad({ filter: /\.dak$/ }, ({ path }) => ({
      contents: transpileStr(readFileSync(path, 'utf8'), {
        source: path,
        sourcemap: 'inline',
      }).code,
      loader: 'js',
    }))
  },
})
