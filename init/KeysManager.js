import { KeysManager } from "lightningdevkit";

const initKeysManager = () => {
  let seed_counter = 0;
  var seed = new Uint8Array(32);
  
  if (localStorage.getItem('seed') == null) {
      window.crypto.getRandomValues(seed);
      const arr = Array.from // if available
        ? Array.from(seed) // use Array#from
        : [].map.call(seed, (v => v)); // otherwise map()
      localStorage.setItem('seed', JSON.stringify(arr));
  } else {
      seed = JSON.parse(localStorage.getItem("seed"))
  }
  
  const keysManager = KeysManager.constructor_new(
    seed,
    BigInt(Math.floor(Date.now() / 1000)),
    Number(Date.now() / 1000)
  );
  return keysManager;
};

export default initKeysManager;
