const fs = require("fs")
async function test  () {
  const { run_tests_node } = await import("lightningdevkit/test/tests.mjs");
  var bin = fs.readFileSync("./node_modules/lightningdevkit/liblightningjs.wasm")
  run_tests_node(bin)
}

test()