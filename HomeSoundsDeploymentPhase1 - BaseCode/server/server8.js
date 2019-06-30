/***** http server ****/
var http = require('http');
var fs = require('fs'), bite_size = 256, readbytes = 0, file;
var path = require('path');
var io = require('socket.io');
var port = 7071; 

const readline = require('readline');
const readCmd = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  }); 

const winston = require('winston');
const MESSAGE = Symbol.for('message');
const jsonFormatter = (logEntry) => {
    const json = Object.assign(logEntry)
    logEntry[MESSAGE] = JSON.stringify(json);
    return logEntry;
}
const logger = winston.createLogger({
    level: 'info',
    format: winston.format(jsonFormatter)(),
    transports: new winston.transports.File({ filename: 'logs/homesounds-server.log' }),
});

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

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', function (error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });
}).listen(port);


var clients = {};
/* Constants to be shared across all web and data clients */
const numOfSamplesPerSec = 20;				//CHANGE BASED ON PYTHON CODE -- ToDo: Share with Client 
const lengthOfGapInSec = 1;					//Expected pause for an event to be marked
const numOfWaveformPoints = 512;
const numOfClients = 5;
const historyLenInSec = 3600*6;             //Six hours

/* Waveform variable across all data clients */
var arrayWaveform = [...Array(numOfWaveformPoints*numOfClients)].map(e => Array(3).fill(""));

/* Sound list variable across all data clients */
var listArray6hrs = new Array(historyLenInSec*numOfClients/lengthOfGapInSec);      // max one event per length of gap in sec
var listArraylen = historyLenInSec*numOfClients/lengthOfGapInSec;
var httpListener = io.listen(server);

console.log((new Date()).toLocaleString() + " Server: Ready to roll on port " + port + ".");
console.log("Type reload to refresh clients after they are connected.");

/* Reload web clients from cmd line */
readCmd.on('line', (input) => {
    if(input.match('reload'))
        httpListener.sockets.emit('reload');
});

httpListener.sockets.on('connection', function (socket) {      
    //socket.sendBuffer.length = 0;				//Clear the send buffer to avoid overloading the web client. We don't care about missed data except for Soundlist (ToDO later).
    clients[socket.id] = socket;				//For keeping track of clients and cleaning up on disconnect
    //console.log((new Date()).toLocaleString() + " Server: A client connected.");

    var clientid = "base-client";

    /* Sound list varibles for each data client*/
    var numOfSamplesReceived = 0;
    var numOfBlankSamples = lengthOfGapInSec * numOfSamplesPerSec + 1;					//Assume a long pause for starting
    var peak = 0.0, peakFreq = 0;
    var eventPeak, eventFreq; 
    var event = "Blank";
    var eventTimeStamp = "";
    var duration = 0.0;	//in seconds
    var numOfEventsInDay = [0, 0, 0];
    var today = (new Date()).getDay();
    var hours, minutes, seconds;

    /* Floorplan variables for each data client */
    var array6hr = new Array(numOfSamplesPerSec * 3600 * 6);                              //This is not needed for web client. Please
    var array6hrlen = 0;
    var Timer20 = 20;                     //20 samples for sending circle information. For numOfSamples = 20 (50ms/update), this is 1 second. 
    var Timer5 = 5; 

	//socket.emit('reload');
    socket.emit('handshake-server-list', JSON.stringify({ lengthOfGapInSec: lengthOfGapInSec, numOfSamplesPerSec: numOfSamplesPerSec, listArray: listArray6hrs, listArraylen: listArraylen, historyLenInSec: historyLenInSec}));
    socket.emit('handshake-server-wave', JSON.stringify({ lengthOfGapInSec: lengthOfGapInSec, numOfSamplesPerSec: numOfSamplesPerSec, numOfWaveformPoints: numOfWaveformPoints, waveformArray: arrayWaveform}));
    socket.emit('handshake-server-floor', JSON.stringify({ numOfSamplesPerSec: numOfSamplesPerSec }));
	
    socket.on('responseFromDataClient', function (data) {
        data = JSON.parse(data);		//console.log((new Date()).toLocaleString() + " Server: Received from data client %s: %s", data.clientid, data.dataFromDataClient); //Print Data received from client

        if(Timer20 == 10)               //send power message once every second  
        {
            socket.broadcast.to('http-client').emit('powerStatus', JSON.stringify({ powerLineConnected: data.powerLineConnected, clientid: data.clientid}));
            if(parseInt(data.powerLineConnected) != 1)
                console.log((new Date()).toLocaleString() + " Server: data client " + data.clientid + "'s power cable is disconnected.");
        }    

        /*** Floorplan history processing ***/
        array6hr.shift();
        array6hr.push(parseFloat(data.dataFromDataClient));
        if (array6hrlen < numOfSamplesPerSec * 3600 * 6) array6hrlen++;

        /*** Waveform data processing ***/
        arrayWaveform.shift();
        arrayWaveform.push([clientid, data.dataFromDataClient, data.pitchFromDataClient]);

        /*** Sound list event processing ***/
        var absSoundLevel = absSoundLevelCalc(parseFloat(data.dataFromDataClient));
        
        //Start measuring until 1 second blank is detected
        numOfSamplesReceived++;
        duration = numOfSamplesReceived / numOfSamplesPerSec;
        if (absSoundLevel == "Blank") // A blank is detected
        {
            if (numOfBlankSamples >= lengthOfGapInSec * numOfSamplesPerSec + 1)
                numOfSamplesReceived = 0;								//Reseting numOfSamplesReceived in long long pauses so that it does not start in between
            else {
                numOfBlankSamples++;
                if (numOfBlankSamples >= lengthOfGapInSec * numOfSamplesPerSec) {
                    event = absSoundLevelCalc(peak);
                    eventPeak = peak;
                    eventFreq = peakFreq;
                    duration = (numOfSamplesReceived - numOfBlankSamples) / numOfSamplesPerSec;
                    numOfSamplesReceived = 0;

                    if (event != "Blank") {
                        var date = new Date();
                        date.setSeconds(date.getSeconds() - duration - lengthOfGapInSec);
                        eventTimeStamp = date.getTime();
                        logger.info('sound event', { Time: date.toLocaleString(), Location: data.clientid, Event: event, duration: duration + "s", Pitch: eventFreq});
                        
                        /* Pushing to a sound list array */
                        listArray6hrs.shift();
                        listArray6hrs.push([data.clientid, eventTimeStamp, duration, eventPeak, eventFreq]);		// adds to the end of the array
                        if (listArraylen > 0) listArraylen--;

                        /* Recording number of daily events */
                        if (date.getDay() != today) {
                            logger.info('Number of Events today', { Time: date.toLocaleString(), Location: data.clientid, Low: numOfEventsInDay[0], Med: numOfEventsInDay[1], High: numOfEventsInDay[2] });
                            numOfEventsInDay = [0, 0, 0];
                            today = date.getDay();
                        }
                        switch (event) {
                            case "Low":
                                numOfEventsInDay[0]++;
                                break;
                            case "Med":
                                numOfEventsInDay[1]++;
                                break;
                            case "Loud":
                                numOfEventsInDay[2]++;
                        }
                    }
                    //Reset peak and frequency
                    peak = 0.0; peakFreq = 0;
                }
            }
        }
        else                  			 //A sound is detected
        {
            numOfBlankSamples = 0;
            if (parseFloat(data.dataFromDataClient) > peak)		//Report on the max loudness level in the given range, coz every sound contains all low, med and high. Could change to average too. 
            {   
                peak = parseFloat(data.dataFromDataClient);
                peakFreq = parseInt(data.pitchFromDataClient);
            }
        }

        /*** Emit messages...***/
        
        //Waveform
        socket.broadcast.to('http-client').emit('responseFromHttpServer-waveform', JSON.stringify({ clientid: data.clientid, dataFromHttpServer: data.dataFromDataClient, pitchFromHttpServer: data.pitchFromDataClient, event: event, duration: duration}));

        //Floorplan
        --Timer5;
        if(Timer5 == 0)
        {
            var avg5samples = (array6hr.slice(-5)).reduce((a, b) => a + b, 0) / 5.0;
            socket.broadcast.to('http-client').emit('responseFromHttpServer-floorplan-Pulse', JSON.stringify({ clientid: data.clientid, dataFromHttpServer: avg5samples, pitchFromHttpServer: data.pitchFromDataClient, absLoudLevel: absSoundLevelCalc(avg5samples), duration: duration}));
            Timer5 = 5;
        }   

        --Timer20;
        if(Timer20 == 0)  
        {
            setImmediate(() => {        //Don't wanna block the loop for expensive operations
                var avg6hr, avg30min;
                avg6hr = (array6hr.slice(-array6hrlen)).reduce((a, b) => a + b, 0) / array6hrlen;
                if (array6hrlen < numOfSamplesPerSec * 1800) avg30min = avg6hr;	//Number of seconds in 6hr = 3600*6, 30min = 1800
                else avg30min = (array6hr.slice(-numOfSamplesPerSec * 1800)).reduce((a, b) => a + b, 0) / (numOfSamplesPerSec * 1800);
                socket.broadcast.to('http-client').emit('responseFromHttpServer-floorplan-Circle', JSON.stringify({ clientid: data.clientid, avgSmall: avg30min, avgLarge: avg6hr }));    
            });
            Timer20 = 20;
        }

        //Soundlist
        if(event != "Blank")
            socket.broadcast.to('http-client').emit('responseFromHttpServer-soundlist', JSON.stringify({ clientid: data.clientid, event: event, eventTimeStamp: eventTimeStamp, peakLoudness: eventPeak, peakFrequency: eventFreq, duration: duration, numOfEventsInDay: numOfEventsInDay}));
        
        event = "Blank"; duration = 0.0; //Reset events
    });

    socket.on('handshake', function (id) {
        console.log((new Date()).toLocaleString() + " Server: Client " + id + " connected.");
        socket.join(id);
        logger.info('connected', { Time: (new Date()).toLocaleString(), clientid: id });
        clientid = id;
    });

    socket.on('bookmark', function (data) {
        data = JSON.parse(data);
        
        var htmlfile = "logs/" + ((new Date()).toLocaleString()).replace(/:/g, "-")  + ".html";
        var textfile = "logs/" + ((new Date()).toLocaleString()).replace(/:/g, "-")  + ".txt";
        var textFileText = "P: " + data.participant + "\n" + "Why?: " + data.selectedRadio + "\n" + "Other: " + data.otherText + "\n" + "Comments: " + data.commentText + "\n";
        var htmlFileText = data.screenshot;

        fs.writeFile(textfile, textFileText, function (err) {
            if (err) console.log((new Date()).toLocaleString() + " Server: threw error when an http client tried to bookmark.");
          });
        
        fs.writeFile(htmlfile, htmlFileText, function (err) {
            if (err) 
                console.log((new Date()).toLocaleString() + " Server: threw error when an http client tried to bookmark.");
            else {
                console.log((new Date()).toLocaleString() + " Server: An http client successfully bookmarked.");
                logger.info('bookmark', { Time: (new Date()).toLocaleString()});
            }
          });
    });

    socket.on('disconnect', function () {
        delete clients[socket.id];								//Clean up socket on disconnect
        console.log((new Date()).toLocaleString() + " Server: Client " + clientid + " disconnected.");
        socket.broadcast.emit('goodbye-server', clientid);
        logger.info('disconnected', { Time: (new Date()).toLocaleString(), clientid: clientid });
    });
});

function absSoundLevelCalc(value) {
    if (value > 6.0)
        return "Loud";
    else if (value > 4.0)
        return "Med";
    else if (value > 2.0)
        return "Low";
    else
        return "Blank";
}

/** Error handling **/
server.on('error', function (e) { (new Date()).toLocaleString() + " Server error: " + e });
