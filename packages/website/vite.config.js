import { defineConfig } from 'vite'
import { dakPlugin } from '@daklang/rollup'

export default defineConfig({
  plugins: [dakPlugin()],
})
