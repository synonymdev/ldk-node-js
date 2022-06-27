import { BroadcasterInterface } from "lightningdevkit";

class YourBroadcaster extends BroadcasterInterface {
  constructor(resolve) {
    super(resolve);    
  }

  broadcast_transaction(tx) {
    // <insert code to broadcast the given transaction here>
    console.log("Tx Broadcast: " + tx);
    //this.resolve(tx);
    return rpc.sendRawTransaction("tx")
    
  }
}

export default YourBroadcaster;
