import { ChannelManagerConstructor, Event } from "lightningdevkit";

class YourObj extends ChannelManagerConstructor {
  handle_event(e) {
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

  persist_manager(channel_manager_bytes) {
    // <insert code to persist channel_manager_bytes to disk and/or backups>
  }
}

export default YourObj;
