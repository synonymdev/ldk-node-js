import { KeysManager } from "lightningdevkit";

const initKeysManager = () => {
  let seed_counter = 0;
  const seed = new Uint8Array(32);
  seed.fill(seed_counter);
  seed_counter++;

  const keysManager = KeysManager.constructor_new(
    seed,
    BigInt(Math.floor(Date.now() / 1000)),
    Number(Date.now() / 1000)
  );
  return keysManager;
};

export default initKeysManager;
