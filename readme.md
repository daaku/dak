# <img src="./packages/website/assets/logo.svg" width="24" height="24" alt="Logo"> Dak

Dak is a Lisp like language that transpiles to JavaScript.

## Play

If you want to jump in and see what it looks like, explore the
[Dak Tour](https://www.daklang.com/tour/).

## Zen

1. Full access to JavaScript. Be one with the host.
2. No runtime. Participate in the library ecosystem.
3. Perfect is the enemy of good. Versions are infinite.
4. Be useful today. Survive to thrive.
5. Be fast. Stay fast.

JavaScript is ubiquitous. It's ecosystem is diverse and populated. Dak attempts
to provide a path to leverage and participate in this ecosystem, as a modern
lisp like language. It is not a Lisp. It's still JavaScript, but wearing a Lisp
outfit. It's not Common Lisp or Scheme, but a bit more like Clojure or Fennel.
It doesn't hide it's true nature, and aims to provide access to every feature
JavaScript has.

## Browser

Browser output is an important goal. Specifically, small bundle size and tree
shaking for pay-as-you-go, are key considerations that determine the design
choices. If you are making a browser based application in Dak, a
[Vite based setup is the recommended choice](packages/rollup). ES Modules
support is virtually required and baked in.

## CLI

CLI tooling using `node` can be built using the [ESM Loader](packages/loader).
It provides a loader but otherwise doesn't get in your way. Maybe look at
[`make.dak`](make.dak) or [`build.dak`](packages/website/build.dak) for
inspiration. For one off use [`npx @daklang/cli`](packages/cli) can do in a
pinch, though `npx` adds considerable overhead.

## Status

A language needs an ecosystem. Formatting, LSP, [VSCode](packages/vscode)
extensions, REPL, unit testing, benchmarking and so much more. We don't have
much here.

Macros and the programmable aspects of Dak are what I consider to be it's
selling points. It's much easier to achieve this in a Lisp like language. These
are still very much a work-in-progress. Expect heavy iteration here.

Syntax in JavaScript is quite diverse. Much of it is already supported. What is
missing is probably easy to provide.

## What's Next?

It's all a bit fuzzy, but a seemingly good near term goal is to provide a fun,
featureful and fast development experience to build browser based UX
applications that can use hiccup like syntax and leverage React, lit-html or
Solid.
