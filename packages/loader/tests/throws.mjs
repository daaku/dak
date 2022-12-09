import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exe = promisify(execFile)

test('source mapped stack trace', async () => {
  try {
    const { stdout, stderr } = await exe('node', [
      '--no-warnings',
      '--enable-source-maps',
      '--loader',
      '@daklang/loader',
      'fixtures/throws.dak',
    ])
    assert.unreachable(`expected to throw but got:\n${stdout}\n${stderr}`)
  } catch (e) {
    assert.match(e.stderr, /throws.dak:2/)
    assert.match(e.stderr, /\(throw \(Error "from three"\)\)/)
    assert.match(e.stderr, /at three .*throws.dak:2:10/)
    assert.match(e.stderr, /at two .*throws.dak:5:3/)
    assert.match(e.stderr, /at one .*throws.dak:8:3/)
  }
})

test.run()
