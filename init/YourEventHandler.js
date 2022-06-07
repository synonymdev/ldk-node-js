import { EventHandler, EventsProvider } from "lightningdevkit";

class YourEventhandler extends EventHandler {
  constructor(events) {
    super(events);
  }

  handle_event(event) {
    events.push(event);
  }
}

export default YourEventhandler;
