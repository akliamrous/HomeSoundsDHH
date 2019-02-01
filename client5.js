SERVER_ADD="http://128.208.4.172:8080";

/** Client id from commmand line **/
const id = process.argv.slice(2);

var io = require('socket.io-client');
var socket = io.connect(SERVER_ADD, {reconnect: true});

// Add a connect listener
socket.on('connect', function () {
    console.log("Client " + id +  " connected to server");
    socket.emit('handshake', id);
	pythonScript();
});

/** Spawn a python process **/
function pythonScript(req, res) { 
	var spawn = require("child_process").spawn; 
	var process = spawn('python',["./VolumeMeter.py"] ); 
	process.stdout.on('data', function(data) { 
		socket.emit('responseFromDataClient', JSON.stringify({ dataFromDataClient: data.toString(), clientid: id}));
		// console.log('Sent to server: ' + data.toString()); //Print data sent to server
	} ) 
}
