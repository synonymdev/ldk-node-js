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
} from "lightningdevkit";
import YourFeeEstimator from "./init/YourFeeEstimator";
import YourLogger from "./init/YourLogger";
import YourBroadcaster from "./init/YourBroadcaster";
import initNetworkGraph from "./init/NetworkGraph";
import YourPersister from "./init/YourPersister";
import YourFilter from "./init/YourFilter";
// import YourObj from "./init/YourObj"; // not too sure how to implement this one
import YourEventhandler from "./init/YourEventHandler";
import YourSocketDescriptor from "./init/YourSocketDescriptor";
import initChainMonitor from "./init/ChainMonitor";
import initKeysManager from "./init/KeysManager";
import YourChannelMessageHandler from "./init/YourChannelMessageHandler";
import YourRoutingMessageHandler from "./init/YourRoutingMessageHandler";
import { run_tests_web } from "lightningdevkit/test/tests.mjs";

const getPeerManager = () => {
  console.log("this is working...");
  const channelMessageHandler = ChannelMessageHandler.new_impl(
    new YourChannelMessageHandler()
  );
  const routingMessageHandler = RoutingMessageHandler.new_impl(
    new YourRoutingMessageHandler()
  );

  const nodeSecret = new Uint8Array(32);
  const ephemeralRandomData = new Uint8Array(32);
  const peerManager = PeerManager.constructor_new(
    channelMessageHandler,
    routingMessageHandler,
    nodeSecret.fill(4, 1, 3),
    ephemeralRandomData.fill(4, 1, 3),
    Logger.new_impl(new YourLogger())
  );
  return peerManager;
};

const fromHexString = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const getChannelManager = () => {
  const feeEstimator = FeeEstimator.new_impl(new YourFeeEstimator());
  const logger = Logger.new_impl(new YourLogger());
  let broadcaster;
  const tx_broadcasted = new Promise((resolve, reject) => {
    broadcaster = BroadcasterInterface.new_impl(new YourBroadcaster(resolve));
  });

  const persister = Persist.new_impl(new YourPersister());
  const chainMonitor = initChainMonitor(
    broadcaster,
    logger,
    feeEstimator,
    persister
  );
  const chainWatch = chainMonitor.as_Watch();
  const keysManager = initKeysManager();
  const keysInterface = keysManager.as_KeysInterface();
  const config = UserConfig.constructor_default();
  const params = ChainParameters.constructor_new(
    Network.LDKNetwork_Testnet,
    BestBlock.constructor_from_genesis(Network.LDKNetwork_Testnet)
  );

  return [
    ChannelManager.constructor_new(
      feeEstimator,
      chainWatch,
      broadcaster,
      logger,
      keysInterface,
      config,
      params
    ),
    tx_broadcasted,
  ];

  // const customEventHandler = new YourObj();
  // console.log(customEventHandler);
  // const filter = Filter.new_impl(new YourFilter());
  // console.log(filter);
};

const array_eq = (a, b) => {
  return a.length == b.length && a.every((v, idx) => v == b[idx]);
};

const testMessageExchange = async () => {
  const peerA = getChannelManager();
  const peerB = getChannelManager();
  const chanManA = peerA[0];
  const chanManB = peerB[0];

  chanManA
    .as_ChannelMessageHandler()
    .peer_connected(
      chanManB.get_our_node_id(),
      Init.constructor_new(InitFeatures.constructor_known())
    );
  chanManB
    .as_ChannelMessageHandler()
    .peer_connected(
      chanManA.get_our_node_id(),
      Init.constructor_new(InitFeatures.constructor_known())
    );

  const chanCreateError = chanManA.create_channel(
    chanManB.get_our_node_id(),
    BigInt(0),
    BigInt(400),
    BigInt(0),
    UserConfig.constructor_default()
  );

  let socket = new WebSocket("ws://127.0.0.1:8080/proxy");

  // work towards the SocketDescriptor + PeerManager integration
  const socketDescriptor = SocketDescriptor.new_impl(
    new YourSocketDescriptor(socket)
  );
  const peerManager = getPeerManager();
  const node_id = fromHexString(
    "02f8d1cac9a74c91275e28bab7f45d68c6e877829abd22888fb3bb73565217f769"
  );
  console.log(node_id);
  const initial_send = peerManager.new_outbound_connection(
    node_id,
    socketDescriptor
  );

  socket.onmessage = (event) => {
    console.log("we got something back from the socket");
    console.log(event.data);
    event.data.arrayBuffer().then((buffer) => {
      const result = new Uint8Array(buffer);
      const event_result = peerManager.read_event(socketDescriptor, result);
      console.log(
        "Printing out the results from Result_boolPeerHandleErrorZ below:"
      );
      console.log(event_result.res);
    });
  };

  const response = socketDescriptor.send_data(initial_send.res);
  console.log("socket descriptor response: ", response);

  if (chanCreateError.is_ok()) return false;
  if (!(chanCreateError instanceof Result__u832APIErrorZ_Err)) return false;
  if (!(chanCreateError instanceof APIError_APIMisuseError)) return false;
  if (
    chanCreateError.err.err !=
    "Channel value must be at least 1000 satoshis. It was 0"
  )
    return false;

  const chanCreateRes = chanManA.create_channel(
    chanManB.get_our_node_id(),
    BigInt(1000000),
    BigInt(400),
    BigInt(0),
    UserConfig.constructor_default()
  );
  if (!chanCreateRes.is_ok()) return false;

  const events = [];
  const eventHandler = EventHandler.new_impl(new EventHandler(events));

  chanManA.as_EventsProvider().process_pending_events(eventHandler);
  if (events.length != 1) return false;
  if (!(events[0] instanceof Event_FundingGenerationReady)) return false;

  // (very) manually create a funding transaction
  const witness_pos = events[0].output_script.length + 58;
  const funding_tx = new Uint8Array(witness_pos + 7);
  funding_tx[0] = 2; // 4-byte tx version 2
  funding_tx[4] = 0;
  funding_tx[5] = 1; // segwit magic bytes
  funding_tx[6] = 1; // 1-byte input count 1
  // 36 bytes previous outpoint all-0s
  funding_tx[43] = 0; // 1-byte input script length 0
  funding_tx[44] = 0xff;
  funding_tx[45] = 0xff;
  funding_tx[46] = 0xff;
  funding_tx[47] = 0xff; // 4-byte nSequence
  funding_tx[48] = 1; // one output
  assign_u64(funding_tx, 49, events[0].channel_value_satoshis);
  funding_tx[57] = events[0].output_script.length; // 1-byte output script length
  funding_tx.set(events[0].output_script, 58);
  funding_tx[witness_pos] = 1;
  funding_tx[witness_pos + 1] = 1;
  funding_tx[witness_pos + 2] = 0xff; // one witness element of size 1 with contents 0xff
  funding_tx[witness_pos + 3] = 0;
  funding_tx[witness_pos + 4] = 0;
  funding_tx[witness_pos + 5] = 0;
  funding_tx[witness_pos + 6] = 0; // lock time 0

  const funding_res = chanManA.funding_transaction_generated(
    events[0].temporary_channel_id,
    funding_tx
  );
  if (!(funding_res instanceof Result_NoneAPIErrorZ_OK)) return false;
  if (!testMessageExchange(chanManA, chanManB)) return false;

  const tx_broadcasted = await peerA[1];
  if (!array_eq(tx_broadcasted, funding_tx)) return false;

  return true;
};

const runTests = (pathToWasm) => {
  const result = run_tests_web(pathToWasm);
  try {
    if (result) {
      console.log("All Tests Passed!");
    } else {
      console.log("Some Tests Failed!");
      console.log(result);
    }
  } catch (e) {
    console.log("Error occured");
    console.error(e);
  }
};
const compileWasm = (pathToWasm) => {
  fetch(pathToWasm)
    .then((response) => {
      return response.arrayBuffer();
    })
    .then((bytes) => {
      ldk
        .initializeWasmFromBinary(bytes)
        .then((ff) => {
          window.ldk = ldk
          window.FeeEstimator = FeeEstimator
          const result = testMessageExchange();
          result
            ? console.log("TESTMESSAGEEXCHANGE WORKED!")
            : console.log("WE BROKE SOMETHING");
        })
        .catch((err) => console.error(err));
    });
};

compileWasm("liblightningjs.wasm");