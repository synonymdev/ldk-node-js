// Import everything
import * as ldk from "lightningdevkit";
import {
  FeeEstimator,
  Logger,
  BroadcasterInterface,
  Persist,
  Filter,
  UserConfig,
  ChainParameters,
  Network,
  BestBlock,
  ChannelManager,
  Init,
  InitFeatures,
  Result__u832APIErrorZ_Err,
  APIError_APIMisuseError,
  Event_FundingGenerationReady,
  SocketDescriptor,
  PeerManager,
  ChannelMessageHandler,
  RoutingMessageHandler,
  KeysManager,
} from "lightningdevkit";

import YourFeeEstimator from "./init/YourFeeEstimator";
import YourLogger from "./init/YourLogger";
import YourBroadcaster from "./init/YourBroadcaster";
import initNetworkGraph from "./init/NetworkGraph";
import YourPersister from "./init/YourPersister";
import YourFilter from "./init/YourFilter";
import YourChannelMonitor from './init/YourChannelMonitor';
import YourEventhandler from "./init/YourEventHandler";
import YourSocketDescriptor from "./init/YourSocketDescriptor";
import initChainMonitor from "./init/ChainMonitor";
import initKeysManager from "./init/KeysManager";
import YourChannelMessageHandler from "./init/YourChannelMessageHandler";
import YourRoutingMessageHandler from "./init/YourRoutingMessageHandler";



// Steps to implement 
// ✅ Step 1. Initialize the FeeEstimator 
// ✅ Step 2. Initialize the Logger 
// ✅ Step 3. Initialize the BroadcasterInterface 
// ❓ Step 4. Optional: Initialize the NetworkGraph
// ❌ Step 5. Initialize Persist 
// ❌ Step 6. Initialize the EventHandler 
// ❓ Step 7. Optional: Initialize the Transaction Filter
// ❌ Step 8. Initialize the ChainMonitor
// ✅ Step 9. Initialize the KeysManager
// ❌ Step 10. Read ChannelMonitors from disk
// ❌ Step 11. Initialize the ChannelManager
// ❌ Step 12. Sync ChannelMonitors and ChannelManager to chain tip
// ❌ Step 13. Optional: Bind a Listening Port

// === Running LDK

// ❌ Step 14. Keep LDK Up-to-date with Chain Info x


// Bitcoin RPC Connector
var RpcClient = require("bitcoind-rpc")

window.ldk = {}
window.ldk.rpcclient = RpcClient;

window.ldk.rpcclient = new RpcClient({protocol:'http',user:'user',pass:'password',host:'127.0.0.1',port:8010})

window.ldk.start = async () => {
  console.log('starting LDK')

  // Connect to bitcoin RPC service
  window.ldk.rpcclient.getBlockchainInfo((err, response) => {
    console.log("Connected to Bitcoin backend: ", response.result.chain)
  })


  // Initialize the LDK data directory if necessary.
  //let ldk_data_dir = fs.

  // Implementing steps as defined in https://lightningdevkit.org/tutorials/build_a_node_in_java/

  // Step 1. Initialize the FeeEstimator
  let fee_estimator = new YourFeeEstimator();

	// Step 2. Initialize the Logger
  let logger = new YourLogger();

	// Step 3. Initialize the BroadcasterInterface
  let broadcaster = new YourBroadcaster(function(tx) {console.log(tx)});

  // Step 4. Optional: Initialize the NetworkGraph
  initNetworkGraph();

	// Step 5. Initialize Persist
  let persister = new YourPersister();

  // Step 6: Initialize the ChainMonitor EventHandler
  // let chain_monitor = initChainMonitor(broadcaster, logger, fee_estimator, persister);
  initChainMonitor();

  // Step 7. Optional: Initialize the Transaction Filter
  let tx_filter = new YourFilter();

  // Step 8. Initialize the ChainMonitor
  //let chain_monitor = new
  initChainMonitor(broadcaster, logger, fee_estimator, persister);

  // Step 9. Initialize the KeysManager
  let keys_manager = initKeysManager();

  // Step 10. Read ChannelMonitors from disk
  let channel_monitor_list = new YourChannelMonitor();

  // Step 11. Initialize the ChannelManager
  // Step 12. Sync ChannelMonitors and ChannelManager to chain tip
  // Step 13. Optional: Bind a Listening Port

  // === Running LDK

  // Step 14. Keep LDK Up-to-date with Chain Info
}

const compileWasm = (pathToWasm) => {
  fetch(pathToWasm)
    .then((response) => {
      return response.arrayBuffer();
    })
    .then((bytes) => {
      ldk
        .initializeWasmFromBinary(bytes)
        .then(async (ff) => {
          await window.ldk.start()
        })
    });
};

compileWasm("liblightningjs.wasm");