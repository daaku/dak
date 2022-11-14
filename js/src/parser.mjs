const single = ['(', ')', '[', ']', '{', '}', '@', '#', ':', "'", '~', '`', ',']
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

const readSymbol = (input, len, start) => {
  if (start === len) {
    throw new Error(err('symbol', start))
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
      case ';':
        ;[value, end] = readEOL(input, len, offset + 1)
        yield { kind: 'comment', value, offset, line, column }
        line++
        offset = end
        break
      default:
        ;[value, end] = readSymbol(input, len, offset)
        yield { kind: 'symbol', value, offset, line, column }
        offset = end
        break
    }
  }
}

function* expect(input, ...expected) {
  let i = 0
  for (const actual of input) {
    if (actual.kind !== expected[i]) {
      throw new Error(`expected ${expected[i]} but got ${actual.kind}`)
    }
    yield actual
    i++
    if (i === expected.length) {
      return
    }
  }
  throw new Error(`input ended while expecting ${expected[i].kind}`)
}

// generators have cleanup logic which makes early returns void the rest of
// the generator run. this creates a custom iterator that disables
// that behavior. see:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of#early_exiting
const uninterrupt = it => {
  return {
    next() {
      return it.next()
    },
    [Symbol.iterator]() {
      return this
    },
  }
}

function discard(iterator) {
  for (const _ of iterator) {
  }
}

const prepend = (one, rest) =>
  uninterrupt(
    (function* () {
      yield one
      yield* rest
    })(),
  )

function* transpileMap(input) {
  yield '{'
  for (let token of input) {
    if (token.kind === '}') {
      yield '}'
      return
    }
    yield '['
    yield* transpileExpr(prepend(token, input))
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
    yield* transpileExpr(prepend(token, input))
    yield ','
  }
  throw new Error('unterminated array')
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
    const [importPath] = expect(input, 'string')
    discard(expect(input, '['))
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
    discard(expect(input, ']'))
    yield '} from '
    yield* transpileString(importPath)
    yield ';'
  }
  throw new Error('unterminated import')
}

function* transpileDef(input) {
  yield 'let '
  const [name] = expect(input, 'symbol')
  yield* transpileSymbol(name)
  yield '='
  yield* transpileExpr(input)
  yield ';'
  discard(expect(input, ')'))
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
    prev = [...transpileExpr(prepend(token, input))]
  }
  throw new Error('unterminated list')
}

function* transpileDestructure(input) {
  for (const token of input) {
    switch (token.kind) {
      default:
        throw new Error(`unexpected ${token.kind} ${token.value}`)
      case 'symbol':
        yield* transpileSymbol(token)
        return
      case '[':
        yield '['
        for (const inner of input) {
          if (inner.kind === ']') {
            yield ']'
            return
          }
          yield* transpileDestructure(prepend(inner, input))
          yield ','
        }
        return
      case '{':
        const keys = []
        const rename = {}
        const or = {}
        for (const token of input) {
          if (token.kind === '}') {
            break
          }
          if (token.kind === 'symbol') {
            const [, { value: source }] = expect(input, ':', 'symbol')
            if (source !== token.value) {
              rename[source] = token.value
            }
            if (!keys.includes(source)) {
              keys.push(source)
            }
            continue
          }
          if (token.kind !== ':') {
            throw new Error(`unexpected ${token}`)
          }
          const [{ value: op }] = expect(input, 'symbol')
          switch (op) {
            default:
              throw new Error(`unexpected destructing op ${op}`)
            case 'keys':
              discard(expect(input, '['))
              for (const token of input) {
                if (token.kind === ']') {
                  break
                }
                if (token.kind !== 'symbol') {
                  throw new Error(`unexpected key ${token.kind}`)
                }
                keys.push(token.value)
              }
              break
            case 'or':
              discard(expect(input, '{'))
              for (const token of input) {
                if (token.kind === '}') {
                  break
                }
                if (token.kind !== 'symbol') {
                  throw new Error(`unexpected key ${token.kind}`)
                }
                or[token.value] = [...transpileExpr(input)]
                if (!keys.includes(token.value)) {
                  keys.push(token.value)
                }
              }
              break
          }
        }
        yield '{'
        let first = true
        for (const key of keys) {
          if (first) {
            first = false
          } else {
            yield ','
          }
          yield* transpileSymbol({ value: key })
          if (Object.hasOwn(rename, key)) {
            yield ':'
            yield* transpileSymbol({ value: rename[key] })
          }
          if (Object.hasOwn(or, key)) {
            yield '='
            yield* or[key]
          }
        }
        yield '}'
        return
    }
  }
}

function* transpileFn(input) {
  yield 'const '
  const [name] = expect(input, 'symbol')
  yield* transpileSymbol(name)
  yield '=('
  discard(expect(input, '['))
  for (const token of input) {
    if (token.kind === ']') {
      yield ')'
      break
    }
    yield* transpileDestructure(prepend(token, input))
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
    yield* transpileExpr(prepend(token, input))
  }
}

function* transpileLet(input) {
  discard(expect(input, '['))
  let first = true
  yield '(() => {let '
  for (const token of input) {
    if (token.kind === ']') {
      yield ';'
      break
    }
    if (first) {
      first = false
    } else {
      yield ','
    }
    yield* transpileDestructure(prepend(token, input))
    yield '='
    yield* transpileExpr(input)
  }
  yield* transpileDo(input)
  yield '})()'
}

function* transpileThrow(input) {
  yield 'throw '
  yield* transpileExpr(input)
  discard(expect(input, ')'))
  yield ';'
}

function* transpileFor(input) {
  discard(expect(input, '['))
  const [binding] = expect(input, 'symbol')
  yield 'for(let '
  yield* transpileSymbol(binding)
  yield '='
  yield* transpileExpr(input)
  yield ';'
  yield* transpileSymbol(binding)
  yield '<'
  yield* transpileExpr(input)
  yield ';'
  yield* transpileSymbol(binding)
  const { value, done } = input.next()
  if (done) {
    throw new Error('unfinished for')
  }
  if (value === ']') {
    yield '++'
  } else {
    yield '+='
    yield* transpileExpr(prepend(value, input))
    discard(expect(input, ']'))
  }
  yield '){'
  for (const token of input) {
    if (token.kind === ')') {
      yield '}'
      return
    }
    yield* transpileExpr(prepend(token, input))
    yield ';'
  }
  throw new Error('unfinished for')
}

function* transpileCase(input) {
  yield 'switch ('
  yield* transpileExpr(input)
  yield '){'
  for (const token of input) {
    if (token.kind === ')') {
      yield '}'
      return
    }
    const cond = [...transpileExpr(prepend(token, input))]
    const { value: expr, done } = input.next()
    if (done) {
      throw new Error('unterminated list')
    }
    // path for final default clause
    if (expr.kind === ')') {
      yield 'default:'
      yield* cond
      yield ';break}'
      return
    }
    yield 'case '
    yield* cond
    yield ':'
    yield* transpileExpr(prepend(expr, input))
    yield ';break;'
  }
}

const builtins = {
  import: transpileImport,
  def: transpileDef,
  fn: transpileFn,
  str: transpileStr,
  let: transpileLet,
  throw: transpileThrow,
  for: transpileFor,
  case: transpileCase,
}

function* transpileList(input) {
  const [token] = expect(input, 'symbol')
  const builtin = builtins[token.value]
  if (builtin) {
    yield* builtin(input)
    return
  }
  if (token.value.startsWith('.')) {
    yield* transpileExpr(input)
  }
  yield* transpileSymbol(token)
  yield '('
  for (let token of input) {
    if (token.kind === ')') {
      yield ')'
      return
    }
    yield* transpileExpr(prepend(token, input))
    yield ','
  }
  throw new Error('unterminated list')
}

function* transpileKeyword(input) {
  const [token] = expect(input, 'symbol')
  yield* transpileString(token)
}

function* transpileString(token) {
  yield '"'
  yield token.value
  yield '"'
}

function* transpileSymbol(token) {
  yield token.value
}

function* transpileExpr(input) {
  const { value: token, done } = input.next()
  if (done) {
    return false
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
    case ':':
      yield* transpileKeyword(input)
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
  const input = uninterrupt(tokens(code))
  // yield* each expression, and use the final return (from transpileExpr) to
  // decide if we should continue. this return is setup to return false when the
  // input iterator stops producing tokens.
  while (yield* transpileExpr(input)) {}
}
