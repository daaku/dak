const single = ['(', ')', '[', ']', '{', '}', '@', '#']
const whitespace = [' ', '\r', '\n', '\t']

const err = (expected, offset) => `expected ${expected} at position ${offset}`

const readString = (input, len, start) => {
  // TODO: handle escapes
  if (start === len) {
    throw new Error(err('complete string', start))
  }
  let end
  let lines = 0
  for (end = start; end < len; end++) {
    const c = input[end]
    if (c === '"') {
      break
    }
    if (c === '\n') {
      lines++
    }
  }
  return [input.substring(start, end), end, lines]
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

function* prepend(one, rest) {
  yield one
  yield* rest
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
  throw new Error('unterminated map literal')
}

function* transpileArray(input) {
  yield '['
  for (let token of input) {
    if (token.kind === ']') {
      console.log('array loop end', token)
      yield ']'
      return
    }
    console.log('array loop', token)
    yield* transpileExpr(input, token)
    yield ','
  }
  console.log('before throw', input.next())
  throw new Error('unterminated array literal')
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
  console.log('expr', token)
  switch (token.kind) {
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
  let input = tokens(code)
  while (yield* transpileExpr(input)) {}
}
