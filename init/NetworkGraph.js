import { Network, BestBlock, NetworkGraph } from "lightningdevkit";

const initNetworkGraph = () => {
  const network = Network.LDKNetwork_Signet;
  const genesisBlock = BestBlock.constructor_from_genesis(network);
  const genesisBlockHash = genesisBlock.block_hash();

  const networkGraph = NetworkGraph.constructor_new(genesisBlockHash);

  return networkGraph;
};

export default initNetworkGraph;
