import prettier from "https://unpkg.com/prettier@2.7.1/esm/standalone.mjs";
import parserBabel from "https://unpkg.com/prettier@2.7.1/esm/parser-babel.mjs";
import { transpile } from "../js/src/parser.mjs";

const input = document.getElementById("input");
const output = document.getElementById("output");
input.oninput = (ev) => {
  try {
    const js = [...transpile(input.value)].join("");
    const fmt = prettier.format(js, {
      parser: "babel",
      plugins: [parserBabel],
    });
    output.value = fmt;
  } catch (e) {
    console.error(e);
  }
};
