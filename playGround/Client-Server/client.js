var http = require('http');  								
var fs = require('fs'), bite_size = 256, readbytes = 0, file;
var io = require('socket.io');

var client = http.client(function (request, response) {  
  
  fs.readFile('client.html', function(error, data){
	response.writeHead(200, {"Content-Type": "text/html"});
    response.write(data, "utf8");
    response.end();
  });
}).listen(8080);

var listener = io.listen(server);

/*
listener.sockets.on('connection', function(socket){
    socket.emit('message', 'hello world');
});
*/

fs.open('AudioSamples.txt', 'r', function(err, fd) { file = fd; readsome(); });

function readsome() {
    var stats = fs.fstatSync(file);
    if(stats.size<readbytes+1) {
        //console.log('Hehe I am much faster than your writer..! I will sleep for a while, I deserve it!');
        setTimeout(readsome, 100);
    }
    else {
        fs.read(file, new Buffer(bite_size), 0, bite_size, readbytes, processsome);
    }
}

function processsome(err, bytecount, buff) {
    console.log(buff.toString('utf-8', 0, bytecount));
    listener.sockets.emit('predicts', buff.toString('utf-8', 0, bytecount));
    // So we continue reading from where we left:
    readbytes+=bytecount;
    process.nextTick(readsome);
}
