const net = require("net");

// Create a socket (client) that connects to the server
var socket = new net.Socket();
socket.connect(61337, "localhost", function () {
    console.log("Client: Connected to server");
});

// Let's handle the data we get from the server
socket.on("data", function (data) {
    data = JSON.parse(data);
    console.log("Response from server: %s", data.response);
    // Respond back
    socket.write(JSON.stringify({ responseFromNetClient: "Hey there server!" }));
    // Close the connection //socket.end();
});


// Reads the file as and when the data comes
var fs = require('fs'), bite_size = 256, readbytes = 0, file;
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

// Emits read data
function processsome(err, bytecount, buff) {
    console.log(buff.toString('utf-8', 0, bytecount));
    // Do something here
    socket.write(JSON.stringify({ responseFromNetClient: buff.toString('utf-8', 0, bytecount)})); 
    // So we continue reading from where we left:
    readbytes+=bytecount;
    process.nextTick(readsome);
}

