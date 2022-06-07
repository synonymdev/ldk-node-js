import { ChannelMessageHandler } from "lightningdevkit";

class YourChannelMessageHandler extends ChannelMessageHandler {
  handle_open_channel(nodeId, features, msg) {
    // do something here
  }
}

export default YourChannelMessageHandler;
