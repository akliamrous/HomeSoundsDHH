SERVER_IP="172.28.4.99";

/** Client id from commmand line **/
const id = process.argv.slice(2);

/** Connect to the .net server**/
const net = require("net");

var socket = new net.Socket({retryAlways: true, retryTime: 1000});

socket.connect(61337, SERVER_IP, function () {
    console.log("Client " + id +  " connected to server");
    pythonScript();
});

socket.on('error', function(e) {
    console.log("Client " + id + ": Error detected: Server might have disconnected");
    console.log("Rewriting connection...");
    socket.connect(61337, SERVER_IP, function () {
		socket.write("\n");
		console.log("Client " + id +  " connected to server");
		pythonScript();
	});
});

/** Spawn a python process **/
function pythonScript(req, res) { 
	var spawn = require("child_process").spawn; 
	var process = spawn('python',["./VolumeMeter.py"] ); 
	process.stdout.on('data', function(data) { 
		socket.write(JSON.stringify({ dataFromNetClient: data.toString(), clientid: id}));
	} ) 
}

/*** TO DO: Handle connection closes from server: try to reconnect ***/


