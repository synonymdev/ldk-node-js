const fs = require("fs")
const repl = require("repl");
const crypto = require("crypto");
const axios = require("axios");
const net = require("net");
const { connect_outbound, setup_inbound, setup_outbound } = require("./utils/ln_net");
const { syncBuiltinESMExports } = require("module");
const USER = 'user';
const PASS = 'password';
const HOST = "http://localhost:8080/bitcoin/"
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
            console.log(record.get_module_path() + ": whoop " + record.get_args());
        }
    });
    
    // Step 3: Initialize the BroadcasterInterface
    var tx_broadcaster;
    const tx_broadcasted = new Promise((resolve, reject) => {
        tx_broadcaster = ldk.BroadcasterInterface.new_impl({
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
        //var peer = "0374f296fbe03d451d9bd182ae7fc797a2432b112717b029607b4e3c623a9282f9@127.0.0.1:9735";
        let peerParts = peer.split("@");
        var config = {
            host: peerParts[1].split(":")[0],
            port: parseInt(peerParts[1].split(":")[1])
        };
        //console.log(config);
        const client = new net.Socket();
        client.on('error', function(chunk) {
            console.log("we got and error");
        })
        
        client.on('data', function(chunk) {
            console.log("we got data");
            peer_manager.write_buffer_space_avail(socket);
            peer_manager.read_event(socket, chunk)
            //console.log(chunk);
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
            send_data: (data) => {
                console.log('Send data');
                client.write(data);
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
                console.log('Hash');
                return crypto.createHash('sha256').update(Math.random().toString()).digest('hex');
            }
        });

        client.connect(config, function() {
            client.setTimeout(0);
            console.log('TCP connection established.');
            var address = ldk.NetAddress.constructor_ipv4(config.host.split("."),config.port);
            var d = peer_manager.new_in
            var m = peer_manager.new_outbound_connection(Buffer.from(peerParts[0], 'hex'), socket, address);
            socket.send_data(m.res)
            
        });        
    }
    //local.context.connectpeer();
   

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
      
      compileWasm("node_modules/lightningdevkit/liblightningjs.wasm");
})

