/***** http server ****/
var http = require('http');  								
var fs = require('fs'), bite_size = 256, readbytes = 0, file;
var path = require('path');
var io = require('socket.io');
var server = http.createServer(function (request, response) { 
  console.log('Server ready to roll.');	 
  
  var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }
    
   fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
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
		
		/* Do some processing and logging here... example: FILTERING AND DETERMINING HIGH MED LOW AND DURATION */
		
		socket.broadcast.emit('responseFromHttpServer', JSON.stringify({dataFromHttpServer: data.dataFromDataClient, absLoudLevel: "Loud", clientid: data.clientid})); // Sending to all clients except sender
		// socket.emit(...); // Sends to the sender.
		// httpListener.sockets.emit OR io.emit // sends to all.
	});
	socket.on('disconnect', function() {
		console.log((new Date()) + " Server: Client " + clientid + " disconnected.");
	});
});

var app = require('express')();
app.get('/soundlist', function(req, res){
  res.sendFile(__dirname + '/soundlist.html');
});
