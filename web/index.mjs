import prettier from "https://unpkg.com/prettier@2.7.1/esm/standalone.mjs";
import parserBabel from "https://unpkg.com/prettier@2.7.1/esm/parser-babel.mjs";
import { transpile } from "../js/src/parser.mjs";

const autoEval = document.getElementById("autoEval");
const pretty = document.getElementById("pretty");
const minify = document.getElementById("minify");
const dakCode = document.getElementById("dakCode");
const jsCode = document.getElementById("jsCode");
const output = document.getElementById("output");

const isPrimitive = (v) => v === Object(v);

globalThis.println = (...rest) => {
  console.log(...rest);
  for (const thing of rest) {
    const child = document.createElement("pre");
    if (isPrimitive(thing)) {
      child.innerText = String(thing);
    } else {
      child.innerText = JSON.stringify(thing);
    }
    output.appendChild(child);
  }
};

const logErr = (prefix, err) => {
  console.error(err);
  const child = document.createElement("pre");
  child.innerText = prefix + ":" + err;
  output.appendChild(child);
};

dakCode.oninput = (ev) => {
  output.replaceChildren();

  try {
    const js = [...transpile(dakCode.value)].join("");

    if (autoEval.value) {
      try {
        eval(js);
      } catch (e) {
        logErr("eval", e);
      }
    }

    if (pretty.value) {
      try {
        jsCode.value = prettier.format(js, {
          parser: "babel",
          plugins: [parserBabel],
        });
        return;
      } catch (e) {
        logErr("pretty", e);
      }
    }

    // if we get here we're not doing pretty or minify
    jsCode.value = js;
  } catch (e) {
    logErr("compile", e);
  }
};
