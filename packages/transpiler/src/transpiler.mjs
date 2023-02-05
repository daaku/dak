import { SourceMapGenerator } from 'source-map-js/lib/source-map-generator.js'

const symbolBreaker = ['(', ')', '[', ']', '{', '}']
const single = [...symbolBreaker, '@', '#', ':', "'", '~', '`', ',']
const whitespace = [' ', '\r', '\n', '\t']

const builtinMacros = `
(macro array? [v]
  '(Array.isArray ,v))

(macro boolean? [v]
  '(= (typeof ,v) :boolean))

(macro object? [v]
  '(= (typeof ,v) :object))

(macro number? [v]
  '(= (typeof ,v) :number))

(macro bigint? [v]
  '(= (typeof ,v) :bigint))

(macro string? [v]
  '(= (typeof ,v) :string))

(macro zero? [v]
  '(= ,v 0))

(macro pos? [v]
  '(> ,v 0))

(macro neg? [v]
  '(< ,v 0))

(macro true? [v]
  '(= ,v true))

(macro false? [v]
  '(= ,v false))

(macro undefined? [v]
  '(= (typeof ,v) :undefined))

(macro defined? [v]
  '(not= (typeof ,v) :undefined))

(macro null? [v]
  '(= ,v null))

(macro inc [v]
  '(+ ,v 1))

(macro dec [v]
  '(- ,v 1))

(macro when [cond ...body]
  '(if ,cond
     (do ,...body)))

(macro -> [v ...forms]
  (.reduce forms
           (fn [c f]
             (if (= f.kind :list)
               (do
                 (.splice f 1 0 c)
                 f)
               '(,f ,c)))
           v))

(macro if-let [[form tst] then el]
  '(let [temp# ,tst]
     (if temp#
       (let [,form temp#]
         ,then)
       ,el)))

(macro when-let [[form tst] ...body]
  '(let [temp# ,tst]
     (if temp#
       (let [,form temp#]
         ,...body))))

(macro doto [x ...forms]
  '(let [gx# ,x]
     ,(... (forms.map #(if (= $.kind :list)
                         '(,(. $ 0) gx# ,(... ($.splice 1)))
                         '(,$ gx#))))
     gx#))
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

const partsStr = gen => {
  const parts = []
  for (const part of gen) {
    parts.push(typeof part === 'string' ? part : part[0])
  }
  return parts.join('')
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
    gensym(prefix = 'gensym') {
      return { kind: 'symbol', value: `${prefix}__${gensym++}`, pos: {} }
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
        buf.push(input.substring(start, end), '\\n')
        start = end + 1
        break
      case '\\':
        end++
        pos.offset++
        if (input[end] === '\n') {
          pos.line++
          pos.column = 0
        } else {
          // TODO: why is this +2?
          pos.column += 2
        }
        break
    }
  }
  throw err(ctx, { pos }, 'unterminated string')
}

const isLetter = c => (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z')

const readRegexp = (ctx, input, len, pos) => {
  let start = pos.offset + 1
  for (let end = start; end < len; end++) {
    pos.offset++
    pos.column++
    switch (input[end]) {
      case '/':
        pos.offset++
        pos.column++
        // flags
        end++
        for (; end < len; end++) {
          if (!isLetter(input[end])) {
            return input.substring(start - 1, end)
          }
          pos.offset++
          pos.column++
        }
      case '\\':
        end++
        pos.offset++
        pos.column++
        break
    }
  }
  throw err(ctx, { pos }, 'unterminated regex')
}

const readSymbol = (ctx, input, len, pos) => {
  let start = pos.offset
  let end
  for (end = start; end < len; end++) {
    const c = input[end]
    if (symbolBreaker.includes(c) || whitespace.includes(c) || c === ';') {
      break
    }
    pos.offset++
    pos.column++
  }
  return input.substring(start, end)
}

const readEOL = (ctx, input, len, pos) => {
  let start = pos.offset
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

function* tokens(ctx, input) {
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
    // shebang is dropped
    if (pos.offset === 0 && c === '#' && input[1] === '!') {
      readEOL(ctx, input, len, pos)
      continue
    }
    if (single.includes(c)) {
      // special case #// for regexp
      if (c === '#' && input[pos.offset + 1] === '/') {
        pos.offset++
        pos.column++
        start = { ...pos }
        value = readRegexp(ctx, input, len, pos)
        ctx.pos = { ...start }
        yield { kind: 'regexp', value, pos: start }
      } else {
        ctx.pos = { ...pos }
        yield { kind: c, pos: { ...pos } }
        pos.offset++
        pos.column++
      }
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
    case 'regexp':
      return value
    case 'symbol':
      return value
    case '(':
      return setKind([...astUntil(ctx, input, ')')], 'list', value)
    case '[':
      return setKind([...astUntil(ctx, input, ']')], 'array', value)
    case '{':
      return setKind([...astUntil(ctx, input, '}')], 'object', value)
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
      sym.pos = value.pos
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

const evExpr = 'evExpr'
const evStat = 'evStat'

const hoister = ctx => {
  const collected = []
  const hoist = (transpile, node, givenAssign) => {
    const sym = [...transpileNodeSymbol(ctx, ctx.gensym('hoist'))]
    const assign = [...sym, '=']
    collected.push(
      'let ',
      ...sym,
      ';',
      ...transpile(ctx, node, assign, hoist, evStat),
      ';',
    )
    return [...transpileSpecialAssign(ctx, givenAssign), ...sym]
  }
  return [hoist, collected]
}

const hoistable = transpile =>
  function* transpileHoistable(ctx, node, assign, _hoist, evKind) {
    const [hoist, hoisted] = hoister(ctx)
    const postHoist = [...transpile(ctx, node, assign, hoist, evKind)]
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

// be conservative
const isValidIdentifier = s => s.match(/^[a-zA-Z_$][0-9a-zA-Z_$]*$/)

const canLiteralIdentifier = node =>
  node.kind === 'string' && isValidIdentifier(node.value)

function* transpileNodeObject(ctx, node, hoist) {
  yield ['{', node]
  for (let i = 0; i < node.length; i += 1) {
    // ...foo
    if (node[i].kind === 'symbol' && node[i].value.startsWith('...')) {
      yield* transpileNodeSymbol(ctx, node[i])
    } else if (
      // (... (foo :bar))
      node[i].kind === 'list' &&
      node[i][0].kind === 'symbol' &&
      node[i][0].value === '...'
    ) {
      yield '...'
      yield* transpileNodeExpr(ctx, node[i][1], null, hoist, evExpr)
    } else {
      if (canLiteralIdentifier(node[i])) {
        yield [node[i].value, node[i]]
      } else {
        yield '['
        yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr)
        yield ']'
      }
      yield ':'
      yield* transpileNodeExpr(ctx, node[i + 1], null, hoist, evExpr)
      i++ // we consumed the value too
    }
    yield ','
  }
  yield '}'
}

function* transpileNodeArray(ctx, node, hoist) {
  yield ['[', node]
  for (const i of node) {
    yield* transpileNodeExpr(ctx, i, null, hoist, evExpr)
    yield ','
  }
  yield ']'
}

function* transpileNodeString(ctx, token) {
  yield ['"', token]
  yield token.value
  yield '"'
}

function* transpileNodeRegExp(ctx, token) {
  yield token.value
}

const mangleChars = {
  '!': '_BANG_',
  '?': '_QMARK_',
  '*': '_STAR_',
  '+': '_PLUS_',
  '>': '_GT_',
  '<': '_LT_',
  '=': '_EQ_',
  '-': '_DASH_',
}

const mangleSym = sym => {
  const parts = []
  let start = 0
  for (let end = 0; end < sym.length; end++) {
    const c = sym[end]
    const found = mangleChars[c]
    if (found && (c !== '?' || sym[end + 1] !== '.')) {
      parts.push(sym.slice(start, end), found)
      start = end + 1
    }
  }
  if (start === 0) {
    return sym
  }
  parts.push(sym.slice(start, sym.length))
  return parts.join('')
}

function* transpileNodeSymbol(ctx, token) {
  yield [mangleSym(token.value), token]
}

function* transpileSpecialAssign(ctx, assign) {
  if (assign) {
    if (typeof assign === 'string') {
      yield assign
    } else {
      yield* assign
    }
  }
}

function* transpileNodeUnknown(ctx, node, assign, hoist, evExpr) {
  // completely ignore comments
  if (node.kind === 'comment') {
    return
  }

  // list will handle it's own assign, all others are expressions
  if (node.kind === 'list') {
    yield* transpileNodeList(ctx, node, assign, hoist, evExpr)
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
    case 'regexp':
      yield* transpileNodeRegExp(ctx, node)
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
const transpileNodeExpr = transpileNodeUnknown
const transpileNodeStatement = hoistable(transpileNodeUnknown)

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
          throw err(ctx, c, `unexpected import string "${c.value}"`)
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
  yield ['import ', node]
  yield outer.join(',')
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

function exportDefault(ctx, node) {
  if (node[1].value !== '^:export') {
    return [[], 1]
  }
  const prefix = [['export ', node[1]]]
  let index = 2
  if (node[2].value === '^:default') {
    prefix.push(['default ', node[2]])
    index++
  }
  return [prefix, index]
}

const transpileBuiltinConst = hoistable(function* transpileBuiltinConst(
  ctx,
  node,
  assign,
  hoist,
) {
  let [prefix, symIndex] = exportDefault(ctx, node)
  yield* prefix
  ctx.bindings.add(node[symIndex].value)
  yield [node[0].value, node[0]]
  yield ' '
  yield* transpileNodeSymbol(ctx, node[symIndex])
  yield '='
  yield* transpileNodeExpr(ctx, node[symIndex + 1], null, hoist, evExpr)
  yield ';'
})

function* transpileBuiltinDef(ctx, node, _assign, _hoist) {
  let [prefix, symIndex] = exportDefault(ctx, node)
  yield* prefix
  ctx.bindings.add(node[symIndex].value)
  // if we hoisted, then split the let, otherwise assign expression directly
  const [hoist, hoisted] = hoister(ctx)
  const assign = [...transpileNodeSymbol(ctx, node[symIndex]), '=']
  const postHoist = [
    ...transpileNodeExpr(ctx, node[symIndex + 1], assign, hoist, evExpr),
  ]
  yield [node[0].value, node[0]]
  yield ' '
  if (hoisted.length !== 0 || postHoist[0] != assign[0]) {
    yield* transpileNodeSymbol(ctx, node[symIndex])
    yield ';'
    yield* hoisted
  }
  yield* postHoist
}

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
    yield* transpileNodeStatement(ctx, node[i], a, hoist, evStat)
    yield ';'
  }
})

function* transpileBuiltinDo(ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialBody(ctx, node.slice(1), assign, hoist, evKind)
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
      yield ['[', node]
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
              or[value[j].value] = [...transpileNodeUnknown(ctx, value[j + 1])]
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
  function* transpileBuiltinFn(ctx, node, assign) {
    let [prefix, index] = exportDefault(ctx, node)
    yield* transpileSpecialAssign(ctx, assign)
    yield* prefix
    let wrapped = false
    if (node[index].kind === 'symbol') {
      yield ['const ', node]
      ctx.bindings.add(node[index].value)
      yield* transpileNodeSymbol(ctx, node[index])
      yield '='
      index++
    } else {
      wrapped = true
      yield '('
    }
    yield preArgs
    yield* transpileSpecialFnArgs(ctx, node[index])
    yield postArgs
    yield '{'
    yield* transpileSpecialBody(
      ctx,
      node.slice(index + 1),
      'return ',
      null,
      evStat,
    )
    yield '}'
    if (wrapped) {
      yield ')'
    }
  }

const transpileBuiltinFnArrow = makeFnTranspiler('', '=>')
const transpileBuiltinFnArrowAsync = makeFnTranspiler('async', '=>')
const transpileBuiltinFnGenerator = makeFnTranspiler('function*', '')
const transpileBuiltinFnAsyncGenerator = makeFnTranspiler('async function*', '')

const makeOpTranspiler = (op, unary = false) =>
  function* transpileBuiltinOp(ctx, node, assign, hoist, _evKind) {
    yield* transpileSpecialAssign(ctx, assign)
    yield '('
    if (unary && node.length === 2) {
      yield op
    }
    const sp = splitter(op)
    for (let i = 1; i < node.length; i++) {
      yield sp()
      yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr)
    }
    yield ')'
  }

const makePrefixOpTranspiler = op =>
  function* transpileBuiltinPrefixOp(ctx, node, assign, hoist, _evKind) {
    yield* transpileSpecialAssign(ctx, assign)
    yield '('
    yield op
    yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
    yield ')'
  }

const makeSuffixOpTranspiler = op =>
  function* transpileBuiltinSuffixOp(ctx, node, assign, hoist, _evKind) {
    yield* transpileSpecialAssign(ctx, assign)
    yield '('
    yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
    yield op
    yield ')'
  }

const cmpRemap = {
  '=': '===',
  'not=': '!==',
}

function* transpileBuiltinCmp(ctx, node, assign, hoist, _evKind) {
  yield* transpileSpecialAssign(ctx, assign)
  yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
  const op = node[0].value
  yield [cmpRemap[op] ?? op, node[0]]
  yield* transpileNodeExpr(ctx, node[2], null, hoist, evExpr)
}

function* transpileBuiltinLet(ctx, node, assign, hoist, evKind) {
  if (node[1].kind === 'symbol') {
    yield* transpileBuiltinDef(ctx, node, assign, hoist, evKind)
    return
  }
  yield* transpileBuiltinLetMulti(ctx, node, assign, hoist, evKind)
}

function* transpileBuiltinLetMulti(ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinLetMulti, node, assign)
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
      sym = [...transpileNodeSymbol(ctx, ctx.gensym('let_multi'))]
    }

    // generated the statement and check if we can assign directly
    // assign to simple symbol
    const assign = [...sym, '=']
    const one = [
      ...transpileNodeStatement(ctx, node[1][i + 1], assign, hoist, evStat),
    ]

    if (one[0] === assign[0]) {
      // we can directly destructure, forget the gensym
      if (binding.kind !== 'symbol') {
        yield ['let ', node]
        yield* transpileSpecialDestructure(ctx, binding)
        yield '='
        yield* one.slice(2)
      } else {
        yield ['let ', node]
        yield* one
      }
      yield ';'
      continue
    }

    // declare the simple symbol
    yield 'let '
    yield* sym
    yield ';'
    yield* one
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
  yield* transpileSpecialBody(ctx, node.slice(2), assign, hoist, evStat)
  yield '}'
  ctx.bindings.pop()
}

function* transpileBuiltinKeywordExpr(ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign)
  if (evKind === evExpr) {
    yield '('
  }
  yield node[0].value
  if (node.length !== 1) {
    yield ' '
    yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
  }
  if (evKind === evExpr) {
    yield ')'
  }
}

function* transpileBuiltinKeywordStatement(ctx, node, _assign, hoist, _evKind) {
  if (node.length === 1) {
    yield node[0].value
  } else {
    yield* transpileNodeStatement(
      ctx,
      node[1],
      [node[0].value, ' '],
      hoist,
      evStat,
    )
  }
}

function* transpileBuiltinFor(ctx, node, _assign, hoist, _evKind) {
  const binding = node[1]
  yield 'for(let '
  yield* transpileNodeSymbol(ctx, binding[0])
  yield '='
  yield* transpileNodeExpr(ctx, binding[1], null, hoist, evExpr)
  yield ';'
  yield* transpileNodeSymbol(ctx, binding[0])
  yield '<'
  yield* transpileNodeExpr(ctx, binding[2], null, hoist, evExpr)
  yield ';'
  yield* transpileNodeSymbol(ctx, binding[0])
  if (binding.length === 3) {
    yield '++'
  } else {
    yield '+='
    yield* transpileNodeExpr(ctx, binding[3], null, hoist, evExpr)
  }
  yield '){'
  yield* transpileSpecialBody(ctx, node.slice(2), null, hoist, evStat)
  yield '}'
}

const makeForTranspiler = (prefix, middle) =>
  function* transpileBuiltinForSpecial(ctx, node, _assign, hoist, evKind) {
    const binding = node[1]
    yield [prefix, node[0]]
    yield '(let '
    yield* transpileNodeSymbol(ctx, binding[0])
    yield [' ', node[0]]
    yield middle
    yield ' '
    yield* transpileNodeExpr(ctx, binding[1], null, hoist, evExpr)
    yield ['){', node[0]]
    yield* transpileSpecialBody(ctx, node.slice(2), null, hoist, evStat)
    yield '}'
  }

const transpileBuiltinForOf = makeForTranspiler('for', 'of')
const transpileBuiltinForIn = makeForTranspiler('for', 'in')
const transpileBuiltinForAwait = makeForTranspiler('for await', 'of')

function* transpileBuiltinIf(ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinIf, node, assign)
    return
  }

  const elif = splitter('else ')
  const finalElse = node.length % 2 === 0
  for (let i = 1; i < node.length; i += 2) {
    if (finalElse && i === node.length - 1) {
      yield 'else{'
      yield* transpileNodeStatement(ctx, node[i], assign, hoist, evStat)
      yield '}'
      return
    }
    yield elif()
    yield 'if('
    yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr)
    yield '){'
    yield* transpileNodeStatement(ctx, node[i + 1], assign, hoist, evStat)
    yield '}'
  }
}

function* transpileBuiltinWhile(ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinWhile, node, assign)
    return
  }
  yield 'while('
  yield* transpileNodeExpr(ctx, node[1], null, evExpr)
  yield '){'
  yield* transpileSpecialBody(ctx, node.slice(2), null, hoist, evStat)
  yield '}'
}

function* transpileBuiltinCase(ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr && !assign) {
    yield* hoist(transpileBuiltinCase, node, assign)
    return
  }

  const finalDefault = node.length % 2 === 1
  yield 'switch ('
  yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
  yield '){'
  for (let i = 2; i < node.length; i += 2) {
    if (finalDefault && i === node.length - 1) {
      yield 'default:'
      yield* transpileNodeStatement(ctx, node[i], assign, hoist, evStat)
      yield ';'
      if (assign !== 'return ') {
        yield 'break'
      }
      yield '}'
      return
    }

    yield 'case '
    yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr)
    yield ':'
    yield* transpileNodeStatement(ctx, node[i + 1], assign, hoist, evStat)
    yield ';'
    if (assign !== 'return ') {
      yield 'break;'
    }
  }
  yield '}'
}

function* transpileBuiltinQuestionDot(ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign)
  yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
  for (let i = 2; i < node.length; i++) {
    yield '?.'
    if (canLiteralIdentifier(node[i])) {
      yield [node[i].value, node[i]]
    } else {
      yield '['
      yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr)
      yield ']'
    }
  }
}

function* transpileBuiltinDot(ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign)
  yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
  for (let i = 2; i < node.length; i++) {
    if (canLiteralIdentifier(node[i])) {
      yield '.'
      yield [node[i].value, node[i]]
    } else {
      yield '['
      yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr)
      yield ']'
    }
  }
}

function* transpileBuiltinRest(ctx, node, assign, hoist, evKind) {
  yield '...'
  yield* transpileNodeStatement(ctx, node[1], assign, hoist, evKind)
}

function* transpileBuiltinTry(ctx, node, assign, hoist, evKind) {
  if (evKind === evExpr) {
    yield* hoist(transpileBuiltinTry, node, assign)
    return
  }
  let end = node.length
  let final
  if (node[end - 1]?.[0]?.value === 'finally') {
    final = node[end - 1]
    end--
  }
  let ctch
  if (node[end - 1]?.[0]?.value === 'catch') {
    ctch = node[end - 1]
    end--
  }
  if (!final && !ctch) {
    throw err(ctx, node, 'at least one of catch or finally must be provided')
  }
  yield 'try{'
  yield* transpileSpecialBody(ctx, node.slice(1, end), assign, hoist, evStat)
  yield '}'
  if (ctch) {
    yield 'catch('
    yield* transpileNodeExpr(ctx, ctch[1], null, null, evExpr)
    yield '){'
    yield* transpileSpecialBody(ctx, ctch.slice(2), assign, null, evStat)
    yield '}'
  }
  if (final) {
    yield 'finally{'
    yield* transpileSpecialBody(ctx, final.slice(1), null, null, evStat)
    yield '}'
  }
}

function* transpileHashLambda(ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign)
  let restArg
  const args = []
  const argMap = n => {
    if (Array.isArray(n)) {
      n.forEach(argMap)
      return
    }
    if (n.kind !== 'symbol') {
      return
    }
    if (n.value.startsWith('...$')) {
      if (!restArg) {
        restArg = ctx.gensym('lambda_rest')
      }
      n.value = `${restArg.value}${n.value.slice(4)}`
      return
    }
    if (!n.value.startsWith('$')) {
      return
    }

    // check if we have a dot, indicates we're replacing part of a symbol
    // like $2.replace
    const sym = n.value
    const dot = sym.indexOf('.')
    const target = dot === -1 ? sym : sym.slice(0, dot)

    let arg = 0
    if (target !== '$') {
      arg = parseInt(target.slice(1), 10) - 1
    }

    const replace = (args[arg] ?? (args[arg] = ctx.gensym('lambda'))).value
    n.value = dot === -1 ? replace : `${replace}${sym.slice(dot)}`
  }
  argMap(node[1])

  const comma = splitter(',')
  yield '(('
  for (const arg of args) {
    yield comma()
    yield* transpileNodeSymbol(ctx, arg)
  }
  if (restArg) {
    yield comma()
    yield '...'
    yield* transpileNodeSymbol(ctx, restArg)
  }
  yield ')=>{'
  yield* transpileNodeStatement(ctx, node[1], 'return ', hoist, evStat)
  yield '})'
}

function* transpileBuiltinHash(ctx, node, assign, hoist, evKind) {
  if (node[1].kind === 'list') {
    yield* transpileHashLambda(ctx, node, assign, hoist, evKind)
    return
  }
  throw err(ctx, ctx, `unexpected hash "${node[1].kind}"`)
}

function* serializeNode(ctx, node, hoist) {
  if (Array.isArray(node)) {
    if (node[0].value === 'unquote') {
      yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
      return
    }

    yield 'Object.defineProperties(['
    for (const i of node) {
      yield* serializeNode(ctx, i, hoist)
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

const applyGensym = (ctx, existing, node) => {
  if (Array.isArray(node)) {
    node.map(applyGensym.bind(null, ctx, existing))
  } else {
    if (node.kind === 'symbol' && node.value.endsWith('#')) {
      const name = node.value
      const found = existing[name]
      if (found) {
        node.value = found
      } else {
        const gen = ctx.gensym('macro').value
        existing[name] = gen
        node.value = gen
      }
    }
  }
}

function* transpileBuiltinQuote(ctx, node, assign, hoist, _evKind) {
  applyGensym(ctx, {}, node)
  yield* transpileSpecialAssign(ctx, assign)
  yield* serializeNode(ctx, node[1], hoist)
}

function* transpileSpecialMacro(ctx, node) {
  const args = node[2].map(v => partsStr(transpileSpecialDestructure(ctx, v)))
  ctx.macros.add(
    node[1].value,
    new Function(
      '_macroName',
      ...args,
      partsStr(transpileSpecialBody(ctx, node.slice(3), 'return ')),
    ),
  )
}

const builtins = {
  import: transpileBuiltinImport,
  const: transpileBuiltinConst,
  var: transpileBuiltinDef,
  fn: transpileBuiltinFnArrow,
  'fn@': transpileBuiltinFnArrowAsync,
  'fn*': transpileBuiltinFnGenerator,
  'fn@*': transpileBuiltinFnAsyncGenerator,
  str: makeOpTranspiler('+'),
  '+': makeOpTranspiler('+', true),
  '-': makeOpTranspiler('-', true),
  '*': makeOpTranspiler('*'),
  '/': makeOpTranspiler('/'),
  '**': makeOpTranspiler('**'),
  '%': makeOpTranspiler('%'),
  '+=': makeOpTranspiler('+='),
  '-=': makeOpTranspiler('-='),
  '&=': makeOpTranspiler('&='),
  '|=': makeOpTranspiler('|='),
  '/=': makeOpTranspiler('/='),
  '*=': makeOpTranspiler('*='),
  '**=': makeOpTranspiler('**='),
  '<<=': makeOpTranspiler('<<='),
  '>>=': makeOpTranspiler('>>='),
  '>>>=': makeOpTranspiler('>>>='),
  '||=': makeOpTranspiler('||='),
  '??=': makeOpTranspiler('??='),
  '%=': makeOpTranspiler('%='),
  '??': makeOpTranspiler('??'),
  '<<': makeOpTranspiler('<<'),
  '>>': makeOpTranspiler('>>'),
  '>>>': makeOpTranspiler('>>>'),
  '++': makeSuffixOpTranspiler('++'),
  '--': makeSuffixOpTranspiler('--'),
  'bit-and': makeOpTranspiler('&'),
  'bit-or': makeOpTranspiler('|'),
  'bit-not': makePrefixOpTranspiler('~'),
  'bit-xor': makeOpTranspiler('^'),
  '||': makeOpTranspiler('||'),
  or: makeOpTranspiler('||'),
  '&&': makeOpTranspiler('&&'),
  and: makeOpTranspiler('&&'),
  not: makePrefixOpTranspiler('!'),
  '=': transpileBuiltinCmp,
  '==': transpileBuiltinCmp,
  '!=': transpileBuiltinCmp,
  'not=': transpileBuiltinCmp,
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
  while: transpileBuiltinWhile,
  '.': transpileBuiltinDot,
  '?.': transpileBuiltinQuestionDot,
  '...': transpileBuiltinRest,
  typeof: transpileTypeof,
  set: transpileSet,
  hash: transpileBuiltinHash,
  quote: transpileBuiltinQuote,
  macro: transpileSpecialMacro,
  try: transpileBuiltinTry,
}

const macros = (() => {
  const ctx = newCtx({}, {})
  const input = uninterrupt(tokens(ctx, builtinMacros))
  while (true) {
    const node = astOne(ctx, input)
    if (!node) {
      return ctx.macros.scopes[0]
    }
    ;[...transpileNodeStatement(ctx, node, null, null, evStat)]
  }
})()

// function, method or constructor call
function* transpileSpecialCall(ctx, node, assign, hoist, evKind) {
  yield* transpileSpecialAssign(ctx, assign)
  let argStart = 1
  if (node[0].kind === 'symbol') {
    const call = node[0].value
    if (call.endsWith('.')) {
      yield ['new ', node[0]]
      yield [mangleSym(call.slice(0, -1)), node[0]] // drop the tailing .
    } else if (call.startsWith('.')) {
      yield* transpileNodeExpr(ctx, node[1], null, hoist, evExpr)
      yield [mangleSym(call), node[0]]
      argStart = 2
    } else {
      yield [mangleSym(call), node]
    }
  } else {
    yield* transpileNodeExpr(ctx, node[0], null, hoist, evExpr)
  }
  const comma = splitter(',')
  yield '('
  for (let i = argStart; i < node.length; i++) {
    yield comma()
    yield* transpileNodeExpr(ctx, node[i], null, hoist, evExpr)
  }
  yield ')'
}

function* transpileNodeList(ctx, node, assign, hoist, evKind) {
  const call = node[0].value
  const binding = ctx.bindings.get(call)
  if (binding === true) {
    yield* transpileSpecialCall(ctx, node, assign, hoist, evKind)
    return
  }
  if (binding) {
    yield* binding(ctx, node, assign, hoist, evKind)
    return
  }
  const macro = ctx.macros.get(call)
  if (macro) {
    yield* transpileNodeUnknown(ctx, macro(...node), assign, hoist, evKind)
    return
  }
  yield* transpileSpecialCall(ctx, node, assign, hoist, evKind)
}

function* transpileTypeof(ctx, node, assign, hoist, _evKind) {
  yield 'typeof '
  yield* transpileNodeExpr(ctx, node[1], assign, hoist, evExpr)
}

function* transpileSet(ctx, node, assign, hoist, _evKind) {
  const newAssign = [
    ...transpileSpecialAssign(ctx, assign),
    ...transpileNodeSymbol(ctx, node[1]),
    '=',
  ]
  yield* transpileNodeExpr(ctx, node[2], newAssign, hoist, evExpr)
}

export function* transpile(code, config = {}) {
  const ctx = newCtx(config, macros)
  const input = uninterrupt(tokens(ctx, code))
  while (true) {
    const node = astOne(ctx, input)
    if (!node) {
      return
    }
    yield* transpileNodeStatement(ctx, node, null, null, evStat)
    yield ';'
  }
}

export const transpileStr = (code, config = {}) => {
  const source = config.filename ?? '<anonymous>'
  const parts = []
  const map = new SourceMapGenerator()
  let column = 0
  for (const out of transpile(code, config)) {
    let part, partToken
    if (typeof out === 'string') {
      part = out
    } else {
      ;[part, partToken] = out
    }
    if (typeof partToken?.pos?.line === 'number') {
      const mapping = {
        source,
        original: {
          line: partToken.pos.line + 1,
          column: partToken.pos.column,
        },
        generated: {
          line: 1,
          column,
        },
        name:
          partToken.kind === 'symbol' && !partToken.value.includes('.')
            ? mangleSym(partToken.value)
            : null,
      }
      map.addMapping(mapping)
    }
    column += part.length
    parts.push(part)
  }
  map.setSourceContent(source, code)
  const mapJSON = map.toJSON()
  if (config.sourcemap === 'inline') {
    parts.push(
      '\n',
      '//# sourceMappingURL=data:application/json;base64,',
      Buffer.from(JSON.stringify(mapJSON), 'utf8').toString('base64'),
    )
  }
  return {
    code: parts.join(''),
    map: mapJSON,
  }
}
