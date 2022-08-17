const fs = require("fs")
const dotenv = require("dotenv").config();
const dotenvexpand = require("dotenv-expand").expand(dotenv);
const repl = require("repl");
const crypto = require("crypto");
const axios = require("axios");

const USER = process.env.BITCOIN_USER;
const PASS = process.env.BITCOIN_PASS;
const HOST = process.env.BITCOIN_CORS_RPC_URL;
const NETWORK_INTERFACE = process.env.NETWORK_INTERFACE;
const PORT = process.env.PORT;

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

 
async function start_ldk(ldk, NodeLDKNet) {
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
                //console.log("LDKConfirmationTarget_Background");
                return 1;
                break;
            case ldk.ConfirmationTarget.LDKConfirmationTarget_Normal:
                // <insert code to retrieve a normal (i.e. within ~6 blocks) feerate>
                //console.log("LDKConfirmationTarget_Normal");
                return 5000;
                break;
            case ldk.ConfirmationTarget.LDKConfirmationTarget_HighPriority:
                // <insert code to retrieve a high-priority feerate>
                //console.log("LDKConfirmationTarget_HighPriority");
                return 10000;
                break;
            default:
                return 253;
            }
        }
    });
    
    // Step 2: Initialize the Logger
    const log_file_path = ldk_data_dir + "/debug.log";

    const log_file = fs.createWriteStream(log_file_path, {flags : 'w'});

    const logger = ldk.Logger.new_impl({
        log(record) {
            log_file.write(record.get_module_path() + ": " + record.get_args() + "\n");
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
    //ChannelHandshakeConfig.set_announced_channel(true);
    //config.set_channel_handshake_config(ChannelHandshakeConfig)
    //console.log("Setting up new node at ", info.bestblockhash, info.blocks);

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
          if (e instanceof ldk.Event_FundingGenerationReady) {
            //console.log(e)
            var final_tx = 0;
            console.log(e.temporary_channel_id, e.counterparty_node_id, final_tx)
            //channel_manager.funding_transaction_generated(e.temporary_channel_id, e.counterparty_node_id, final_tx);
            // <insert code to handle this event>
          } else if (e instanceof Event.Event_PaymentReceived) {
            // <insert code to handle this event>
          } else if (e instanceof Event.Event_PaymentSent) {
            // <insert code to handle this event>
          } else if (e instanceof Event.Event_PaymentPathFailed) {
            // <insert code to handle this event>
          } else if (e instanceof Event.Event_PendingHTLCsForwardable) {
            // <insert code to handle this event>
          } else if (e instanceof Event.Event_SpendableOutputs) {
            // <insert code to handle this event>
          } else if (e instanceof Event.Event_PaymentForwarded) {
            // <insert code to handle this event>
          } else if (e instanceof Event.Event_ChannelClosed) {
            // <insert code to handle this event>
          }
        }
       
    });

    // Step 15
    console.log("Local Node ID is " + Buffer.from(channel_manager.get_our_node_id()).toString('hex'))
    
    channel_manager.timer_tick_occurred();
    setInterval(() => {
        peer_manager.timer_tick_occurred();
        peer_manager.process_events();
        channel_manager.as_EventsProvider().process_pending_events(event_handler);
        chain_monitor.as_EventsProvider().process_pending_events(event_handler);
    },2000)

    const net_handler = new NodeLDKNet(peer_manager);    
    await net_handler.bind_listener(NETWORK_INTERFACE, PORT);
    console.log("Listening on " ,  Buffer.from(channel_manager.get_our_node_id()).toString('hex') + "@" + NETWORK_INTERFACE + ":" + PORT );
    
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

    local.context.openchannel = function(peer, channel_value_satoshis, push_msat, user_channel_id, override_config) {
        user_channel_id = BigInt(0);
        override_config = ldk.UserConfig.constructor_default();

        //connect_peer_if_necessary
        let peerParts = peer.split("@");
        var config = {
            pubkey: peerParts[0],
            host: peerParts[1].split(":")[0],
            port: parseInt(peerParts[1].split(":")[1])
        };

        var peers = peer_manager.get_peer_node_ids().map((item) => toHexString(item));
        console.log("needle", peers, config.pubkey)
        if (!peers.includes(config.pubkey)) {
            console.log("Connecting to " ,config )
            const net_handler = new NodeLDKNet(peer_manager);
            net_handler.connect_peer(config.host, config.port, Buffer.from(config.pubkey, 'hex')).then(() => {
                return channel_manager.create_channel(Buffer.from(peer,'hex'), BigInt(channel_value_satoshis), BigInt(push_msat),user_channel_id,override_config);        
            })
        } else {
            console.log(Buffer.from(peer,'hex'), BigInt(channel_value_satoshis), BigInt(push_msat),BigInt(user_channel_id),override_config)
            return channel_manager.create_channel(Buffer.from(peer,'hex'), BigInt(channel_value_satoshis), BigInt(push_msat),user_channel_id,override_config);
        }
    }

    local.context.listchannels = function() {
        var channelArr = [];
        channel_manager.list_channels().forEach((ChannelDetails) => {
            channelArr.push({
                channel_id: toHexString(ChannelDetails.get_channel_id()),
                funding_txid: toHexString(ChannelDetails.get_funding_txo().get_txid()),
                peer_pubkey: toHexString(ChannelDetails.get_counterparty().get_node_id()),
                is_channel_ready: Boolean(ChannelDetails.get_is_channel_ready()),
                channel_value_satoshis: ChannelDetails.get_channel_value_satoshis(),
                local_balance_msat: ChannelDetails.get_balance_msat(),
                channel_can_send_payments: Boolean(ChannelDetails.get_is_usable()),
                public: Boolean(ChannelDetails.get_is_public())
            })
        })
        return channelArr;
    }

    local.context.connectpeer = async function(peer) {
        let peerParts = peer.split("@");
        var config = {
            host: peerParts[1].split(":")[0],
            port: parseInt(peerParts[1].split(":")[1])
        };
        
        const net_handler = new NodeLDKNet(peer_manager);
        await net_handler.connect_peer(config.host, config.port, Buffer.from(peerParts[0], 'hex'));        
    }


    if (process.env.LN_REMOTE_HOST) { // Automatically connect for debugging purposes
        console.log("Automatically connect to peer")
        local.context.connectpeer(process.env.LN_REMOTE_HOST);
    }

    // Requires implementing rust-lightning-invoice https://github.com/rust-bitcoin/rust-lightning-invoice/
    local.context.getinvoice = function(amt_msat,expiry_secs) { 
        return channel_manager.create_inbound_payment(amt_msat,expiry_secs)

    }
}

/*
Using sub lightningdevkit lib due to initializeWasm issues 
*/
import("./node_modules/lightningdevkit-node-net/node_modules/lightningdevkit/index.mjs").then(ldk =>  {
    const compileWasm = (pathToWasm) => {
        const bytes = fs.readFileSync( pathToWasm)
        ldk
            .initializeWasmFromBinary(bytes)
            .then(async (ff) => {
                const { NodeLDKNet } = await import('lightningdevkit-node-net');
                start_ldk(ldk, NodeLDKNet);
            })
      };
      
      compileWasm("./node_modules/lightningdevkit-node-net/node_modules/lightningdevkit/liblightningjs.wasm");
})

