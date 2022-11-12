const single = ['(', ')', '[', ']', '{', '}', '@', '#']
const whitespace = [' ', '\r', '\n', '\t']

const err = (expected, offset) => `expected ${expected} at position ${offset}`

const readString = (input, len, start) => {
  // TODO: handle escapes
  let lines = 0
  for (let end = start; end < len; end++) {
    switch (input[end]) {
      case '"':
        return [input.substring(start, end), end + 1, lines]
      case '\n':
        lines++
        break
    }
  }
  throw new Error('unterminated string')
}

const readSymbol = (input, len, start, expected) => {
  if (start === len) {
    throw new Error(err(expected, start))
  }
  let end
  for (end = start; end < len; end++) {
    const c = input[end]
    if (single.includes(c) || whitespace.includes(c)) {
      break
    }
  }
  return [input.substring(start, end), end]
}

const readEOL = (input, len, start) => {
  let end
  for (end = start; end < len; end++) {
    if (input[end] === '\n') {
      break
    }
  }
  return [input.substring(start, end), end]
}

export function* tokens(input) {
  let offset = 0
  let line = 0
  let column = 0
  let len = input.length
  let value, end, deltaLines
  while (offset < len) {
    let c = input[offset]
    if (c === '\n') {
      offset++
      line++
      column = 0
      continue
    }
    if (whitespace.includes(c)) {
      offset++
      column++
      continue
    }
    if (single.includes(c)) {
      yield { kind: c, offset, line, column }
      offset++
      column++
      continue
    }
    switch (c) {
      case '"':
        ;[value, end, deltaLines] = readString(input, len, offset + 1)
        yield { kind: 'string', value, offset, line, column }
        offset = end
        line += deltaLines
        break
      case ':':
        ;[value, end] = readSymbol(input, len, offset + 1, 'keyword')
        yield { kind: 'keyword', value, offset, line, column }
        offset = end
        break
      case ';':
        ;[value, end] = readEOL(input, len, offset + 1)
        yield { kind: 'comment', value, offset, line, column }
        line++
        offset = end
        break
      default:
        ;[value, end] = readSymbol(input, len, offset, 'symbol')
        yield { kind: 'symbol', value, offset, line, column }
        offset = end
        break
    }
  }
}

function* transpileMap(input) {
  yield '{'
  for (let token of input) {
    if (token.kind === '}') {
      yield '}'
      return
    }
    yield '['
    yield* transpileExpr(input, token)
    yield ']:'
    yield* transpileExpr(input)
    yield ','
  }
  throw new Error('unterminated map')
}

function* transpileArray(input) {
  yield '['
  for (let token of input) {
    if (token.kind === ']') {
      yield ']'
      return
    }
    yield* transpileExpr(input, token)
    yield ','
  }
  throw new Error('unterminated array')
}

function* expect(input, ...expected) {
  let i = 0
  for (const actual of input) {
    const expect = expected[i]
    if (actual.kind !== expect.kind) {
      throw new Error(`expected ${expect.kind} but got ${actual.kind}`)
    }
    if ('value' in expect) {
      if (actual.value !== expect.value) {
        throw new Error(`expected ${expect.value} but got ${actual.value}`)
      }
    }
    yield actual
    i++
    if (i === expected.length) {
      return
    }
  }
  throw new Error(`input ended while expecting ${expected[i].kind}`)
}

function discard(iterator) {
  for (const _ of iterator) {
  }
}

function* transpileImport(input) {
  for (let token of input) {
    if (token.kind === ')') {
      return
    }
    if (token.kind !== '[') {
      throw new Error('expected [')
    }
    yield 'import {'
    const [importPath] = expect(input, { kind: 'string' })
    discard(expect(input, { kind: '[' }))
    for (let name of input) {
      if (name.kind === ']') {
        break
      }
      if (name.kind !== 'symbol') {
        throw new Error('expecting a symbol')
      }
      yield* transpileSymbol(name)
      yield ','
    }
    discard(expect(input, { kind: ']' }))
    yield '} from '
    yield* transpileString(importPath)
    yield ';'
  }
  throw new Error('unterminated import')
}

function* transpileDef(input) {
  yield 'let '
  const [name] = expect(input, { kind: 'symbol' })
  yield* transpileSymbol(name)
  yield '='
  yield* transpileExpr(input)
  yield ';'
  discard(expect(input, { kind: ')' }))
}

function* transpileDo(input) {
  let prev
  for (const token of input) {
    if (token.kind === ')') {
      yield 'return '
      yield* prev
      yield ';'
      return
    }
    if (prev) {
      yield* prev
      yield ';'
    }
    prev = [...transpileExpr(input, token)]
  }
  throw new Error('unterminated list')
}

function* transpileFn(input) {
  yield 'const '
  const [name] = expect(input, { kind: 'symbol' })
  yield* transpileSymbol(name)
  yield '=('
  discard(expect(input, { kind: '[' }))
  for (const token of input) {
    if (token.kind === ']') {
      yield ')'
      break
    }
    if (token.kind !== 'symbol') {
      throw new Error(`unexpected ${token}`)
    }
    yield* transpileSymbol(token)
    yield ','
  }
  yield '=>{'
  yield* transpileDo(input)
  yield '}'
}

function* transpileStr(input) {
  let first = true
  for (const token of input) {
    if (token.kind === ')') {
      return
    }
    if (!first) {
      yield '+'
    }
    first = false
    yield* transpileExpr(input, token)
  }
}

function* transpileList(input) {
  let { value: token, done } = input.next()
  if (done) {
    throw new Error('unterminated list')
  }
  switch (token.kind) {
    case 'symbol':
      switch (token.value) {
        case 'import':
          yield* transpileImport(input)
          return
        case 'def':
          yield* transpileDef(input)
          return
        case 'fn':
          yield* transpileFn(input)
          return
        case 'str':
          yield* transpileStr(input)
          return
      }
      if (token.value.startsWith('.')) {
        yield* transpileExpr(input)
      }
      yield* transpileSymbol(token)
      yield '('
      break
    default:
      throw new Error(`cannot call ${token.kind}`)
  }
  for (let token of input) {
    if (token.kind === ')') {
      yield ')'
      return
    }
    yield* transpileExpr(input, token)
    yield ','
  }
  throw new Error('unterminated list')
}

function* transpileKeyword(token) {
  yield '"'
  yield token.value
  yield '"'
}

function* transpileString(token) {
  yield '"'
  yield token.value
  yield '"'
}

function* transpileSymbol(token) {
  yield token.value
}

function* transpileExpr(input, token) {
  if (!token) {
    let next = input.next()
    if (next.done) {
      return false
    }
    token = next.value
  }
  switch (token.kind) {
    case '(':
      yield* transpileList(input)
      break
    case '{':
      yield* transpileMap(input)
      break
    case '[':
      yield* transpileArray(input)
      break
    case 'keyword':
      yield* transpileKeyword(token)
      break
    case 'string':
      yield* transpileString(token)
      break
    case 'symbol':
      yield* transpileSymbol(token)
      break
    default:
      throw new Error(`unhandled token: ${token.kind}`)
  }
  return true
}

export function* transpile(code) {
  const input = tokens(code)
  // generators have cleanup logic which makes early returns void the rest of
  // the generator run. this wrapper creates a custom iterator that disables
  // that behavior. see:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of#early_exiting
  const wrapper = {
    next() {
      return input.next()
    },
    [Symbol.iterator]() {
      return this
    },
  }
  // yield* each expression, and use the final return (from transpileExpr) to
  // decide if we should continue. this return is setup to return false when the
  // input iterator stops producing tokens.
  while (yield* transpileExpr(wrapper)) {}
}
