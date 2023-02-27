# @daklang/rollup

This package provides a [Rollup](https://rollupjs.org/) /
[Vite](https://vitejs.dev/) compatible plugin for the
[Dak Language](https://www.daklang.com/).

## Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import { dakPlugin } from '@daklang/rollup'

export default defineConfig({
  plugins: [dakPlugin()],
})
```

This is the recommended setup for building browser based applications in Dak.

## Rollup

```javascript
// rollup.config.js
import { dakPlugin } from '@daklang/rollup'

export default {
  plugins: [dakPlugin()],
}
```
