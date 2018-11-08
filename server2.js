/***** http server ****/
var http = require('http');  								
var fs = require('fs'), bite_size = 256, readbytes = 0, file;
var io = require('socket.io');
//.net server
const net = require("net");

var server = http.createServer(function (request, response) {  
  
  fs.readFile('client.html', function(error, data){
	response.writeHead(200, {"Content-Type": "text/html"});
    response.write(data, "utf8");
    response.end();
  });
}).listen(8080);

var listener = io.listen(server);

listener.sockets.on('connection', function(socket){
    console.log("Server: A web client connected.");
});

/****** .net server *****/
// Create a simple server
var server = net.createServer(function (conn) {
    console.log("Server: A .net client connected");

    // If connection is closed
    conn.on("end", function() {
        console.log('Server: A .net client disconnected');
        // Close the server //server.close(); // End the process //process.exit(0);
    });

    // Handle data from client
    conn.on("data", function(data) {
        data = JSON.parse(data);
        console.log("Response from .net client: %s", data.responseFromNetClient);
        listener.sockets.emit('responseFromServer', data.responseFromNetClient);
    });

    // Let's response with a hello message
    conn.write(
        JSON.stringify(
            { response: "Hey there client!" }
        )
    );
});

// Listen for connections
server.listen(61337, "localhost", function () {
    console.log("Server: listening for clients");
});
