import { SourceMapGenerator } from 'source-map-js/lib/source-map-generator.js'

const symbolBreaker = ['(', ')', '[', ']', '{', '}']
const single = [...symbolBreaker, '@', '#', ':', "'", '~', ',']
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

(macro isa? [v k]
  '(instanceof ,v ,k))

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

const readString = (ctx, quote, input, len, pos) => {
  let buf = []
  let start = pos.offset + 1
  for (let end = start; end < len; end++) {
    pos.offset++
    pos.column++
    switch (input[end]) {
      case quote:
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
      pos.line++
      pos.column = 0
      ctx.pos = { ...pos }
      yield { kind: 'newline', value: '\n', pos }
      pos.offset++
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
        value = readString(ctx, '"', input, len, pos)
        ctx.pos = { ...start }
        yield { kind: 'string', value, pos: start }
        break
      case '`':
        start = { ...pos }
        value = readString(ctx, '`', input, len, pos)
        ctx.pos = { ...start }
        yield { kind: 'template', value, pos: start }
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

const whitespaceOrComment = ({ kind }) =>
  kind === 'comment' || kind === 'newline'

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
    if (whitespaceOrComment(token)) {
      continue
    }
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

const astHash = (ctx, token, input) => {
  const node = astShorthand(ctx, token, 'hash', input)
  if (node.length === 2 && node[1].kind === 'symbol') {
    return { kind: 'symbol', value: '#' + node[1].value, pos: node.pos }
  }
  return node
}
