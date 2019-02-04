/***** http server ****/
var http = require('http');  								
var fs = require('fs'), bite_size = 256, readbytes = 0, file;
var path = require('path');
var io = require('socket.io');

var server = http.createServer(function (request, response) { 
  
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
var clients = {};								
var httpListener = io.listen(server);
console.log((new Date()).toLocaleString() + " Server: Ready to roll.");

httpListener.sockets.on('connection', function(socket){
	//socket.sendBuffer.length = 0;				//Clear the send buffer to avoid overloading the web client. We don't care about missed data except for Soundlist (ToDO later).
	clients[socket.id] = socket;				//For keeping track of clients and cleaning up on disconnect
	//console.log((new Date()).toLocaleString() + " Server: A client connected.");
    
    var clientid = "http";
    var numOfSamplesPerSec = 4;				//CHANGE BASED ON PYTHON CODE
    var lengthOfGapInSec = 1;				//Expected pause for an event to be marked
    var numOfSamplesReceived = 0;
    var numOfBlankSamples = lengthOfGapInSec*numOfSamplesPerSec + 1;					//Assume a long pause for starting
    var peak = 0.0;
    var event = "Blank";
    var duration = 0.0;	//in seconds
	
	socket.on('responseFromDataClient', function (data) {
		 data = JSON.parse(data);		//console.log((new Date()).toLocaleString() + " Server: Received from data client %s: %s", data.clientid, data.dataFromDataClient); //Print Data received from client
		
		/*** Do some processing and logging here...***/
		 var absSoundLevel = absSoundLevelCalc(parseFloat(data.dataFromDataClient)); 
		 //Start measuring until 1 second blank is detected
		 numOfSamplesReceived++;
		 
		 if(absSoundLevel == "Blank") // A blank is detected
		 {
			if(numOfBlankSamples >= lengthOfGapInSec*numOfSamplesPerSec + 1)
				numOfSamplesReceived = 0;								//Reseting numOfSamplesReceived in long long pauses so that it does not start in between
			else
			{
				numOfBlankSamples++;
				if(numOfBlankSamples >= lengthOfGapInSec*numOfSamplesPerSec) {
					event = absSoundLevelCalc(peak);
					duration = 	(numOfSamplesReceived - numOfBlankSamples)/numOfSamplesPerSec;
					numOfSamplesReceived = 0;
					//Reset peak
					peak = 0.0;
				}
			}
		 }
		 else                  			 //A sound is detected
		 {
			numOfBlankSamples = 0;		   
			if(parseFloat(data.dataFromDataClient) > peak)		//Report on the max loudness level in the given range, coz every sound contains all low, med and high. Could change to average too. 
				peak = parseFloat(data.dataFromDataClient);
		 }
		 
		/*** Emit message...***/
		socket.broadcast.emit('responseFromHttpServer', JSON.stringify({dataFromHttpServer: data.dataFromDataClient, absLoudLevel: absSoundLevel, event: event, duration: duration, clientid: data.clientid})); // socket.broadcast.emit(...); // Sending to all clients except sender	// socket.emit(...); // Sends to the sender.	// httpListener.sockets.emit(...); // sends to all connected clients.
		event = "Blank"; duration = 0.0; //Reset events
	});
	
	socket.on('handshake', function(id){
		console.log((new Date()).toLocaleString() + " Server: Client " + id + " connected."); 
		clientid = id;
	});
	
	socket.on('disconnect', function() {
		delete clients[socket.id];								//Clean up socket on disconnect
		console.log((new Date()).toLocaleString() + " Server: Client " + clientid + " disconnected.");
	});
});

function absSoundLevelCalc(value) {
	if(value > 10.0)
		return "Loud";
	else if(value > 5.0)	
		return "Med";
	else if(value > 1.0)
		return "Low";
	else
		return "Blank";
}

/** Error handling **/
server.on('error', function (e) {(new Date()).toLocaleString() + " Server error: " + e});
