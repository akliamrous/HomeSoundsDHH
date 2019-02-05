SERVER_ADD="http://128.208.4.172:8080";

/** Client id from commmand line **/
const id = process.argv.slice(2);

var io = require('socket.io-client');
var socket = io.connect(SERVER_ADD, {'reconnection': true, 'timeout': 5*86400*1000}); //Timeout: five days, Reconnect: True, each reconnect attempt takes place after ~500-1500ms depending on a randomization factor. Max time for reconnect attempt is five seconds.

socket.on('connect', function () {
    console.log("Client " + id +  ": connected to server!");
    socket.emit('handshake', id);
});

var spawn = require("child_process").spawn;
var child = spawn('python',["./VolumeMeter.py"] ); 

child.stdout.on('data', function(data) { 
	if(socket.connected)
		socket.emit('responseFromDataClient', JSON.stringify({ dataFromDataClient: data.toString(), clientid: id}));
	//console.log('Sent to server: ' + data.toString()); //Print data sent to server
});

/** Error Handling. See: https://socket.io/docs/client-api/ **/
socket.on('connect_error', function() {console.log("Client " + id + ": connect_error or connect_timeout");});
socket.on('disconnect', function() {console.log("Client " + id + ": disconnected");});


//Extras:
//socket.on('reconnect', function() {console.log("Client " + id + ": reconnected!");});
//socket.on('reconnect_error', function() {console.log("Client " + id + ": reconnect_error or reconnect_timeout");});

//For a more detailed error log:
//socket.on('connect_error', function(e) {console.log(e);});
