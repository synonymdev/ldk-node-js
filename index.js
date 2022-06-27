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

import {
  assign_u64, 
  array_eq
} from './utils/'

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
import YourPeerManager from "./init/YourPeerManager";



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
  console.log('LDK startup successful. To view available commands: "help".');
  
  console.log("LDK logs are available at LocalStorage logs");
  window.ldk.lib = ldk;
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
  let tx_broadcaster = new YourBroadcaster(function(tx) {console.log(tx)});

  // Step 4. Optional: Initialize the NetworkGraph
  // initNetworkGraph();

	// Step 5. Initialize Persist
  let persister = new YourPersister();

  // Step 6: Initialize the ChainMonitor EventHandler
  // let chain_monitor = initChainMonitor(broadcaster, logger, fee_estimator, persister);
  // initChainMonitor(broadcaster, logger, fee_estimator, persister);
  const chain_monitor = ldk.ChainMonitor.constructor_new(ldk.Option_FilterZ.constructor_none(), tx_broadcaster, logger, fee_estimator, persister);
	


  // Step 7. Optional: Initialize the Transaction Filter
  // let tx_filter = new YourFilter();

  // Step 8. Initialize the ChainMonitor
  //let chain_monitor = new
  //initChainMonitor(broadcaster, logger, fee_estimator, persister);
  const chain_watch = chain_monitor.as_Watch();
  

  // Step 9. Initialize the KeysManager
  const keys_manager = initKeysManager();
	const keys_interface = keys_manager.as_KeysInterface();

  // Step 10. Read ChannelMonitors from disk
  // let channel_monitor_list = new YourChannelMonitor();

  // Step 11. Initialize the ChannelManager
  // Step 12. Sync ChannelMonitors and ChannelManager to chain tip
  // Step 13. Optional: Bind a Listening Port
  // nio_peer_handler = ChannelManager.constructor_new().nio_peer_handler;
  // var port = 9735;
  // nio_peer_handler.bind_listener(new InetSocketAddress("0.0.0.0", port))
  var peerManager = new YourPeerManager();
  window.ldk.peerm = peerManager;

  const config = ldk.UserConfig.constructor_default();
	const params = ldk.ChainParameters.constructor_new(ldk.Network.LDKNetwork_Testnet, ldk.BestBlock.constructor_from_genesis(ldk.Network.LDKNetwork_Testnet));
  var channel_manager = ldk.ChannelManager.constructor_new(fee_estimator, chain_watch, tx_broadcaster, logger, keys_interface, config, params)

  // === Running LDK

  // Step 14. Keep LDK Up-to-date with Chain Info
  window.ldk.cm = channel_manager;
	console.log("Local Node ID is " + channel_manager.get_our_node_id().reduce((a, b) => a + b.toString(16).padStart(2, '0'), ''));
//	chan_man.as_ChannelMessageHandler().peer_connected(chan_man_b.get_our_node_id(), ldk.Init.constructor_new(ldk.InitFeatures.constructor_known(), ldk.Option_NetAddressZ.constructor_none()));
//	chan_man_b.as_ChannelMessageHandler().peer_connected(chan_man_a.get_our_node_id(), ldk.Init.constructor_new(ldk.InitFeatures.constructor_known(), ldk.Option_NetAddressZ.constructor_none()));

/*
	const chan_create_err = chan_man_a.create_channel(chan_man_b.get_our_node_id(), BigInt(0), BigInt(400), BigInt(0), ldk.UserConfig.constructor_default());
	if (chan_create_err.is_ok()) return false;
	if (!(chan_create_err instanceof ldk.Result__u832APIErrorZ_Err)) return false;
	if (!(chan_create_err.err instanceof ldk.APIError_APIMisuseError)) return false;
	if (chan_create_err.err.err != "Channel value must be at least 1000 satoshis. It was 0") return false;

	const chan_create_res = chan_man_a.create_channel(chan_man_b.get_our_node_id(), BigInt(1000000), BigInt(400), BigInt(0), ldk.UserConfig.constructor_default());
	if (!chan_create_res.is_ok()) return false;

	if (!exchange_messages(chan_man_a, chan_man_b)) return false;

	const events = [];
	const event_handler = ldk.EventHandler.new_impl({
		handle_event(event) {
			events.push(event);
		}
	});

	chan_man_a.as_EventsProvider().process_pending_events(event_handler);

	if (events.length != 1) return false;
	if (!(events[0] instanceof ldk.Event_FundingGenerationReady)) return false;

	// (very) manually create a funding transaction
	const witness_pos = events[0].output_script.length + 58;
	const funding_tx = new Uint8Array(witness_pos + 7);
	funding_tx[0] = 2; // 4-byte tx version 2
	funding_tx[4] = 0; funding_tx[5] = 1; // segwit magic bytes
	funding_tx[6] = 1; // 1-byte input count 1
	// 36 bytes previous outpoint all-0s
	funding_tx[43] = 0; // 1-byte input script length 0
	funding_tx[44] = 0xff; funding_tx[45] = 0xff; funding_tx[46] = 0xff; funding_tx[47] = 0xff; // 4-byte nSequence
	funding_tx[48] = 1; // one output
	assign_u64(funding_tx, 49, events[0].channel_value_satoshis);
	funding_tx[57] = events[0].output_script.length; // 1-byte output script length
	funding_tx.set(events[0].output_script, 58);
	funding_tx[witness_pos] = 1; funding_tx[witness_pos + 1] = 1; funding_tx[witness_pos + 2] = 0xff; // one witness element of size 1 with contents 0xff
	funding_tx[witness_pos + 3] = 0; funding_tx[witness_pos + 4] = 0; funding_tx[witness_pos + 5] = 0; funding_tx[witness_pos + 6] = 0; // lock time 0

	const funding_res = chan_man_a.funding_transaction_generated(events[0].temporary_channel_id, funding_tx);
	if (!(funding_res instanceof ldk.Result_NoneAPIErrorZ_OK)) return false;

	if (!exchange_messages(chan_man_a, chan_man_b)) return false;

	const tx_broadcasted = (await peer_a[1])
	if (!array_eq(tx_broadcasted, funding_tx)) return false;
	
  */
/*
  */
}


function exchange_messages(a, b) {
	var found_msgs = true;
	while (found_msgs) {
		const as_msgs = a.as_MessageSendEventsProvider().get_and_clear_pending_msg_events();
		const bs_msgs = b.as_MessageSendEventsProvider().get_and_clear_pending_msg_events();
		found_msgs = as_msgs.length != 0 || bs_msgs.length != 0;
		for (var i = 0; i < 2; i++) {
			var to; var from; var msgs;
			if (i == 0) { from = a; to = b; msgs = as_msgs; } else { from = b; to = a; msgs = bs_msgs; }
			for (var j = 0; j < msgs.length; j++) {
				const msg = msgs[j];
				if (msg instanceof ldk.MessageSendEvent_SendOpenChannel) {
					if (!array_eq(msg.node_id, to.get_our_node_id())) return false;
					to.as_ChannelMessageHandler().handle_open_channel(from.get_our_node_id(), ldk.InitFeatures.constructor_known(), msg.msg);
				} else if (msg instanceof ldk.MessageSendEvent_SendAcceptChannel) {
					if (!array_eq(msg.node_id, to.get_our_node_id())) return false;
					to.as_ChannelMessageHandler().handle_accept_channel(from.get_our_node_id(), ldk.InitFeatures.constructor_known(), msg.msg);
				} else if (msg instanceof ldk.MessageSendEvent_SendFundingCreated) {
					if (!array_eq(msg.node_id, to.get_our_node_id())) return false;
					to.as_ChannelMessageHandler().handle_funding_created(from.get_our_node_id(), msg.msg);
				} else if (msg instanceof ldk.MessageSendEvent_SendFundingSigned) {
					if (!array_eq(msg.node_id, to.get_our_node_id())) return false;
					to.as_ChannelMessageHandler().handle_funding_signed(from.get_our_node_id(), msg.msg);
				} else {
					return false;
				}
			}
		}
	}
	return true;
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