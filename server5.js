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
	console.log((new Date()).toLocaleString() + " Server: A client connected.");
    var clientid = "http";
    
    socket.on('handshake', function(id){
		console.log((new Date()) + " Server: This is data client " + id + "."); 
		clientid = id; 
	});
	
	socket.on('responseFromDataClient', function (data) {
		data = JSON.parse(data);
		//console.log((new Date()) + " Server: Received from data client %s: %s", data.clientid, data.dataFromDataClient); //Print Data from client
		socket.broadcast.emit('responseFromHttpServer', JSON.stringify({dataFromHttpServer: data.dataFromDataClient, clientid: data.clientid})); // Sending to all clients except sender
		// socket.emit(...); // Sends to the sender.
		// httpListener.sockets.emit OR io.emit // sends to all.
	});
	socket.on('disconnect', function() {
		console.log((new Date()) + " Server: Client " + clientid + " disconnected.");
	});
});
