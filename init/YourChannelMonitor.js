// TODO - Step 10: https://lightningdevkit.org/tutorials/build_a_node_in_java/
import { ChannelMonitor, Result_NoneChannelMonitorUpdateErrZ } from "lightningdevkit";

class YourChannelMonitor extends ChannelMonitor {

/*
// Initialize the array where we'll store the `ChannelMonitor`s read from disk.
//let ArrayList = []

// For each monitor stored on disk, deserialize it and place it in
// `channel_monitors`./*
for (... : monitor_files) {
    byte[] channel_monitor_bytes = // read the bytes from disk the same way you
                                   // wrote them in Step 5
	channel_monitor_list.add(channel_monitor_bytes);
}

// Convert the ArrayList into an array so we can pass it to
// `ChannelManagerConstructor` in Step 11.
//final byte[][] channel_monitors = (byte[][])channel_monitor_list.toArray(new byte[1][]);

return Result_NoneChannelMonitorUpdateErrZ.constructor_ok()
*/
}

export default YourChannelMonitor;
