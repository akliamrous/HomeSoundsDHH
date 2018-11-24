/***** http server ****/
var http = require('http');  								
var fs = require('fs'), bite_size = 256, readbytes = 0, file;
var io = require('socket.io');
var server = http.createServer(function (request, response) {  
  fs.readFile('client.html', function(error, data){
	response.writeHead(200, {"Content-Type": "text/html"});
    response.write(data, "utf8");
    response.end();
  });
}).listen(8080);

var httpListener = io.listen(server);

httpListener.sockets.on('connection', function(socket){
    console.log("Server: A web client connected.");
});

/****** .net server *****/
SERVER_IP="172.28.4.99";
// Create a simple server
const net = require("net");
var server = net.createServer(function (conn) {
    console.log("Server: A .net client connected");
	
    // If connection is closed
    conn.on("end", function() {
        console.log('Server: A .net client disconnected');
        // Close the server //server.close(); // End the process //process.exit(0);
    });
    
    conn.on("error", function(){
		console.log('Server: A .net client abruptly disconnected');
	});

    // Handle data from client
    conn.on("data", function(data) {
        data = JSON.parse(data);
        console.log("Response from .net client %s: %s", data.clientid, data.dataFromNetClient);
        httpListener.sockets.emit('responseFromHttpServer', JSON.stringify({dataFromHttpServer: data.dataFromNetClient, clientid: data.clientid}));
    });

    // Let's response with a hello message
    conn.write(
        JSON.stringify(
            { responseFromHttpServer: "Hey there client!" }
        )
    );
});
// Listen for connections
server.listen(61337, SERVER_IP, function () {
    console.log("Server: listening for clients");
});
