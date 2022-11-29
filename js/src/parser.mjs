const symbolBreaker = ['(', ')', '[', ']', '{', '}']
const single = [...symbolBreaker, '@', '#', ':', "'", '~', '`', ',']
const whitespace = [' ', '\r', '\n', '\t']

const builtinMacros = `
(macro array? [v]
  '(Array.isArray ,v))

(macro when [cond ...body]
  '(if ,cond
     (do ,...body)))

(macro -> [v ...forms]
  (.reduce forms
           (fn [c f]
             (if (array? f)
               (do
                 (.splice f 1 0 c)
                 f)
               '(,f ,c)))
           v))

`

const err = (ctx, { pos = {} }, msg) => {
  const e = Error(
    `${ctx.filename ?? '<anonymous>'}:${pos.line + 1}:${
      pos.column + 1
    }: ${msg}`,
  )
  e.pos = pos
  return e
}

const bindings = initial => {
  return {
    scopes: [{}, initial],
    push() {
      this.scopes.unshift({})
    },
    pop() {
      this.scopes.shift()
    },
    add(name, value) {
      this.scopes[0][name] = value ?? true
    },
    get(name) {
      for (const scope of this.scopes) {
        const binding = scope[name]
        if (binding) {
          return binding
        }
      }
    },
  }
}

const newCtx = (config, macros) => {
  let gensym = 0
  return {
    ...config,
    bindings: bindings(builtins),
    macros: bindings(macros),
    gensym() {
      return { kind: 'symbol', value: `gensym__${gensym++}`, pos: {} }
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
  let end
  for (end = start; end < len; end++) {
    const c = input[end]
    if (c === '\n') {
      pos.line++
      pos.column = 0
    }
    if (symbolBreaker.includes(c) || whitespace.includes(c)) {
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

const setKind = (o, kind, { pos }) => {
  Object.defineProperty(o, 'kind', {
    value: kind,
    enumerable: false,
  })
  Object.defineProperty(o, 'pos', {
    value: pos,
    enumerable: false,
  })
  return o
}

function* astUntil(ctx, input, kind) {
  for (const token of input) {
    if (token.kind === kind) {
      return
    }
    yield astOne(ctx, prepend(token, input))
  }
  throw err(ctx, ctx, 'unterminated form')
}

const astNeedOne = (ctx, input) => {
  const node = astOne(ctx, input)
  if (!node) {
    throw err(ctx, ctx, 'unterminated form')
  }
  return node
}

const astShorthand = (ctx, token, special, input) =>
  setKind(
    [
      { kind: 'symbol', pos: token.pos, value: special },
      astNeedOne(ctx, input),
    ],
    'list',
    token,
  )

const astOne = (ctx, input) => {
  const { value, done } = input.next()
  if (done) {
    return
  }
  switch (value.kind) {
    case 'comment':
      return value
    case 'string':
      return value
    case 'symbol':
      return value
    case '(':
      return setKind([...astUntil(ctx, input, ')')], 'list', value)
    case '[':
      return setKind([...astUntil(ctx, input, ']')], 'array', value)
    case '{':
      const o = setKind([...astUntil(ctx, input, '}')], 'object', value)
      if (o.length % 2 === 1) {
        throw err(
          ctx,
          value,
          'object literal must contain even number of forms',
        )
      }
      return o
    case '`':
      return astShorthand(ctx, value, 'quote', input)
    case "'":
      return astShorthand(ctx, value, 'quote', input)
    case ',':
      return astShorthand(ctx, value, 'unquote', input)
    case '@':
      return astShorthand(ctx, value, 'await', input)
    case '#':
      return astShorthand(ctx, value, 'hash', input)
    case ':':
      const sym = astNeedOne(ctx, input)
      if (sym.kind !== 'symbol') {
        throw err(ctx, value, 'invalid keyword')
      }
      sym.kind = 'string'
      return sym
  }
  /* c8 ignore next */
  throw err(ctx, value, `unknown token ${value.kind}`)
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

const prepend = (one, rest) =>
  uninterrupt(
    (function* () {
      yield one
      yield* rest
    })(),
  )

const hoister = ctx => {
  const collected = []
  const hoist = (transpile, node) => {
    const sym = [...transpileNodeSymbol(ctx, ctx.gensym())]
    const assign = [...sym, '=']
    collected.push('let ', ...sym, ';', ...transpile(ctx, node, assign, hoist))
    return sym
  }
  return [hoist, collected]
}

const hoistable = transpile =>
  function* transpileHoistable(ctx, node, assign) {
    const [hoist, hoisted] = hoister(ctx)
    const postHoist = [...transpile(ctx, node, assign, hoist)]
    yield* hoisted
    yield* postHoist
  }

const splitter = s => {
  let first = true
  return () => {
    while (true) {
      if (first) {
        first = false
        return ''
      } else {
        return s
      }
    }
  }
}

function* transpileNodeObject(ctx, node, hoist) {
  yield '{'
  for (let i = 0; i < node.length; i += 2) {
    yield '['
    yield* transpileNode(ctx, node[i], null, hoist)
    yield ']:'
    yield* transpileNode(ctx, node[i + 1], null, hoist)
    yield ','
  }
  yield '}'
}

function* transpileNodeArray(ctx, node, hoist) {
  yield '['
  for (const i of node) {
    yield* transpileNode(ctx, i, null, hoist)
    yield ','
  }
  yield ']'
}

function* transpileNodeString(ctx, token) {
  yield '"'
  yield token.value
  yield '"'
}

const mangleSym = sym =>
  sym
    .replace('!', '_BANG_')
    .replace('?', '_QMARK_')
    .replace('*', '_STAR_')
    .replace('+', '_PLUS_')
    .replace('>', '_GT_')
    .replace('<', '_LT_')
    .replace('=', '_EQ_')
    .replace(/-(.)/g, (_match, c) => c.toUpperCase())

function* transpileNodeSymbol(ctx, token) {
  yield mangleSym(token.value)
}

function* transpileSpecialAssign(ctx, assign) {
  if (assign) {
    yield* assign
  }
}

function* transpileNode(ctx, node, assign, hoist) {
  // completely ignore comments
  if (node.kind === 'comment') {
    return
  }

  // list will handle it's own assign, all others are expressions
  if (node.kind === 'list') {
    yield* transpileNodeList(ctx, node, assign, hoist)
    return
  }

  yield* transpileSpecialAssign(ctx, assign)
  switch (node.kind) {
    case 'object':
      yield* transpileNodeObject(ctx, node, hoist)
      break
    case 'array':
      yield* transpileNodeArray(ctx, node, hoist)
      break
    case 'string':
      yield* transpileNodeString(ctx, node)
      break
    case 'symbol':
      yield* transpileNodeSymbol(ctx, node)
      break
    /* c8 ignore next */
    default:
      /* c8 ignore next */
      throw err(ctx, node, `unhandled node "${node.kind}"`)
  }
}
const transpileNodeHoist = hoistable(transpileNode)

function* transpileBuiltinImportOne(ctx, node) {
  const outer = []
  const inner = []
  for (let i = 1; i < node.length; i++) {
    const c = node[i]
    switch (c.kind) {
      default:
        throw err(ctx, c, 'unexpected import')
      case 'array':
        // list of simple names to import
        for (const name of c) {
          inner.push(mangleSym(name.value))
        }
        break
      case 'symbol':
        // default import
        outer.push(mangleSym(c.value))
        break
      case 'string':
        // :as
        if (c.value !== 'as') {
          throw err(ctx, c, 'unexpected import')
        }
        const next = node[++i]
        outer.push('* as ' + mangleSym(next.value))
        break
      case 'object':
        // rename
        for (let i = 0; i < c.length; i += 2) {
          inner.push(mangleSym(c[i].value) + ' as ' + mangleSym(c[i + 1].value))
        }
        break
    }
  }
  yield 'import '
  yield* outer.join(',')
  if (inner.length !== 0) {
    if (outer.length !== 0) {
      yield ','
    }
    yield '{'
    yield inner.join(',')
    yield '}'
  }
  if (inner.length !== 0 || outer.length !== 0) {
    yield ' from '
  }
  yield* transpileNodeString(ctx, node[0])
  yield ';'
}

function* transpileBuiltinImport(ctx, node) {
  for (let i = 1; i < node.length; i++) {
    yield* transpileBuiltinImportOne(ctx, node[i])
  }
}

const transpileBuiltinDef = hoistable(function* transpileBuiltinDef(
  ctx,
  node,
  assign,
  hoist,
) {
  ctx.bindings.add(node[1].value)
  yield node[0].value
  yield ' '
  yield* transpileNodeSymbol(ctx, node[1])
  yield '='
  yield* transpileNode(ctx, node[2], null, hoist)
  yield ';'
})

const transpileSpecialBody = hoistable(function* transpileSpecialBody(
  ctx,
  node,
  assign,
  hoist,
) {
  for (let i = 0; i < node.length; i++) {
    let a
    if (i === node.length - 1) {
      a = assign
    }
    yield* transpileNode(ctx, node[i], a, hoist)
    yield ';'
  }
})

function* transpileBuiltinDo(ctx, node, assign) {
  yield* transpileSpecialBody(ctx, node.slice(1), assign)
}

function* transpileSpecialDestructure(ctx, node) {
  switch (node.kind) {
    default:
      throw err(ctx, node, `unexpected destructure "${node.kind}"`)
    case 'symbol':
      ctx.bindings.add(node.name)
      yield* transpileNodeSymbol(ctx, node)
      break
    case 'array':
      yield '['
      for (const inner of node) {
        yield* transpileSpecialDestructure(ctx, inner)
        yield ','
      }
      yield ']'
      break
    case 'object':
      const keys = []
      const rename = {}
      const or = {}
      for (let i = 0; i < node.length; i += 2) {
        let key = node[i]
        let value = node[i + 1]
        if (key.kind === 'symbol') {
          rename[key.value] = value.value
          if (!keys.includes(key.value)) {
            keys.push(key.value)
          }
          continue
        }
        switch (key.value) {
          default:
            throw err(
              ctx,
              node[i],
              `unexpected destructuring map op "${key.value}"`,
            )
          case 'keys':
            for (const inner of value) {
              keys.push(inner.value)
            }
            break
          case 'or':
            for (let j = 0; j < value.length; j += 2) {
              or[value[j].value] = [...transpileNode(ctx, value[j + 1])]
              if (!keys.includes(value[j].value)) {
                keys.push(value[j].value)
              }
            }
            break
        }
      }
      yield '{'
      const comma = splitter(',')
      for (const key of keys) {
        yield comma()
        yield mangleSym(key)
        if (Object.hasOwn(rename, key)) {
          yield ':'
          yield mangleSym(rename[key])
          ctx.bindings.add(rename[key])
        } else {
          ctx.bindings.add(key)
        }
        if (Object.hasOwn(or, key)) {
          yield '='
          yield* or[key]
        }
      }
      yield '}'
      break
  }
}

function* transpileSpecialFnArgs(ctx, node) {
  const comma = splitter(',')
  yield '('
  for (const i of node) {
    yield comma()
    yield* transpileSpecialDestructure(ctx, i)
  }
  yield ')'
}

const makeFnTranspiler = (preArgs, postArgs) =>
  function* transpileBuiltinFn(ctx, node) {
    let [, args, ...rest] = node
    if (args.kind === 'symbol') {
      yield 'const '
      ctx.bindings.add(args.value)
      yield* transpileNodeSymbol(ctx, args)
      yield '='
      ;[, , args, ...rest] = node
    }
    yield preArgs
    yield* transpileSpecialFnArgs(ctx, args)
    yield postArgs
    yield '{'
    yield* transpileSpecialBody(ctx, rest, 'return ')
    yield '}'
  }

const transpileBuiltinFnArrow = makeFnTranspiler('', '=>')
const transpileBuiltinFnArrowAsync = makeFnTranspiler('async', '=>')
const transpileBuiltinFnGenerator = makeFnTranspiler('function*', '')
const transpileBuiltinFnAsyncGenerator = makeFnTranspiler('async function*', '')

function* transpileBuiltinOp(ctx, node, assign, hoist) {
  yield* transpileSpecialAssign(ctx, assign)
  const sp = splitter(node[0].value)
  for (let i = 1; i < node.length; i++) {
    yield sp()
    yield* transpileNode(ctx, node[i], null, hoist)
  }
}

function* transpileBuiltinOpUnary(ctx, node, assign, hoist) {
  yield* transpileSpecialAssign(ctx, assign)
  if (node.length === 2) {
    yield node[0].value
  }
  const sp = splitter(node[0].value)
  for (let i = 1; i < node.length; i++) {
    yield sp()
    yield* transpileNode(ctx, node[i], null, hoist)
  }
}

function* transpileBuiltinStr(ctx, node, assign, hoist) {
  yield* transpileSpecialAssign(ctx, assign)
  const sp = splitter('+')
  for (let i = 1; i < node.length; i++) {
    yield sp()
    yield* transpileNode(ctx, node[i], null, hoist)
  }
}

function* transpileBuiltinCmp(ctx, node, assign, hoist) {
  yield* transpileSpecialAssign(ctx, assign)
  yield* transpileNode(ctx, node[1], null, hoist)
  const op = node[0].value
  yield op === '=' ? '===' : op
  yield* transpileNode(ctx, node[2], null, hoist)
}

function* transpileBuiltinLet(ctx, node, assign, hoist) {
  if (node[1].kind === 'symbol') {
    yield* transpileBuiltinDef(ctx, node, assign, hoist)
    return
  }
  yield* transpileBuiltinLetMulti(ctx, node, assign, hoist)
}

function* transpileBuiltinLetMulti(ctx, node, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinLetMulti, node)
    return
  }

  ctx.bindings.push()
  yield '{'
  for (let i = 0; i < node[1].length; i += 2) {
    const binding = node[1][i]
    // for non destructuring (simple) assignments, use symbol directly.
    // for destructuring, assign to gensym first.
    let sym
    if (binding.kind === 'symbol') {
      ctx.bindings.add(binding.value)
      sym = [...transpileNodeSymbol(ctx, binding)]
    } else {
      sym = [...transpileNodeSymbol(ctx, ctx.gensym())]
    }

    // declare the simple symbol
    yield 'let '
    yield* sym
    yield ';'

    // assign to simple symbol
    const assign = [...sym, '=']
    yield* transpileNodeHoist(ctx, node[1][i + 1], assign, hoist)
    yield ';'

    // if destructuring, then we need to assign our generated symbol now
    if (binding.kind !== 'symbol') {
      yield 'let '
      yield* transpileSpecialDestructure(ctx, binding)
      yield '='
      yield* sym
      yield ';'
    }
  }
  yield* transpileSpecialBody(ctx, node.slice(2), assign)
  yield '}'
  ctx.bindings.pop()
}

function* transpileBuiltinKeywordExpr(ctx, node, assign, hoist) {
  yield* transpileSpecialAssign(ctx, assign)
  yield node[0].value
  if (node.length !== 1) {
    yield ' '
    yield* transpileNode(ctx, node[1], null, hoist)
  }
}

function* transpileBuiltinKeywordStatement(ctx, node, _assign, hoist) {
  if (node.length === 1) {
    yield node[0].value
  } else {
    yield* transpileNode(ctx, node[1], [node[0].value, ' '], hoist)
  }
}

function* transpileBuiltinFor(ctx, node, _assign, hoist) {
  const binding = node[1]
  yield 'for(let '
  yield* transpileNode(ctx, binding[0])
  yield '='
  yield* transpileNode(ctx, binding[1], null, hoist)
  yield ';'
  yield* transpileNode(ctx, binding[0])
  yield '<'
  yield* transpileNode(ctx, binding[2], null, hoist)
  yield ';'
  yield* transpileNode(ctx, binding[0])
  if (binding.length === 3) {
    yield '++'
  } else {
    yield '+='
    yield* transpileNode(ctx, binding[3], null, hoist)
  }
  yield '){'
  yield* transpileSpecialBody(ctx, node.slice(2))
  yield '}'
}

const makeForTranspiler = (prefix, middle) =>
  function* transpileBuiltinForSpecial(ctx, node, _assign, hoist) {
    const binding = node[1]
    yield prefix
    yield '(let '
    yield* transpileNode(ctx, binding[0])
    yield ' '
    yield middle
    yield ' '
    yield* transpileNode(ctx, binding[1], null, hoist)
    yield '){'
    yield* transpileSpecialBody(ctx, node.slice(2))
    yield '}'
  }

const transpileBuiltinForOf = makeForTranspiler('for', 'of')
const transpileBuiltinForIn = makeForTranspiler('for', 'in')
const transpileBuiltinForAwait = makeForTranspiler('for await', 'of')

function* transpileBuiltinIf(ctx, node, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinIf, node)
    return
  }

  const elif = splitter('else ')
  const finalElse = node.length % 2 === 0
  for (let i = 1; i < node.length; i += 2) {
    if (finalElse && i === node.length - 1) {
      yield 'else{'
      yield* transpileNodeHoist(ctx, node[i], assign)
      yield '}'
      return
    }
    yield elif()
    yield 'if('
    yield* transpileNode(ctx, node[i], null, hoist)
    yield '){'
    yield* transpileNodeHoist(ctx, node[i + 1], assign)
    yield '}'
  }
}

function* transpileBuiltinCase(ctx, node, assign, hoist) {
  if (!assign && hoist) {
    yield* hoist(transpileBuiltinCase, node)
    return
  }

  const finalDefault = node.length % 2 === 1
  yield 'switch ('
  yield* transpileNode(ctx, node[1], null, hoist)
  yield '){'
  for (let i = 2; i < node.length; i += 2) {
    if (finalDefault && i === node.length - 1) {
      yield 'default:'
      yield* transpileNodeHoist(ctx, node[i], assign)
      yield ';'
      if (assign !== 'return ') {
        yield 'break'
      }
      yield '}'
      return
    }

    yield 'case '
    yield* transpileNode(ctx, node[i], null, hoist)
    yield ':'
    yield* transpileNodeHoist(ctx, node[i + 1], assign)
    yield ';'
    if (assign !== 'return ') {
      yield 'break;'
    }
  }
  yield '}'
}

function* transpileBuiltinDot(ctx, node, assign, hoist) {
  yield* transpileSpecialAssign(ctx, assign)
  yield* transpileNode(ctx, node[1])
  for (let i = 2; i < node.length; i++) {
    yield '['
    yield* transpileNode(ctx, node[i], null, hoist)
    yield ']'
  }
}

function* transpileHashLambda(ctx, node) {
  const args = []
  const argMap = n => {
    if (Array.isArray(n)) {
      n.forEach(argMap)
      return
    }
    if (n.kind !== 'symbol') {
      return
    }
    let arg
    if (n.value === '$') {
      arg = 0
    } else if (n.value.startsWith('$')) {
      arg = parseInt(n.value.slice(1), 10) - 1
    } else {
      return
    }
    n.value = (args[arg] ?? (args[arg] = ctx.gensym())).value
  }
  argMap(node[1])

  const comma = splitter(',')
  yield '('
  for (const arg of args) {
    yield comma()
    yield* transpileNode(ctx, arg)
  }
  yield ')=>{'
  yield* transpileSpecialBody(ctx, node[1], 'return ')
  yield '}'
}

function* transpileBuiltinHash(ctx, node) {
  if (node[1].kind === 'list') {
    yield* transpileHashLambda(ctx, node)
    return
  }
  throw err(ctx, ctx, `unexpected hash "${node[1].kind}"`)
}

function* serializeNode(node) {
  if (Array.isArray(node)) {
    if (node[0].value === 'unquote') {
      yield node[1].value
      return
    }

    yield 'Object.defineProperties(['
    for (const i of node) {
      yield* serializeNode(i)
      yield ','
    }
    yield '],'
    yield JSON.stringify({
      kind: {
        value: node.kind,
        enumerable: false,
      },
      pos: {
        value: node.pos,
        enumerable: false,
      },
    })
    yield ')'
    return
  }
  yield JSON.stringify(node)
}

function* transpileBuiltinQuote(ctx, node, assign) {
  yield* transpileSpecialAssign(ctx, assign)
  yield* serializeNode(node[1])
}

function* transpileSpecialMacro(ctx, node) {
  const args = node[2].map(v =>
    [...transpileSpecialDestructure(ctx, v)].join(''),
  )
  ctx.macros.add(
    node[1].value,
    new Function(
      '_macroName',
      ...args,
      [...transpileSpecialBody(ctx, node.slice(3), 'return ')].join(''),
    ),
  )
}

const builtins = {
  import: transpileBuiltinImport,
  const: transpileBuiltinDef,
  var: transpileBuiltinDef,
  fn: transpileBuiltinFnArrow,
  'fn@': transpileBuiltinFnArrowAsync,
  'fn*': transpileBuiltinFnGenerator,
  'fn@*': transpileBuiltinFnAsyncGenerator,
  str: transpileBuiltinStr,
  '+': transpileBuiltinOpUnary,
  '-': transpileBuiltinOpUnary,
  '*': transpileBuiltinOp,
  '/': transpileBuiltinOp,
  '**': transpileBuiltinOp,
  '%': transpileBuiltinOp,
  '=': transpileBuiltinCmp,
  '==': transpileBuiltinCmp,
  '<': transpileBuiltinCmp,
  '>': transpileBuiltinCmp,
  '<=': transpileBuiltinCmp,
  '>=': transpileBuiltinCmp,
  let: transpileBuiltinLet,
  throw: transpileBuiltinKeywordStatement,
  return: transpileBuiltinKeywordStatement,
  yield: transpileBuiltinKeywordExpr,
  'yield*': transpileBuiltinKeywordExpr,
  break: transpileBuiltinKeywordStatement,
  continue: transpileBuiltinKeywordStatement,
  await: transpileBuiltinKeywordExpr,
  for: transpileBuiltinFor,
  'for@': transpileBuiltinForAwait,
  'for-of': transpileBuiltinForOf,
  'for-in': transpileBuiltinForIn,
  case: transpileBuiltinCase,
  do: transpileBuiltinDo,
  if: transpileBuiltinIf,
  '.': transpileBuiltinDot,
  typeof: transpileTypeof,
  'set!': transpileSet,
  hash: transpileBuiltinHash,
  quote: transpileBuiltinQuote,
  macro: transpileSpecialMacro,
}

const macros = (() => {
  const ctx = newCtx({}, {})
  const input = uninterrupt(tokens(ctx, builtinMacros))
  while (true) {
    const node = astOne(ctx, input)
    if (!node) {
      return ctx.macros.scopes[0]
    }
    ;[...transpileNodeHoist(ctx, node)]
  }
})()

// function, method or constructor call
function* transpileSpecialCall(ctx, node, assign, hoist) {
  yield* transpileSpecialAssign(ctx, assign)
  let argStart = 1
  if (node[0].kind === 'symbol') {
    const call = node[0].value
    if (call.endsWith('.')) {
      yield 'new '
      yield mangleSym(call.slice(0, -1)) // drop the tailing .
    } else if (call.startsWith('.')) {
      yield* transpileNode(ctx, node[1], null, hoist)
      yield mangleSym(call)
      argStart = 2
    } else {
      yield mangleSym(call)
    }
  } else {
    yield* transpileNode(ctx, node[0], null, hoist)
  }
  const comma = splitter(',')
  yield '('
  for (let i = argStart; i < node.length; i++) {
    yield comma()
    yield* transpileNode(ctx, node[i], null, hoist)
  }
  yield ')'
}

function* transpileNodeList(ctx, node, assign, hoist) {
  const call = node[0].value
  const binding = ctx.bindings.get(call)
  if (binding === true) {
    yield* transpileSpecialCall(ctx, node, assign, hoist)
    return
  }
  if (binding) {
    yield* binding(ctx, node, assign, hoist)
    return
  }
  const macro = ctx.macros.get(call)
  if (macro) {
    yield* transpileNode(ctx, macro(...node), assign, hoist)
    return
  }
  yield* transpileSpecialCall(ctx, node, assign, hoist)
}

function* transpileTypeof(ctx, node, assign, hoist) {
  yield 'typeof '
  yield* transpileNode(ctx, node[1], assign, hoist)
}

function* transpileSet(ctx, node, assign, hoist) {
  yield* transpileNode(ctx, node[1], assign, hoist)
  yield '='
  yield* transpileNode(ctx, node[2], assign, hoist)
}

export function* transpile(code, config) {
  const ctx = newCtx(config, macros)
  const input = uninterrupt(tokens(ctx, code))
  while (true) {
    const node = astOne(ctx, input)
    if (!node) {
      return
    }
    yield* transpileNodeHoist(ctx, node)
    yield ';'
  }
}
