const single = ['(', ')', '[', ']', '{', '}', '@', '#', ':', "'", '~', '`', ',']
const whitespace = [' ', '\r', '\n', '\t']

const err = (expected, offset) => `expected ${expected} at position ${offset}`

const posS = pos =>
  `on line ${pos.line + 1} column ${pos.column + 1} at offset ${pos.offset + 1}`

const newGensym = () => {
  let _gensym = 0
  return () => {
    return { kind: 'symbol', value: `gensym__${_gensym++}`, pos: {} }
  }
}

const readString = (input, len, pos) => {
  // TODO: handle escapes
  let start = pos.offset + 1
  for (let end = start; end < len; end++) {
    pos.offset++
    pos.column++
    switch (input[end]) {
      case '"':
        pos.offset++
        pos.column++
        return input.substring(start, end)
      case '\n':
        pos.line++
        pos.column = 0
        break
    }
  }
  throw new Error('unterminated string')
}

const readSymbol = (input, len, pos) => {
  let start = pos.offset
  if (start === len) {
    throw new Error(err('symbol', start))
  }
  let end
  for (end = start; end < len; end++) {
    const c = input[end]
    if (c === '\n') {
      pos.line++
      pos.column = 0
    }
    if (single.includes(c) || whitespace.includes(c)) {
      break
    }
    pos.offset++
    pos.column++
  }
  return input.substring(start, end)
}

const readEOL = (input, len, pos) => {
  let start = pos.offset + 1
  let end
  for (end = start; end < len; end++) {
    pos.offset++
    pos.column++
    if (input[end] === '\n') {
      pos.line++
      pos.column = 0
      break
    }
  }
  return input.substring(start, end)
}

export function* tokens(input) {
  let pos = { offset: 0, line: 0, column: 0 }
  let len = input.length
  let value, start
  while (pos.offset < len) {
    let c = input[pos.offset]
    if (c === '\n') {
      pos.offset++
      pos.line++
      pos.column = 0
      continue
    }
    if (whitespace.includes(c)) {
      pos.offset++
      pos.column++
      continue
    }
    if (single.includes(c)) {
      yield { kind: c, pos: { ...pos } }
      pos.offset++
      pos.column++
      continue
    }
    switch (c) {
      case '"':
        start = { ...pos }
        value = readString(input, len, pos)
        yield { kind: 'string', value, pos: start }
        break
      case ';':
        start = { ...pos }
        value = readEOL(input, len, pos)
        yield { kind: 'comment', value, pos: start }
        break
      default:
        start = { ...pos }
        value = readSymbol(input, len, pos)
        yield { kind: 'symbol', value, pos: start }
        break
    }
  }
}

const iter = vs =>
  uninterrupt(
    (function* () {
      yield* vs
    })(),
  )

function* expect(input, ...expected) {
  let i = 0
  for (const actual of input) {
    if (actual.kind !== expected[i]) {
      throw new Error(
        `expected ${expected[i]} but got ${actual.kind} ${posS(actual.pos)}`,
      )
    }
    yield actual
    i++
    if (i === expected.length) {
      return
    }
  }
  throw new Error(`input ended while expecting ${expected[i]}`)
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

const pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
}
const plusOnes = ['@', '#', ':', "'", '~', '`', ',']

// finished input returns an empty array.
const collectForm = input => {
  const collected = []
  const closers = []
  for (const token of input) {
    collected.push(token)
    if (closers.length !== 0 && closers[closers.length - 1] === token.kind) {
      closers.pop()
    } else if (Object.hasOwn(pairs, token.kind)) {
      closers.push(pairs[token.kind])
    }
    if (!plusOnes.includes(token.kind) && closers.length === 0) {
      break
    }
  }
  return collected
}

function* transpileMap(gensym, input, hoist) {
  yield '{'
  for (let token of input) {
    if (token.kind === '}') {
      yield '}'
      return
    }
    yield '['
    yield* transpileExpr(gensym, prepend(token, input), null, hoist)
    yield ']:'
    yield* transpileExpr(gensym, input, null, hoist)
    yield ','
  }
  throw new Error('unterminated map')
}

function* transpileArray(gensym, input, hoist) {
  yield '['
  for (let token of input) {
    if (token.kind === ']') {
      yield ']'
      return
    }
    yield* transpileExpr(gensym, prepend(token, input), null, hoist)
    yield ','
  }
  throw new Error('unterminated array')
}

function* transpileBuiltinImport(gensym, input) {
  for (let token of input) {
    if (token.kind === ')') {
      return
    }
    if (token.kind !== '[') {
      throw new Error(`expected [ ${posS(token.pos)}`)
    }
    yield 'import {'
    const [importPath] = expect(input, 'string')
    discard(expect(input, '['))
    for (let name of input) {
      if (name.kind === ']') {
        break
      }
      if (name.kind !== 'symbol') {
        throw new Error(`expecting a symbol ${posS(token.pos)}`)
      }
      yield* transpileSymbol(gensym, name)
      yield ','
    }
    discard(expect(input, ']'))
    yield '} from '
    yield* transpileString(gensym, importPath)
    yield ';'
  }
  throw new Error('unterminated import')
}

const hoister = gensym => {
  const collected = []
  return [
    (transpile, input, hoist) => {
      const sym = [...transpileSymbol(gensym, gensym())]
      const assign = [...sym, '=']
      collected.push(
        'let ',
        ...sym,
        ';',
        ...transpile(gensym, input, assign, hoist),
      )
      return sym
    },
    uninterrupt(iter(collected)),
  ]
}

function* transpileBuiltinDef(gensym, input) {
  const [hoist, hoisted] = hoister(gensym)
  const [name] = expect(input, 'symbol')
  const postHoist = [
    'let ',
    ...transpileSymbol(gensym, name),
    '=',
    ...transpileExpr(gensym, input, null, hoist),
    ';',
  ]
  yield* hoisted
  yield* postHoist
  discard(expect(input, ')'))
}

function* transpileBuiltinDo(gensym, input, assign) {
  let buf
  for (const token of input) {
    if (token.kind === ')') {
      if (buf) {
        // final expression gets the assign
        yield* transpileExpr(gensym, buf, assign)
        yield ';'
      }
      return
    }
    if (buf) {
      yield* transpileExpr(gensym, buf)
      yield ';'
    }
    buf = iter(collectForm(prepend(token, input)))
  }
  throw new Error('unterminated list')
}

function* transpileDestructure(gensym, input) {
  for (const token of input) {
    switch (token.kind) {
      default:
        throw new Error(
          `unexpected ${token.kind} ${token.value} ${posS(token.pos)}`,
        )
      case 'symbol':
        yield* transpileSymbol(gensym, token)
        return
      case '[':
        yield '['
        for (const inner of input) {
          if (inner.kind === ']') {
            yield ']'
            return
          }
          yield* transpileDestructure(gensym, prepend(inner, input))
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
            throw new Error(`unexpected ${token} ${posS(token.pos)}`)
          }
          const [op] = expect(input, 'symbol')
          switch (op.value) {
            default:
              throw new Error(
                `unexpected destructing op ${op.value} ${posS(op.pos)}`,
              )
            case 'keys':
              discard(expect(input, '['))
              for (const token of input) {
                if (token.kind === ']') {
                  break
                }
                if (token.kind !== 'symbol') {
                  throw new Error(
                    `unexpected key ${token.kind} ${posS(token.pos)}`,
                  )
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
                  throw new Error(
                    `unexpected key ${token.kind} ${posS(token.pos)}`,
                  )
                }
                or[token.value] = [...transpileExpr(gensym, input)]
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
          yield* transpileSymbol(gensym, { value: key })
          if (Object.hasOwn(rename, key)) {
            yield ':'
            yield* transpileSymbol(gensym, { value: rename[key] })
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

function* transpileBuiltinFn(gensym, input) {
  yield 'const '
  const [name] = expect(input, 'symbol')
  yield* transpileSymbol(gensym, name)
  yield '=('
  discard(expect(input, '['))
  for (const token of input) {
    if (token.kind === ']') {
      yield ')'
      break
    }
    yield* transpileDestructure(gensym, prepend(token, input))
    yield ','
  }
  yield '=>{'
  yield* transpileBuiltinDo(gensym, input, 'return ')
  yield '}'
}

function* transpileBuiltinStr(gensym, input, assign, hoist) {
  yield* transpileAssign(gensym, assign)
  let first = true
  for (const token of input) {
    if (token.kind === ')') {
      return
    }
    if (!first) {
      yield '+'
    }
    first = false
    yield* transpileExpr(gensym, prepend(token, input), null, hoist)
  }
}

function* transpileBuiltinLet(gensym, input, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinLet, input)
    return
  }

  const [hoistChild, hoisted] = hoister(gensym)
  discard(expect(input, '['))
  const postHoist = ['{']
  for (const token of input) {
    if (token.kind === ']') {
      break
    }

    // for non destructuring (simple) assignments, use symbol directly.
    // for destructuring, store the transpiled code and assign to temporary.
    let sym
    let destructing
    if (token.kind === 'symbol') {
      sym = [...transpileSymbol(gensym, token)]
    } else {
      sym = [...transpileSymbol(gensym, gensym())]
      destructing = [...transpileDestructure(gensym, prepend(token, input))]
    }

    // declare the simple symbol
    postHoist.push('let ', ...sym, ';')

    // assign to simple symbol
    const assign = [...sym, '=']
    postHoist.push(...transpileExpr(gensym, input, assign, hoistChild), ';')

    // if destructuring, then we need to assign our generated symbol now
    if (destructing) {
      postHoist.push('let ', ...destructing, '=', ...sym, ';')
    }
  }
  yield* hoisted
  yield* postHoist
  yield* transpileBuiltinDo(gensym, input, assign)
  yield '}'
}

function* transpileBuiltinThrow(gensym, input, _assign, hoist) {
  yield 'throw '
  yield* transpileExpr(gensym, input, null, hoist)
  discard(expect(input, ')'))
  yield ';'
}

function* transpileBuiltinFor(gensym, input, _assign, hoist) {
  discard(expect(input, '['))
  const [binding] = expect(input, 'symbol')
  yield 'for(let '
  yield* transpileSymbol(gensym, binding)
  yield '='
  yield* transpileExpr(gensym, input, null, hoist)
  yield ';'
  yield* transpileSymbol(gensym, binding)
  yield '<'
  yield* transpileExpr(gensym, input, null, hoist)
  yield ';'
  yield* transpileSymbol(gensym, binding)
  const { value: token, done } = input.next()
  if (done) {
    throw new Error('unfinished for')
  }
  if (token.kind === ']') {
    yield '++'
  } else {
    yield '+='
    yield* transpileExpr(gensym, prepend(token, input), null, hoist)
    discard(expect(input, ']'))
  }
  yield '){'
  for (const token of input) {
    if (token.kind === ')') {
      yield '}'
      return
    }
    yield* transpileExpr(gensym, prepend(token, input))
    yield ';'
  }
  throw new Error('unfinished for')
}

function* transpileBuiltinIf(gensym, input, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinIf, input, hoist)
    return
  }

  let first = true
  for (const token of input) {
    if (token.kind === ')') {
      yield '}'
      return
    }

    // could be the final default clause, or another condition to match. buffer
    // the form and decide based on the next token.
    const buf = iter(collectForm(prepend(token, input)))

    const { value: expr, done } = input.next()
    if (done) {
      throw new Error('unterminated list')
    }

    // path for final else clause
    if (expr.kind === ')') {
      yield 'else{'
      yield* transpileExpr(gensym, buf, assign)
      yield '}'
      return
    }

    if (first) {
      first = false
    } else {
      yield 'else '
    }
    yield 'if('
    yield* transpileExpr(gensym, buf, null, hoist)
    yield '){'
    yield* transpileExpr(gensym, prepend(expr, input), assign)
    yield '}'
  }
}

function* transpileBuiltinCase(gensym, input, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinCase, input)
    return
  }

  yield 'switch ('
  yield* transpileExpr(gensym, input)
  yield '){'
  for (const token of input) {
    if (token.kind === ')') {
      yield '}'
      return
    }

    // could be the final default clause, or another case to match. buffer the
    // form and decide based on the next token.
    const buf = iter(collectForm(prepend(token, input)))

    const { value: expr, done } = input.next()
    if (done) {
      throw new Error('unterminated list')
    }

    // path for final default clause
    if (expr.kind === ')') {
      yield 'default:'
      yield* transpileExpr(gensym, buf, assign)
      yield ';'
      if (assign !== 'return ') {
        yield 'break'
      }
      yield '}'
      return
    }

    yield 'case '
    yield* transpileExpr(gensym, buf)
    yield ':'
    yield* transpileExpr(gensym, prepend(expr, input), assign)
    yield ';'
    if (assign !== 'return ') {
      yield 'break;'
    }
  }
}

const builtins = {
  import: transpileBuiltinImport,
  def: transpileBuiltinDef,
  fn: transpileBuiltinFn,
  str: transpileBuiltinStr,
  let: transpileBuiltinLet,
  throw: transpileBuiltinThrow,
  for: transpileBuiltinFor,
  case: transpileBuiltinCase,
  do: transpileBuiltinDo,
  if: transpileBuiltinIf,
}

function* transpileList(gensym, input, assign, hoist) {
  const [token] = expect(input, 'symbol')
  const builtin = builtins[token.value]
  if (builtin) {
    yield* builtin(gensym, input, assign, hoist)
    return
  }

  // function or method call
  const [hoistChild, hoisted] = hoister(gensym)
  const postHoist = [...transpileAssign(gensym, assign)]
  if (token.value.startsWith('.')) {
    postHoist.push(...transpileExpr(gensym, input, null, hoistChild))
  }
  postHoist.push(...transpileSymbol(gensym, token), '(')
  for (let token of input) {
    if (token.kind === ')') {
      yield* hoisted
      yield* postHoist
      yield ')'
      return
    }
    postHoist.push(
      ...transpileExpr(gensym, prepend(token, input), null, hoistChild),
      ',',
    )
  }
  throw new Error('unterminated list')
}

function* transpileKeyword(gensym, input) {
  const [token] = expect(input, 'symbol')
  yield* transpileString(gensym, token)
}

function* transpileString(gensym, token) {
  yield '"'
  yield token.value
  yield '"'
}

function* transpileSymbol(gensym, token) {
  yield token.value
}

function* transpileAssign(gensym, assign) {
  if (assign) {
    yield* assign
  }
}

function* transpileExpr(gensym, input, assign, hoist) {
  const { value: token, done } = input.next()
  if (done) {
    return false
  }

  // list will handle it's own assign, all others are expressions
  if (token.kind === '(') {
    yield* transpileList(gensym, input, assign, hoist)
    return
  }

  yield* transpileAssign(gensym, assign)
  switch (token.kind) {
    case '{':
      yield* transpileMap(gensym, input, hoist)
      break
    case '[':
      yield* transpileArray(gensym, input, hoist)
      break
    case ':':
      yield* transpileKeyword(gensym, input)
      break
    case 'string':
      yield* transpileString(gensym, token)
      break
    case 'symbol':
      yield* transpileSymbol(gensym, token)
      break
    default:
      throw new Error(`unhandled token: ${token.kind} ${posS(token.pos)}`)
  }
  return true
}

export function* transpile(code) {
  const input = uninterrupt(tokens(code))
  const gensym = newGensym()
  // yield* each expression, and use the final return (from transpileExpr) to
  // decide if we should continue. this return is setup to return false when the
  // input iterator stops producing tokens.
  while (yield* transpileExpr(gensym, input)) {}
}
