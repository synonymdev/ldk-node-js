// Import everything
import * as ldk from "lightningdevkit";
const axios = require("axios");
const crypto = require("crypto");
var run_tests_node = null;
(async () => {
  var { run_tests_node } = await import("lightningdevkit/test/tests.mjs");
})()

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

var socketId = 0; // eventually to be replaced by a hash function

const USER = "user";
const PASS = "password";
const HOST = "http://localhost:8010";
function toHexString(byteArray) {
  return Array.prototype.map.call(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

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


window.ldk = {}

window.ldk.rpcclient = async (method, params) => {
	const data = { jsonrpc: '1.0', id: Math.random(), method, params };
	const res = await axios.post(HOST, data, {
		method: 'POST',
        auth: {
            username: USER,
            password: PASS
        },
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		}
	}).catch((e) => {
        console.log(e)
    });

	return res.data.result;
};


window.ldk.start = async () => {
  console.log('LDK startup successful. To view available commands: "help".');
  
  console.log("LDK logs are available at LocalStorage logs");
  window.ldk.lib = ldk;
  // Connect to bitcoin RPC service
  var info = await window.ldk.rpcclient("getblockchaininfo",[]);
  
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

  const config = ldk.UserConfig.constructor_default();
	const params = ldk.ChainParameters.constructor_new(ldk.Network.LDKNetwork_Regtest, ldk.BestBlock.constructor_from_genesis(ldk.Network.LDKNetwork_Regtest));
  var channel_manager = ldk.ChannelManager.constructor_new(fee_estimator, chain_watch, tx_broadcaster, logger, keys_interface, config, params)

  let genesis_hash = await window.ldk.rpcclient("getblockhash",[0]);
  console.log("here")

  let network_graph = ldk.NetworkGraph.constructor_new(Buffer.from(genesis_hash, "hex"), logger);
  let gossip_sync = ldk.P2PGossipSync.constructor_new(network_graph, new ldk.Option_AccessZ(), logger) // removed in the new bindings

  // === Running LDK

  // Step 14. Keep LDK Up-to-date with Chain Info
  let lightning_msg_handler = ldk.MessageHandler.constructor_new({
    chan_handler: channel_manager,
    route_handler: gossip_sync
  });

  let ephemeral_bytes = crypto.randomBytes(32);
  var message_handler_chan_handler_arg = new ldk.ChannelMessageHandler.constructor()
  const ignoring_custom_msg_handler = ldk.IgnoringMessageHandler.constructor_new();

  let peer_manager = ldk.PeerManager.constructor_new(
      channel_manager.as_ChannelMessageHandler(),
      gossip_sync.as_RoutingMessageHandler(),
      keys_interface.get_node_secret().res,
      ephemeral_bytes,
      logger,
      ignoring_custom_msg_handler.as_CustomMessageHandler()
  );
  console.log("Local Node ID is " + Buffer.from(channel_manager.get_our_node_id()).toString('hex'))
  //window.ldk = ldk
  window.ldk.console = {}
  window.ldk.console.help = (function() {
      var resp = `
      openchannel pubkey@host:port <amt_satoshis>
      sendpayment <invoice>
      keysend <dest_pubkey> <amt_msat>
      getinvoice <amt_millisatoshis>
      connectpeer pubkey@host:port
      listchannels
      listpayments
      closechannel <channel_id>
      forceclosechannel <channel_id>
      nodeinfo
      listpeers
      signmessage <message></message>`;
      return resp;
  })()

  window.ldk.console.connectpeer = function(peer) {
    socketId++;
    let peerParts = peer.split("@");
    var config = {
        host: peerParts[1].split(":")[0],
        port: parseInt(peerParts[1].split(":")[1])
    };
    console.log(config)

    //var client = new WebSocket("ws://localhost:19735");
    var addy = Uint8Array.from([127,0,0,1]);
    var address = ldk.NetAddress.constructor_ipv4(addy,config.port);
   // var inbound = peer_manager.new_outbound_connection(Buffer.from(peerParts[0], 'hex'), socket, address);
   // socket.send_data(inbound.res, true);  
   /*client.addEventListener('open', (event) => {
    console.log("Connected to peer")
    });
    client.addEventListener('error', (event) => {
      console.log("we got an error");
    })
  
    client.addEventListener('onmessage', (chunk) => {
        console.log("bytes written", client.bytesWritten)
        peer_manager.read_event(socket, chunk);
        //var writerBufferSpaceAvail = peer_manager.write_buffer_space_avail(socket).is_ok();
        //if (writerBufferSpaceAvail) {
            console.log("process")
            peer_manager.process_events();
        //} else {
          //  console.log("NOT DONE!!!!")
        //}
    })
  
    client.addEventListener('end', () => {
      console.log('Requested an end to the TCP connection');
    });
    
    
    client.addEventListener('timeout', () => {
      peer_manager.socket_disconnected(socket);
        peer_manager.process_events();
        console.log("timeout!");
    });
    var socket = ldk.SocketDescriptor.new_impl({
        id : crypto.createHash('sha256').update(Math.random().toString()),
        send_data: (data, resume_read) => {// currently does not handle large data streams, just tyring to get it to handshake with a peer
            console.log('Send data');
            client.write(data)
            console.log(data.length, client.bytesWritten)
            return client.bytesWritten;
        },
        disconnect_socket: () => {
            console.log('Closing socket');
            client.close()

        },
        eq: (a) => {// should check if this is the same socket
            console.log('EQ');
            return a.hash() == socket.hash();
        },
        hash: (s) => {
            console.log("socketId", socketId)
            //var hash = "0x" + crypto.createHash('sha256').update(Math.random().toString()).digest('hex');
            return BigInt(socketId); // using hashes results in a failure, not sure if this is max int values 
        }
    });
*/
  }

  window.ldk.console.listpeers = function() {
    return peer_manager.get_peer_node_ids().map((item) => toHexString(item));
  }

  window.ldk.console.getinvoice = function(amt_msat,expiry_secs) { 

    /*
    inbound_payments = 
    channel_manager, 
    keys_manager,
    network = ldk.Network.LDKNetwork_Testnet;
    create_invoice_from_channelmanager(
        channel_manager,
    keys_manager,
    currency,
    amt_msat,
    "ldk-tutorial-node",
    expiry_secs
    )*/
    return channel_manager.create_inbound_payment(amt_msat,expiry_secs)

}
//	chan_man.as_ChannelMessageHandler().peer_connected(chan_man_b.get_our_node_id(), ldk.Init.constructor_new(ldk.InitFeatures.constructor_known(), ldk.Option_NetAddressZ.constructor_none()));
//	chan_man_b.as_ChannelMessageHandler().peer_connected(chan_man_a.get_our_node_id(), ldk.Init.constructor_new(ldk.InitFeatures.constructor_known(), ldk.Option_NetAddressZ.constructor_none()));
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
          var { run_tests_node } = await import("lightningdevkit/test/tests.mjs");

          run_tests_node(bytes)

          await window.ldk.start()
        })
    });
};

compileWasm("liblightningjs.wasm");