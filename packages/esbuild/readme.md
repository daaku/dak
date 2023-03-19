# @daklang/esbuild

This package provides a [esbuild](https://esbuild.github.io/)
plugin for the [Dak Language](https://www.daklang.com/).

```javascript
import { dakPlugin } from '@daklang/esbuild'
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
  plugins: [dakPlugin()],
})
console.log(result)
```
