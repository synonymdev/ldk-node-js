const fs = require("fs")
const dotenv = require("dotenv").config();
const dotenvexpand = require("dotenv-expand").expand(dotenv);
const debug = require('debug')('network')
const repl = require("repl");
const crypto = require("crypto");
const axios = require("axios");
const net = require("net");
const { connect_outbound, setup_inbound, setup_outbound } = require("./utils/ln_net");
const { syncBuiltinESMExports } = require("module");
const USER = process.env.BITCOIN_USER;
const PASS = process.env.BITCOIN_PASS;
const HOST = process.env.BITCOIN_CORS_RPC_URL;
const PORT = process.env.PORT;
var socketInboundId = 0; // eventually to be replaced by a hash function
var socketOutboundId = 0; // eventually to be replaced by a hash function
debug('booting %o', "a");
// ✅ Step 1: Initialize the FeeEstimator
// ✅ Step 2: Initialize the Logger
// ✅ Step 3: Initialize the BroadcasterInterface
// ✅ Step 4: Initialize Persist
// ✅ Step 5: Initialize the ChainMonitor
// ✅ Step 6: Initialize the KeysManager
// ❌ Step 7: Read ChannelMonitor state from disk
// ✅ Step 8: Initialize the ChannelManager
// ❌ Step 9: Sync ChannelMonitors and ChannelManager to chain tip
// ✅  Step 10: Give ChannelMonitors to ChainMonitor
// ✅  Step 11: Optional: Initialize the P2PGossipSync
// ✅ Step 12: Initialize the PeerManager
// ✅  Step 13: Initialize networking
// ❌ Step 14: Connect and Disconnect Blocks
// ❌ Step 15: Handle LDK Events
// ❌ Step 16: Initialize routing ProbabilisticScorer
// ❌ Step 17: Create InvoicePayer
// ❌ Step 18: Persist ChannelManager and NetworkGraph
// ✅  Step 19: Background Processing

const rpcclient = async (method, params) => {
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



function toHexString(byteArray) {
    return Array.prototype.map.call(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
}

 
async function start_ldk(ldk) {
    var info = await rpcclient("getblockchaininfo",[]);
    console.log("Connected to Bitcoin backend: ", info.chain)
    console.log('LDK startup successful. To view available commands: "help".');
  
    const ldk_data_dir = "./.ldk/"
    if (!fs.existsSync(ldk_data_dir)) {
        fs.mkdirSync(ldk_data_dir);
    }
    console.log("LDK logs are available at <your-supplied-ldk-data-dir-path>/.ldk/logs");
    
    // Step 1: Initialize the FeeEstimator
    const fee_est = ldk.FeeEstimator.new_impl({
        get_est_sat_per_1000_weight(confirmation_target) {
            switch (confirmation_target) {
            case ldk.ConfirmationTarget.LDKConfirmationTarget_Background:
                // insert code to retireve a background feerate
                //return rpc.estimateSmartFee(6, console.log)
                console.log("LDKConfirmationTarget_Background");
                return 1;
                break;
            case ldk.ConfirmationTarget.LDKConfirmationTarget_Normal:
                // <insert code to retrieve a normal (i.e. within ~6 blocks) feerate>
                console.log("LDKConfirmationTarget_Normal");
                return 5000;
                break;
            case ldk.ConfirmationTarget.LDKConfirmationTarget_HighPriority:
                // <insert code to retrieve a high-priority feerate>
                console.log("LDKConfirmationTarget_HighPriority");
                return 10000;
                break;
            default:
                return 253;
            }
        }
    });
    
    // Step 2: Initialize the Logger
    const logger = ldk.Logger.new_impl({
        log(record) {
            console.log(record.get_module_path() + ": " + record.get_args());
        }
    });
    
    // Step 3: Initialize the BroadcasterInterface
    var tx_broadcaster;
    const tx_broadcasted = new Promise((resolve, reject) => {
        tx_broadcaster = ldk.BroadcasterInterface.new_impl({ // Need to call the sendrawtransaction call for the RPC service, loggin this for now to determined when to implement
            broadcast_transaction(tx) { console.log("Tx Broadcast: " + tx); resolve(tx); }
        });
    });

    // Step 4: Initialize Persist
    const persister = ldk.Persist.new_impl({
        persist_new_channel(channel_id, data, update_id) {
            console.log("persist_new_channel")
            return ldk.Result_NoneChannelMonitorUpdateErrZ.constructor_ok();
        },
        update_persisted_channel(channel_id, update, data, update_id) {
            console.log("persist_new_channel")
            return ldk.Result_NoneChannelMonitorUpdateErrZ.constructor_ok();
        },
    });

    // Step 5: Initialize the ChainMonitor
    const chain_monitor = ldk.ChainMonitor.constructor_new(ldk.Option_FilterZ.constructor_none(), tx_broadcaster, logger, fee_est, persister);
    const chain_watch = chain_monitor.as_Watch();

    
    // Step 6: Initialize the KeysManager
    const keys_seed_path = ldk_data_dir + "keys_seed";

    var seed = null;
    if (!fs.existsSync(keys_seed_path)) {
        seed = crypto.randomBytes(32);
        fs.writeFileSync(keys_seed_path, seed);
    } else {
        seed = fs.readFileSync(keys_seed_path);
    }
    
    const keys_manager = ldk.KeysManager.constructor_new(seed, BigInt(42), 42);
    const keys_interface = keys_manager.as_KeysInterface();
    
    const config = ldk.UserConfig.constructor_default();
    
    const ChannelHandshakeConfig = ldk.ChannelHandshakeConfig.constructor_default();
    ChannelHandshakeConfig.set_announced_channel(true);
    config.set_channel_handshake_config(ChannelHandshakeConfig)
    console.log("Setting up new node at ", info.bestblockhash, info.blocks);

    const params = ldk.ChainParameters.constructor_new(ldk.Network.LDKNetwork_Regtest, ldk.BestBlock.constructor_new(Buffer.from(info.bestblockhash,'hex'),info.blocks));



    // Step 7: Read ChannelMonitor state from disk
    // const channelmonitors = persister.read_channel_monitors(keys_manager);
    //persister.read_channel_monitors();

    // Step 8: Initialize the ChannelManager
    const channel_manager = ldk.ChannelManager.constructor_new(fee_est, chain_watch, tx_broadcaster, logger, keys_interface, config, params);

    // ❌ Step 9: Sync ChannelMonitors and ChannelManager to chain tip


    //restarting_node = false;
    //let getinfo_resp = bitcoind_client.get_blockchain_info().await;

    // ❌ Step 10: Give ChannelMonitors to ChainMonitor ASSUMING WE ARE NOT STARTING A NEW NODE
    /*
    for item in chain_listener_channel_monitors.drain(..) {
		let channel_monitor = item.1 .0;
		let funding_outpoint = item.2;
		chain_monitor.watch_channel(funding_outpoint, channel_monitor).unwrap();
	}
    */
    // ❌ Step 11: Optional: Initialize the P2PGossipSync

    let genesis_hash = await rpcclient("getblockhash",[0]);
    let network_graph = ldk.NetworkGraph.constructor_new(Buffer.from(genesis_hash, "hex"), logger);
    let gossip_sync = ldk.P2PGossipSync.constructor_new(network_graph, new ldk.Option_AccessZ(), logger) 
    
    // ✅ Step 12: Initialize the PeerManager

    let lightning_msg_handler = ldk.MessageHandler.constructor_new({
        chan_handler: channel_manager,
        route_handler: gossip_sync
    });

    let ephemeral_bytes = crypto.randomBytes(32);
    
    const ignoring_custom_msg_handler = ldk.IgnoringMessageHandler.constructor_new();

    let peer_manager = ldk.PeerManager.constructor_new(
        channel_manager.as_ChannelMessageHandler(),
        gossip_sync.as_RoutingMessageHandler(),
        keys_interface.get_node_secret().res,
        ephemeral_bytes,
        logger,
        ignoring_custom_msg_handler.as_CustomMessageHandler()
    );
    
    // ## Running LDK
	// Step 13: Initialize networking

    // Step 14 Connect and Disconnect Blocks
    console.log("Sync data from chain", info.bestblockhash, info.blocks);

    // inline chain_sync_completed which is not available in TS :/
    //channel_manager.write();
    //network_graph.write();
    let event_handler = ldk.EventHandler.new_impl({
        handle_event: function(e) {
            console.log(">>>>>>> Handling Event here <<<<<<<", e)
          if (e instanceof Event.FundingGenerationReady) {
            // <insert code to handle this event>
          } else if (e instanceof Event.PaymentReceived) {
            // <insert code to handle this event>
          } else if (e instanceof Event.PaymentSent) {
            // <insert code to handle this event>
          } else if (e instanceof Event.PaymentPathFailed) {
            // <insert code to handle this event>
          } else if (e instanceof Event.PendingHTLCsForwardable) {
            // <insert code to handle this event>
          } else if (e instanceof Event.SpendableOutputs) {
            // <insert code to handle this event>
          } else if (e instanceof Event.PaymentForwarded) {
            // <insert code to handle this event>
          } else if (e instanceof Event.ChannelClosed) {
            // <insert code to handle this event>
          }
        }
       
    });

    // Step 15
    console.log("Local Node ID is " + Buffer.from(channel_manager.get_our_node_id()).toString('hex'))
    
    channel_manager.timer_tick_occurred();
    setInterval(() => {
        console.log("Loop");
        peer_manager.timer_tick_occurred();
        peer_manager.process_events();
        channel_manager.as_EventsProvider().process_pending_events(event_handler);
        chain_monitor.as_EventsProvider().process_pending_events(event_handler);
    },5000)
    
    var local = repl.start("> ");
    local.context.ldk = ldk
    local.context.persister = persister;
    local.context.km = keys_manager;
    local.context.gossip_sync = gossip_sync;
    local.context.channel_manager = channel_manager;
    local.context.network_graph = network_graph;

    local.context.chain_monitor = chain_monitor;

    local.context.help = (function() {
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

    local.context.nodeinfo = function() {
        var resp = {
            node_pubkey: Buffer.from(channel_manager.get_our_node_id()).toString('hex'),
            num_channels: 0,
            num_usable_channels: 0,
            local_balance_msat: 0,
            num_peers: 0
        };
        return resp;
    }
    local.context.steps = {
        network_graph,
        peer_manager,
        channel_manager,
        chain_monitor
    }

    local.context.listpeers = function() {
        return peer_manager.get_peer_node_ids().map((item) => toHexString(item));
    }

    // Requires imeplement a signer
    local.context.signmessage = function() {
        //ldk.util
    }

    local.context.openchannel = function(their_network_key, channel_value_satoshis, push_msat, user_channel_id, override_config) {
        user_channel_id = BigInt(0);
        override_config = ldk.UserConfig.constructor_default();
        return channel_manager.create_channel(Buffer.from(their_network_key,'hex'), BigInt(channel_value_satoshis), BigInt(push_msat),user_channel_id,override_config);
    }

    local.context.listchannels = function() {
        return channel_manager.list_channels();
    }

    local.context.connectpeer = function(peer) {
        socketOutboundId++;
        let peerParts = peer.split("@");
        var config = {
            host: peerParts[1].split(":")[0],
            port: parseInt(peerParts[1].split(":")[1])
        };

        const client = new net.Socket();
        client.on('end', () => {
            console.log('client disconnected');
        });

        client.on('data', (chunk) => {
            res = peer_manager.read_event(socketOutbound,chunk);
			if (!res.is_ok()) descriptor.disconnect_socket();
			else if (res.res) client.pause();
            peer_manager.process_events();
        })
    
        client.on("close", function() {
			peer_manager.socket_disconnected(socketOutboundId);
		});

        client.on('error', (err) => {
            throw err;
        });

        client.on('end', function() {
            console.log('Requested an end to the TCP connection');
            peer_manager.socket_disconnected(socketOutboundId);
            peer_manager.process_events();
        });
        
        client.on('drain', function() {
            if (sock_write_waiting) {
				if (!this_pm.write_buffer_space_avail(descriptor).is_ok()) {
					descriptor.disconnect_socket();
				}
			}
        });
        var sock_write_waiting = false;
        var socketOutbound = ldk.SocketDescriptor.new_impl({
            send_data: (data, resume_read) => {// currently does not handle large data streams, just tyring to get it to handshake with a peer
                if (resume_read) client.resume();

				if (sock_write_waiting) return 0;
				const written = client.write(data);
				if (!written) sock_write_waiting = true;
				return data.length;
            },
            disconnect_socket: () => {
                console.log('Closing socket');
                client.destroy();
            },
            eq: (a) => {// should check if this is the same socket
                return a.hash() == socketOutbound.hash();
            },
            hash: (s) => {
                return BigInt(socketOutboundId); // using hashes results in a failure, not sure if this is max int values 
            }
        });

        client.connect(config, function() {
            client.setTimeout(1000);
            console.log('TCP connection established.');
            var addy = Uint8Array.from([127,0,0,1]);
            var address = ldk.NetAddress.constructor_ipv4(addy,config.port);
            console.log(address)
            var outbound = peer_manager.new_outbound_connection(Buffer.from(peerParts[0], 'hex'), socketOutbound, address);
            socketOutbound.send_data(outbound.res, true);  
        });        
    }

    const clientInbound = net.createServer((c) => {
        var sock_write_waiting = false;
        var socketInbound = ldk.SocketDescriptor.new_impl({
            send_data: (data, resume_read) => {
                if (resume_read) c.resume();

				if (sock_write_waiting) return 0;
				const written = c.write(data);
				if (!written) sock_write_waiting = true;
				return data.length;
            },
            disconnect_socket: () => {
                c.destroy();
            },
            eq: (a) => {// should check if this is the same socket
                return a.hash() == socketInbound.hash();
            },
            hash: (s) => {
                return BigInt(socketInboundId); // using hashes results in a failure, not sure if this is max int values 
            }
        });

        console.log('client connected');

        c.on('end', () => {
            console.log('client disconnected');
        });

        c.on('data', (chunk) => {
            res = peer_manager.read_event(socketInbound,chunk);
			if (!res.is_ok()) descriptor.disconnect_socket();
			else if (res.res) c.pause();
            peer_manager.process_events();
        })
    
        c.on("close", function() {
			peer_manager.socket_disconnected(socketInbound);
		});

        c.on('error', (err) => {
            throw err;
        });

        c.on('end', function() {
            console.log('Requested an end to the TCP connection');
            peer_manager.socket_disconnected(socketInbound);
            peer_manager.process_events();
        });
        
        c.on('drain', function() {
            if (sock_write_waiting) {
				if (!this_pm.write_buffer_space_avail(descriptor).is_ok()) {
					descriptor.disconnect_socket();
				}
			}
        });
        
        c.on('timeout', function() {
            peer_manager.socket_disconnected(socketInbound);
            peer_manager.process_events();
            console.log("timeout!");
        });

        var addy = Uint8Array.from([127,0,0,1]);
        var address = ldk.NetAddress.constructor_ipv4(addy,config.port);
        console.log("Inbound")
        var inbound = peer_manager.new_inbound_connection(socketInbound, address);

    })
    
    clientInbound.listen(PORT, () => {
        console.log('server bound to' , PORT);
    });

    if (process.env.LN_REMOTE_HOST) { // Automatically connect for debugging purposes
        console.log("Automatically connect to peer")
        local.context.connectpeer(process.env.LN_REMOTE_HOST);
    }

    // Requires implementing rust-lightning-invoice https://github.com/rust-bitcoin/rust-lightning-invoice/
    local.context.getinvoice = function(amt_msat,expiry_secs) { 
        return channel_manager.create_inbound_payment(amt_msat,expiry_secs)

    }
}


import("lightningdevkit").then(ldk =>  {
    const compileWasm = (pathToWasm) => {
        const bytes = fs.readFileSync( pathToWasm)
        ldk
            .initializeWasmFromBinary(bytes)
            .then(async (ff) => {
                start_ldk(ldk);
            })
      };
      
      compileWasm("./node_modules/lightningdevkit/liblightningjs.wasm");
})

