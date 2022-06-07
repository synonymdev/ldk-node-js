import { RoutingMessageHandler } from "lightningdevkit";

class YourRoutingMessageHandler extends RoutingMessageHandler {
  handle_node_announcement(msg) {
    // do something here
  }
}

export default YourRoutingMessageHandler;
