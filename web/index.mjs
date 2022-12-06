import prettier from 'https://unpkg.com/prettier@2.7.1/esm/standalone.mjs'
import parserBabel from 'https://unpkg.com/prettier@2.7.1/esm/parser-babel.mjs'
import { transpileStr } from '../packages/transpiler/src/transpiler.mjs'

const autoEval = document.getElementById('autoEval')
const fmt = document.getElementById('fmt')
const dakCode = document.getElementById('dakCode')
const jsCode = document.getElementById('jsCode')
const output = document.getElementById('output')

const isPrimitive = v => v === Object(v)

globalThis.prn = (...rest) => {
  console.log(...rest)
  for (const thing of rest) {
    const child = document.createElement('pre')
    if (isPrimitive(thing)) {
      child.innerText = String(thing)
    } else {
      child.innerText = JSON.stringify(thing)
    }
    output.appendChild(child)
  }
}

const logErr = (prefix, err) => {
  console.error(err)
  const child = document.createElement('pre')
  child.innerText = `${prefix}: ${err.message ?? err}`
  output.appendChild(child)
}

const refresh = async () => {
  output.replaceChildren()

  try {
    const js = transpileStr(dakCode.value, { filename: 'main.dak' })

    if (autoEval.checked) {
      ;(async () => {
        try {
          await Object.getPrototypeOf(async function () {}).constructor(js)()
        } catch (e) {
          logErr('eval', e)
        }
      })()
    }

    if (fmt.value === 'pretty') {
      try {
        jsCode.value = prettier.format(js, {
          parser: 'babel',
          plugins: [parserBabel],
        })
        return
      } catch (e) {
        logErr('pretty', e)
      }
    }

    if (fmt.value === 'minify') {
      try {
        const result = await Terser.minify(js)
        jsCode.value = result.code
        return
      } catch (e) {
        logErr('minify', e)
      }
    }

    // if we get here we're doing raw mode
    jsCode.value = js
  } catch (e) {
    logErr('transpile', e)
  }
}

autoEval.onchange = refresh
dakCode.oninput = refresh
fmt.onchange = refresh
