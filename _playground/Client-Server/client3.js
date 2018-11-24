/** Client id from commmand line **/
const id = process.argv.slice(2);

/** Connect to the .net server**/
const net = require("net");

var socket = new net.Socket();
socket.connect(61337, "localhost", function () {
    console.log("Client " + id +  " connected to server");
    pythonScript();
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