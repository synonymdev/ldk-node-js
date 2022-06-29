const fs = require("fs")
const repl = require("repl");
const crypto = require("crypto");
const axios = require("axios");
const net = require("net");
const { connect_outbound, setup_inbound, setup_outbound } = require("./utils/ln_net");
const { syncBuiltinESMExports } = require("module");
const USER = 'user';
const PASS = 'password';
const HOST = "http://localhost:8010/"
//const YourSocketDescriptor = require("./init/YourSocketDescriptor")


// ✅ Step 1: Initialize the FeeEstimator
// ✅ Step 2: Initialize the Logger
// ✅ Step 3: Initialize the BroadcasterInterface
// ✅ Step 4: Initialize Persist
// ✅ Step 5: Initialize the ChainMonitor
// ✅ Step 6: Initialize the KeysManager
// ❌ Step 7: Read ChannelMonitor state from disk
// ✅ Step 8: Initialize the ChannelManager
// ❌ Step 9: Sync ChannelMonitors and ChannelManager to chain tip
// ❌ Step 10: Give ChannelMonitors to ChainMonitor
// ❌ Step 11: Optional: Initialize the P2PGossipSync
// ✅ Step 12: Initialize the PeerManager
// ❌ Step 13: Initialize networking
// ❌ Step 14: Connect and Disconnect Blocks
// ❌ Step 15: Handle LDK Events
// ❌ Step 16: Initialize routing ProbabilisticScorer
// ❌ Step 17: Create InvoicePayer
// ❌ Step 18: Persist ChannelManager and NetworkGraph
// ❌ Step 19: Background Processing

//const RpcClient = require("bitcoind-rpc")
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
            return 253;
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
        read_channel_monitors(keys_manager) {
            console.log("persist_new_channel")
            return ldk.Result_NoneChannelMonitorUpdateErrZ.constructor_ok();
        }
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
    const params = ldk.ChainParameters.constructor_new(ldk.Network.LDKNetwork_Testnet, ldk.BestBlock.constructor_from_genesis(ldk.Network.LDKNetwork_Testnet));

    // Step 7: Read ChannelMonitor state from disk
    //const channelmonitors = persister.read_channel_monitors(keys_manager);
    //persister.read_channel_monitors();

    // Step 8: Initialize the ChannelManager
    const channel_manager = ldk.ChannelManager.constructor_new(fee_est, chain_watch, tx_broadcaster, logger, keys_interface, config, params);

    // ❌ Step 9: Sync ChannelMonitors and ChannelManager to chain tip
    // ❌ Step 10: Give ChannelMonitors to ChainMonitor
    // ❌ Step 11: Optional: Initialize the P2PGossipSync

    let genesis_hash = await rpcclient("getblockhash",[0]);
    let network_graph = ldk.NetworkGraph.constructor_new(Buffer.from(genesis_hash, "hex"));
    let net_graph_msg_handler = ldk.NetGraphMsgHandler.constructor_new(network_graph, new ldk.Option_AccessZ(), logger)
    
    // ✅ Step 12: Initialize the PeerManager
    
    let lightning_msg_handler = ldk.MessageHandler.constructor_new({
        chan_handler: channel_manager,
        route_handler: net_graph_msg_handler
    });

    let ignoring_custom_msg_handler = ldk.IgnoringMessageHandler.constructor_new({})
    let ephemeral_bytes = crypto.randomBytes(32);
    var message_handler_chan_handler_arg = new ldk.ChannelMessageHandler.constructor()


    let peer_manager = ldk.PeerManager.constructor_new(
        message_handler_chan_handler_arg,
        lightning_msg_handler,
        keys_interface.get_node_secret().res,
        ephemeral_bytes,
        logger,
        ignoring_custom_msg_handler
    );
    // ## Running LDK
	// Step 13: Initialize networking

    console.log("Local Node ID is " + Buffer.from(channel_manager.get_our_node_id()).toString('hex'))
    var local = repl.start("> ");
    local.context.ldk = ldk
    local.context.persister = persister;
    local.context.km = keys_manager;
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
        return peer_manager.get_peer_node_ids()
    }

    // Requires imeplement a signer
    local.context.signmessage = function() {
        //ldk.util
    }

    // Requires implementing rust-lightning-invoice https://github.com/rust-bitcoin/rust-lightning-invoice/
    local.context.getinvoice = function() {

    }

    local.context.connectpeer = function(peer) {
        var peer = "03a8f5903fe4b1923e5fcb5adc801fac7cced2d1f7acc9b4346c32e76b5454893a@127.0.0.1:9735";
        let peerParts = peer.split("@");
        var config = {
            host: peerParts[1].split(":")[0],
            port: parseInt(peerParts[1].split(":")[1])
        };
        //console.log(config);
        const client = new net.Socket();
        client.on('error', function(chunk) {
            console.log("we got an error");
        })
        
        client.on('data', function(chunk) {
            console.log("bytes written", client.bytesWritten)
            console.log("we got data");
            if (peer_manager.write_buffer_space_avail(socket).is_ok()) {
                console.log(peer_manager.read_event(socket, chunk).is_ok())
                peer_manager.process_events();
            }
        })
      
        client.on('end', function() {
            console.log('Requested an end to the TCP connection');
        });
        
        client.on('drain', function() {
            console.log("drain!");
        });
        
        client.on('timeout', function() {
            console.log("timeout!");
        });
        var socket = ldk.SocketDescriptor.new_impl({
            send_data: (data, resume_read) => {// currently does not handle large data streams, just tyring to get it to handshake with a peer
                console.log('Send data',resume_read);
                console.log(client.write(data));
                if (client.bytesWritten !== data.length) { 
                    console.log("We had a writing issue")
                }
                return client.bytesWritten;
            },
            disconnect_socket: () => {
                console.log('Closing socket');
                client.close()

            },
            eq: (a) => {// should check if this is the same socket
                console.log('EQ');
                return true;
            },
            hash: () => {
                return crypto.createHash('sha256').update(Math.random().toString());
            }
        });

        ldk
        client.connect(config, function() {
            client.setTimeout(10000);
            console.log('TCP connection established.');

            var address = ldk.NetAddress.constructor_ipv4(config.host.split("."),config.port);
            /*
            var i = new Uint8Array(16)
            i[0] = 0xfe;
            i[1] = 0x80;
            i[15] = 0x01;
            var address = ldk.NetAddress.constructor_ipv6(new Uint8Array(16),config.port);
            */
            
            var inbound = peer_manager.new_outbound_connection(Buffer.from(peerParts[0], 'hex'), socket, address);
            
            
            
            console.log(socket.send_data(inbound.res, true).length)
            
        });        
    }
    local.context.connectpeer();

    
    local.context.getinvoice = function(amt_msat,expiry_secs) {
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

