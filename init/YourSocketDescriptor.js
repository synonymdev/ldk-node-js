import { SocketDescriptor } from "lightningdevkit";

class YourSocketDescriptor extends SocketDescriptor {
  constructor(socket) {
    super();
    this.socket = socket;
    this.socket.on('data', function(chunk) {
      console.log("we got data");
      console.log(chunk);
    })

    this.socket.on('end', function() {
      console.log('Requested an end to the TCP connection');
  });
  

  }

  send_data(data, resume_read) {
    console.log("send_data has fired off successfully. DATA: " + data);
    console.log(data);

    this.socket.connect(config, function() {
      this.socket.send(data);
    })

    this.socket.onerror = (e) => {
     // console.log(e)
    };
  }

  disconnect_socket() {
    // not to sure what we are going to do here
  }

  eq() {
    // need too sure what we are going to do here to
  }

  hash() {
    // not too sure what we are going to do here
  }
}
export default YourSocketDescriptor;
