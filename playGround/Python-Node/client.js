/** Connect to the .net server**/
const net = require("net");

var socket = new net.Socket();
socket.connect(61337, "localhost", function () {
    console.log("Client: Connected to server");
    pythonScript();
});

/** Spawn a python process **/
function pythonScript(req, res) { 
	var spawn = require("child_process").spawn; 
	var process = spawn('python',["./AudioProcessor.py"] ); 
	process.stdout.on('data', function(data) { 
		socket.write(JSON.stringify({ responseFromNetClient: data.toString() }));
	} ) 
}
