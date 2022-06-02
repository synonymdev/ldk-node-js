// Import everything
import * as ldk from "lightningdevkit";
import { run_tests_web } from "lightningdevkit/test/tests.mjs";

const result = run_tests_web("liblightningjs.wasm");
try {
  if (result) {
    console.log("All Tests Passed!");
  } else {
    console.log("Some Tests Failed!");
    console.log(result);
  }
} catch (e) {
  console.log("Error occured");
  console.error(e);
}
/*
window.ldk = ldk

fetch("liblightningjs.wasm").then((response) => {
    return response.arrayBuffer()
}).then((bytes) => {
    console.log("bytes", bytes)
    ldk.initializeWasmFromBinary(bytes).then(() => {

    })
})

*/