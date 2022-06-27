function connect_outbound(peer_manager, node_id, addr) {
    var socket = net.connect({host:'127.0.0.1',port:'9735'})
    console.log(socket);
}

function setup_inbound(peer_manager, stream) {

}

function setup_outbound( peer_manager, node_id, stream) {
}

module.exports = {
	connect_outbound,
	setup_inbound,
    setup_outbound
}
