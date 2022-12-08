#!/usr/bin/env node

import { transpile } from '@daklang/transpiler'
import { readFileSync } from 'node:fs'
import process from 'node:process'

const all = []
const input = readFileSync(0, 'utf-8')
const stdout = process.stdout
for (const output of transpile(input)) {
  all.push(
    stdout.write(typeof output === 'string' ? output : output[0], 'utf-8'),
  )
}
all.push(stdout.write('\n', 'utf-8'))
await Promise.all(all)
