const single = ['(', ')', '[', ']', '{', '}', '@', '#', ':', "'", '~', '`', ',']
const whitespace = [' ', '\r', '\n', '\t']
const pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
}
const plusOnes = ['@', '#', ':', "'", '~', '`', ',']

const err = (ctx, { pos = {} }, msg) => {
  const e = Error(
    `${ctx.filename ?? '<anonymous>'}:${pos.line + 1}:${
      pos.column + 1
    }: ${msg}`,
  )
  e.pos = pos
  return e
}

const newCtx = config => {
  let _gensym = 0
  return {
    ...config,
    gensym() {
      return { kind: 'symbol', value: `gensym__${_gensym++}`, pos: {} }
    },
  }
}

const readString = (ctx, input, len, pos) => {
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
  throw err(ctx, { pos }, 'unterminated string')
}

const readSymbol = (ctx, input, len, pos) => {
  let start = pos.offset
  if (start === len) {
    throw err(ctx, { pos }, 'expecting symbol')
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

const readEOL = (ctx, input, len, pos) => {
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

export function* tokens(ctx, input) {
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
      ctx.pos = { ...pos }
      yield { kind: c, pos: { ...pos } }
      pos.offset++
      pos.column++
      continue
    }
    switch (c) {
      case '"':
        start = { ...pos }
        value = readString(ctx, input, len, pos)
        ctx.pos = { ...start }
        yield { kind: 'string', value, pos: start }
        break
      case ';':
        start = { ...pos }
        value = readEOL(ctx, input, len, pos)
        ctx.pos = { ...start }
        yield { kind: 'comment', value, pos: start }
        break
      default:
        start = { ...pos }
        value = readSymbol(ctx, input, len, pos)
        ctx.pos = { ...start }
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

function* expect(ctx, input, ...expected) {
  let i = 0
  for (const actual of input) {
    if (actual.kind !== expected[i]) {
      throw err(ctx, actual, `expected ${expected[i]} but got ${actual.kind}`)
    }
    yield actual
    i++
    if (i === expected.length) {
      return
    }
  }
  throw err(ctx, ctx, `input ended while expecting ${expected[i]}`)
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

const hoistable = transpile => {
  return function* transpileHoistable(ctx, input, assign) {
    const [hoist, hoisted] = hoister(ctx)
    const postHoist = [...transpile(ctx, input, assign, hoist)]
    yield* hoisted
    yield* postHoist
  }
}

function* transpileMap(ctx, input, hoist) {
  yield '{'
  for (const token of input) {
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
  throw err(ctx, ctx, 'unterminated map')
}

function* transpileArray(ctx, input, hoist) {
  yield '['
  for (const token of input) {
    if (token.kind === ']') {
      yield ']'
      return
    }
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    yield ','
  }
  throw err(ctx, ctx, 'unterminated array')
}

function* transpileBuiltinImport(ctx, input) {
  for (const token of input) {
    if (token.kind === ')') {
      return
    }
    if (token.kind !== '[') {
      throw err(ctx, token, `expected [`)
    }
    yield 'import {'
    const [importPath] = expect(ctx, input, 'string')
    discard(expect(ctx, input, '['))
    for (const name of input) {
      if (name.kind === ']') {
        break
      }
      if (name.kind !== 'symbol') {
        throw err(ctx, token, `expecting a symbol`)
      }
      yield* transpileSymbol(ctx, name)
      yield ','
    }
    discard(expect(ctx, input, ']'))
    yield '} from '
    yield* transpileString(ctx, importPath)
    yield ';'
  }
  throw err(ctx, ctx, 'unterminated import')
}

const transpileBuiltinDef = hoistable(function* transpileBuiltinDef(
  ctx,
  input,
  assign,
  hoist,
) {
  const [name] = expect(ctx, input, 'symbol')
  yield 'let '
  yield* transpileSymbol(ctx, name)
  yield '='
  yield* transpileExpr(ctx, input, null, hoist)
  yield ';'
  discard(expect(ctx, input, ')'))
})

const transpileBuiltinDo = hoistable(function* transpileBuiltinDo(
  ctx,
  input,
  assign,
  hoist,
) {
  let buf
  for (const token of input) {
    if (token.kind === ')') {
      if (buf) {
        // final expression gets the assign
        yield* transpileExpr(ctx, buf, assign, hoist)
        yield ';'
      }
      return
    }
    if (buf) {
      yield* transpileExpr(ctx, buf, null, hoist)
      yield ';'
    }
    buf = iter(collectForm(prepend(token, input)))
  }
  throw err(ctx, ctx, 'unterminated list')
})

function* transpileDestructure(ctx, input) {
  for (const token of input) {
    switch (token.kind) {
      default:
        throw err(ctx, token, `unexpected ${token.kind} ${token.value}`)
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
            const [, { value: source }] = expect(ctx, input, ':', 'symbol')
            if (source !== token.value) {
              rename[source] = token.value
            }
            if (!keys.includes(source)) {
              keys.push(source)
            }
            continue
          }
          if (token.kind !== ':') {
            throw err(ctx, token, `unexpected ${token.kind}`)
          }
          const [op] = expect(ctx, input, 'symbol')
          switch (op.value) {
            default:
              throw err(ctx, op, `unexpected destructing op ${op.value}`)
            case 'keys':
              discard(expect(ctx, input, '['))
              for (const token of input) {
                if (token.kind === ']') {
                  break
                }
                if (token.kind !== 'symbol') {
                  throw err(ctx, token, `unexpected ${token.kind}`)
                }
                keys.push(token.value)
              }
              break
            case 'or':
              discard(expect(ctx, input, '{'))
              for (const token of input) {
                if (token.kind === '}') {
                  break
                }
                if (token.kind !== 'symbol') {
                  throw err(ctx, token, `unexpected key ${token.kind}`)
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
  const [name] = expect(ctx, input, 'symbol')
  yield* transpileSymbol(ctx, name)
  yield '=('
  discard(expect(ctx, input, '['))
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

const makeOpTranspile = (op, unary) =>
  function* transpileOp(ctx, input, assign, hoist) {
    yield* transpileAssign(ctx, assign)
    let count = 0
    let buf
    for (const token of input) {
      if (token.kind === ')') {
        if (count === 1) {
          if (unary) {
            yield op
          } else {
            throw err(ctx, token, op + ' is not a unary operator')
          }
        }
        if (buf) {
          yield* buf
        }
        return
      }
      if (buf) {
        yield* buf
      }
      if (count !== 0) {
        yield op
      }
      buf = [...transpileExpr(ctx, prepend(token, input), null, hoist)]
      count++
    }
    throw err(ctx, ctx, 'unfinished list')
  }

const transpileBuiltinStr = makeOpTranspile('+')
const transpileBuiltinPlus = makeOpTranspile('+', true)
const transpileBuiltinMinus = makeOpTranspile('-', true)
const transpileBuiltinMul = makeOpTranspile('*')
const transpileBuiltinDiv = makeOpTranspile('/')
const transpileBuiltinPow = makeOpTranspile('**')
const transpileBuiltinMod = makeOpTranspile('%')

const transpileBuiltinLet = hoistable(function* transpileBuiltinLet(
  ctx,
  input,
  assign,
  hoist,
) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinLet, input)
    return
  }

  discard(expect(ctx, input, '['))
  yield '{'
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
    yield 'let '
    yield* sym
    yield ';'

    // assign to simple symbol
    const assign = [...sym, '=']
    yield* transpileExpr(ctx, input, assign, hoist)
    yield ';'

    // if destructuring, then we need to assign our generated symbol now
    if (destructing) {
      yield 'let '
      yield* destructing
      yield '='
      yield* sym
      yield ';'
    }
  }
  yield* transpileBuiltinDo(ctx, input, assign)
  yield '}'
})

const makeKeywordExprTranspile = keyword =>
  hoistable(function* transpileKeywordExpr(ctx, input, _assign, hoist) {
    yield keyword
    const { value: token, done } = input.next()
    if (done) {
      throw err(ctx, ctx, 'unfinished ' + keyword)
    }
    // keyword only statement, like a bare 'return', 'yield' or 'break'
    if (token.kind === ')') {
      yield ';'
      return
    }
    yield ' '
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    yield ';'
    discard(expect(ctx, input, ')'))
  })

const transpileBuiltinThrow = makeKeywordExprTranspile('throw')
const transpileBuiltinReturn = makeKeywordExprTranspile('return')
const transpileBuiltinYield = makeKeywordExprTranspile('yield')
const transpileBuiltinYieldStar = makeKeywordExprTranspile('yield*')
const transpileBuiltinBreak = makeKeywordExprTranspile('break')
const transpileBuiltinContinue = makeKeywordExprTranspile('continue')

function* transpileBuiltinFor(ctx, input, _assign, hoist) {
  discard(expect(ctx, input, '['))
  const [binding] = expect(ctx, input, 'symbol')
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
    throw err(ctx, ctx, 'unfinished for')
  }
  if (token.kind === ']') {
    yield '++'
  } else {
    yield '+='
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    discard(expect(ctx, input, ']'))
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
  throw err(ctx, ctx, 'unfinished for')
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
      throw err(ctx, ctx, 'unterminated list')
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
      throw err(ctx, ctx, 'unterminated list')
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

function* transpileBuiltinDot(ctx, input, assign, hoist) {
  yield* transpileAssign(ctx, assign)
  yield* transpileExpr(ctx, input)
  for (const token of input) {
    if (token.kind === ')') {
      return
    }
    yield '['
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    yield ']'
  }
  throw err(ctx, ctx, 'unfinished list')
}

const builtins = {
  import: transpileBuiltinImport,
  def: transpileBuiltinDef,
  fn: transpileBuiltinFn,
  str: transpileBuiltinStr,
  '+': transpileBuiltinPlus,
  '-': transpileBuiltinMinus,
  '*': transpileBuiltinMul,
  '/': transpileBuiltinDiv,
  '**': transpileBuiltinPow,
  '%': transpileBuiltinMod,
  let: transpileBuiltinLet,
  throw: transpileBuiltinThrow,
  return: transpileBuiltinReturn,
  yield: transpileBuiltinYield,
  'yield*': transpileBuiltinYieldStar,
  break: transpileBuiltinBreak,
  continue: transpileBuiltinContinue,
  for: transpileBuiltinFor,
  case: transpileBuiltinCase,
  do: transpileBuiltinDo,
  if: transpileBuiltinIf,
  '.': transpileBuiltinDot,
}

// function, method or constructor call
function* transpileCall(ctx, input, assign, hoist) {
  const [token] = expect(ctx, input, 'symbol')
  yield* transpileAssign(ctx, assign)
  if (token.value.endsWith('.')) {
    yield 'new '
    token.value = token.value.slice(0, -1) // drop the tailing .
  } else if (token.value.startsWith('.')) {
    yield* transpileExpr(ctx, input, null, hoist)
  }
  yield* transpileSymbol(ctx, token)
  yield '('
  for (const token of input) {
    if (token.kind === ')') {
      yield ')'
      return
    }
    yield* transpileExpr(ctx, prepend(token, input), null, hoist)
    yield ','
  }
  throw err(ctx, ctx, 'unterminated list')
}

function* transpileList(ctx, input, assign, hoist) {
  const [token] = expect(ctx, input, 'symbol')
  const builtin = builtins[token.value]
  if (builtin) {
    yield* builtin(ctx, input, assign, hoist)
    return
  }
  yield* transpileCall(ctx, prepend(token, input), assign, hoist)
}

function* transpileAwait(ctx, input, assign, hoist) {
  yield 'await ('
  yield* transpileExpr(ctx, input, assign, hoist)
  yield ')'
}

function* transpileKeyword(ctx, input) {
  const [token] = expect(ctx, input, 'symbol')
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

  // completely ignore comments
  if (token.kind === 'comment') {
    return true
  }

  // list will handle it's own assign, all others are expressions
  if (token.kind === '(') {
    yield* transpileList(ctx, input, assign, hoist)
    return true
  }

  yield* transpileAssign(ctx, assign)
  switch (token.kind) {
    case '{':
      yield* transpileMap(ctx, input, hoist)
      break
    case '[':
      yield* transpileArray(ctx, input, hoist)
      break
    case ':':
      yield* transpileKeyword(ctx, input)
      break
    case '@':
      yield* transpileAwait(ctx, input)
      break
    case 'string':
      yield* transpileString(ctx, token)
      break
    case 'symbol':
      yield* transpileSymbol(ctx, token)
      break
    default:
      throw err(ctx, token, `unhandled token: ${token.kind}`)
  }
  return true
}

export function* transpile(code, config) {
  const ctx = newCtx(config)
  const input = uninterrupt(tokens(ctx, code))
  // yield* each expression, and use the final return (from transpileExpr) to
  // decide if we should continue. this return is setup to return false when the
  // input iterator stops producing tokens.
  while (yield* transpileExpr(ctx, input)) {}
}
