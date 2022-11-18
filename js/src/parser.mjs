const single = ['(', ')', '[', ']', '{', '}', '@', '#', ':', "'", '~', '`', ',']
const whitespace = [' ', '\r', '\n', '\t']

const err = (expected, offset) => `expected ${expected} at position ${offset}`

const posS = pos =>
  `on line ${pos.line + 1} column ${pos.column + 1} at offset ${pos.offset + 1}`

const newCtx = () => {
  let _gensym = 0
  return {
    gensym() {
      return { kind: 'symbol', value: `gensym__${_gensym++}`, pos: {} }
    },
  }
}

const readString = (input, len, pos) => {
  let buf = []
  let start = pos.offset + 1
  for (let end = start; end < len; end++) {
    pos.offset++
    pos.column++
    switch (input[end]) {
      case '"':
        pos.offset++
        pos.column++
        if (buf.length === 0) {
          return input.substring(start, end)
        } else {
          buf.push(input.substring(start, end))
          return buf.join('')
        }
      case '\n':
        pos.line++
        pos.column = 0
        buf.push(input.substring(start, end), '\\\n')
        start = end + 1
        break
      case '\\':
        end++
        pos.offset++
        if (input[end] === '\n') {
          pos.line++
          pos.column = 0
        } else {
          pos.column += 2
        }
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

function* transpileMap(ctx, input, hoist) {
  yield '{'
  for (let token of input) {
    if (token.kind === '}') {
      yield '}'
      return
    }
    yield '['
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    yield ']:'
    yield* transpileExpr(ctx, input, null, hoist)
    yield ','
  }
  throw new Error('unterminated map')
}

function* transpileArray(ctx, input, hoist) {
  yield '['
  for (let token of input) {
    if (token.kind === ']') {
      yield ']'
      return
    }
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    yield ','
  }
  throw new Error('unterminated array')
}

function* transpileBuiltinImport(ctx, input) {
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
      yield* transpileSymbol(ctx, name)
      yield ','
    }
    discard(expect(input, ']'))
    yield '} from '
    yield* transpileString(ctx, importPath)
    yield ';'
  }
  throw new Error('unterminated import')
}

const hoister = ctx => {
  const collected = []
  return [
    (transpile, input, hoist) => {
      const sym = [...transpileSymbol(ctx, ctx.gensym())]
      const assign = [...sym, '=']
      collected.push(
        'let ',
        ...sym,
        ';',
        ...transpile(ctx, input, assign, hoist),
      )
      return sym
    },
    uninterrupt(iter(collected)),
  ]
}

function* transpileBuiltinDef(ctx, input) {
  const [hoist, hoisted] = hoister(ctx)
  const [name] = expect(input, 'symbol')
  const postHoist = [
    'let ',
    ...transpileSymbol(ctx, name),
    '=',
    ...transpileExpr(ctx, input, null, hoist),
    ';',
  ]
  yield* hoisted
  yield* postHoist
  discard(expect(input, ')'))
}

function* transpileBuiltinDo(ctx, input, assign) {
  let buf
  for (const token of input) {
    if (token.kind === ')') {
      if (buf) {
        // final expression gets the assign
        yield* transpileExpr(ctx, buf, assign)
        yield ';'
      }
      return
    }
    if (buf) {
      yield* transpileExpr(ctx, buf)
      yield ';'
    }
    buf = iter(collectForm(prepend(token, input)))
  }
  throw new Error('unterminated list')
}

function* transpileDestructure(ctx, input) {
  for (const token of input) {
    switch (token.kind) {
      default:
        throw new Error(
          `unexpected ${token.kind} ${token.value} ${posS(token.pos)}`,
        )
      case 'symbol':
        yield* transpileSymbol(ctx, token)
        return
      case '[':
        yield '['
        for (const inner of input) {
          if (inner.kind === ']') {
            yield ']'
            return
          }
          yield* transpileDestructure(ctx, prepend(inner, input))
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
                or[token.value] = [...transpileExpr(ctx, input)]
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
          yield* transpileSymbol(ctx, { value: key })
          if (Object.hasOwn(rename, key)) {
            yield ':'
            yield* transpileSymbol(ctx, { value: rename[key] })
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

function* transpileBuiltinFn(ctx, input) {
  yield 'const '
  const [name] = expect(input, 'symbol')
  yield* transpileSymbol(ctx, name)
  yield '=('
  discard(expect(input, '['))
  for (const token of input) {
    if (token.kind === ']') {
      yield ')'
      break
    }
    yield* transpileDestructure(ctx, prepend(token, input))
    yield ','
  }
  yield '=>{'
  yield* transpileBuiltinDo(ctx, input, 'return ')
  yield '}'
}

function* transpileBuiltinStr(ctx, input, assign, hoist) {
  yield* transpileAssign(ctx, assign)
  let first = true
  for (const token of input) {
    if (token.kind === ')') {
      return
    }
    if (!first) {
      yield '+'
    }
    first = false
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
  }
}

function* transpileBuiltinLet(ctx, input, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinLet, input)
    return
  }

  const [hoistChild, hoisted] = hoister(ctx)
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
      sym = [...transpileSymbol(ctx, token)]
    } else {
      sym = [...transpileSymbol(ctx, ctx.gensym())]
      destructing = [...transpileDestructure(ctx, prepend(token, input))]
    }

    // declare the simple symbol
    postHoist.push('let ', ...sym, ';')

    // assign to simple symbol
    const assign = [...sym, '=']
    postHoist.push(...transpileExpr(ctx, input, assign, hoistChild), ';')

    // if destructuring, then we need to assign our generated symbol now
    if (destructing) {
      postHoist.push('let ', ...destructing, '=', ...sym, ';')
    }
  }
  yield* hoisted
  yield* postHoist
  yield* transpileBuiltinDo(ctx, input, assign)
  yield '}'
}

function* transpileBuiltinThrow(ctx, input, _assign, hoist) {
  yield 'throw '
  yield* transpileExpr(ctx, input, null, hoist)
  discard(expect(input, ')'))
  yield ';'
}

function* transpileBuiltinFor(ctx, input, _assign, hoist) {
  discard(expect(input, '['))
  const [binding] = expect(input, 'symbol')
  yield 'for(let '
  yield* transpileSymbol(ctx, binding)
  yield '='
  yield* transpileExpr(ctx, input, null, hoist)
  yield ';'
  yield* transpileSymbol(ctx, binding)
  yield '<'
  yield* transpileExpr(ctx, input, null, hoist)
  yield ';'
  yield* transpileSymbol(ctx, binding)
  const { value: token, done } = input.next()
  if (done) {
    throw new Error('unfinished for')
  }
  if (token.kind === ']') {
    yield '++'
  } else {
    yield '+='
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    discard(expect(input, ']'))
  }
  yield '){'
  for (const token of input) {
    if (token.kind === ')') {
      yield '}'
      return
    }
    yield* transpileExpr(ctx, prepend(token, input))
    yield ';'
  }
  throw new Error('unfinished for')
}

function* transpileBuiltinIf(ctx, input, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinIf, input, hoist)
    return
  }

  let first = true
  for (const token of input) {
    if (token.kind === ')') {
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
      yield* transpileExpr(ctx, buf, assign)
      yield '}'
      return
    }

    if (first) {
      first = false
    } else {
      yield 'else '
    }
    yield 'if('
    yield* transpileExpr(ctx, buf, null, hoist)
    yield '){'
    yield* transpileExpr(ctx, prepend(expr, input), assign)
    yield '}'
  }
}

function* transpileBuiltinCase(ctx, input, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinCase, input)
    return
  }

  yield 'switch ('
  yield* transpileExpr(ctx, input)
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
      yield* transpileExpr(ctx, buf, assign)
      yield ';'
      if (assign !== 'return ') {
        yield 'break'
      }
      yield '}'
      return
    }

    yield 'case '
    yield* transpileExpr(ctx, buf)
    yield ':'
    yield* transpileExpr(ctx, prepend(expr, input), assign)
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

function* transpileList(ctx, input, assign, hoist) {
  const [token] = expect(input, 'symbol')
  const builtin = builtins[token.value]
  if (builtin) {
    yield* builtin(ctx, input, assign, hoist)
    return
  }

  // function or method call
  const [hoistChild, hoisted] = hoister(ctx)
  const postHoist = [...transpileAssign(ctx, assign)]
  if (token.value.endsWith('.')) {
    postHoist.push('new ')
    token.value = token.value.slice(0, -1) // drop the tailing .
  } else if (token.value.startsWith('.')) {
    postHoist.push(...transpileExpr(ctx, input, null, hoistChild))
  }
  postHoist.push(...transpileSymbol(ctx, token), '(')
  for (let token of input) {
    if (token.kind === ')') {
      yield* hoisted
      yield* postHoist
      yield ')'
      return
    }
    postHoist.push(
      ...transpileExpr(ctx, prepend(token, input), null, hoistChild),
      ',',
    )
  }
  throw new Error('unterminated list')
}

function* transpileKeyword(ctx, input) {
  const [token] = expect(input, 'symbol')
  yield* transpileString(ctx, token)
}

function* transpileString(ctx, token) {
  yield '"'
  yield token.value
  yield '"'
}

function* transpileSymbol(ctx, token) {
  yield token.value
    .replace('!', '_BANG_')
    .replace('?', '_QMARK_')
    .replace('*', '_STAR_')
    .replace('+', '_PLUS_')
    .replace('>', '_GT_')
    .replace('<', '_LT_')
    .replace('=', '_EQ_')
    .replace(/-(.)/, (_match, c) => c.toUpperCase())
}

function* transpileAssign(ctx, assign) {
  if (assign) {
    yield* assign
  }
}

function* transpileExpr(ctx, input, assign, hoist) {
  const { value: token, done } = input.next()
  if (done) {
    return false
  }

  // list will handle it's own assign, all others are expressions
  if (token.kind === '(') {
    yield* transpileList(ctx, input, assign, hoist)
    return
  }

  yield* transpileAssign(ctx, assign)
  switch (token.kind) {
    case 'comment':
      break
    case '{':
      yield* transpileMap(ctx, input, hoist)
      break
    case '[':
      yield* transpileArray(ctx, input, hoist)
      break
    case ':':
      yield* transpileKeyword(ctx, input)
      break
    case 'string':
      yield* transpileString(ctx, token)
      break
    case 'symbol':
      yield* transpileSymbol(ctx, token)
      break
    default:
      throw new Error(`unhandled token: ${token.kind} ${posS(token.pos)}`)
  }
  return true
}

export function* transpile(code) {
  const input = uninterrupt(tokens(code))
  const ctx = newCtx()
  // yield* each expression, and use the final return (from transpileExpr) to
  // decide if we should continue. this return is setup to return false when the
  // input iterator stops producing tokens.
  while (yield* transpileExpr(ctx, input)) {}
}
