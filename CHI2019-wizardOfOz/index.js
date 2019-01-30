var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

app.get('/soundlist', function(req, res){
  res.sendFile(__dirname + '/soundlist.html');
});

app.get('/homelayout', function(req, res){
  res.sendFile(__dirname + '/homelayout.html');
});

app.get('/waveform', function(req, res){
  res.sendFile(__dirname + '/waveform.html');
});

app.get('/history', function(req, res){
  res.sendFile(__dirname + '/history.html');
});

app.get('/inaccuracy-1', function(req, res){
  res.sendFile(__dirname + '/inaccuracy-1.html');
});

app.get('/inaccuracy-3', function(req, res){
  res.sendFile(__dirname + '/inaccuracy-3.html');
});

//Wizards

app.get('/wizard', function(req, res){
  res.sendFile(__dirname + '/wizard.html');
});

app.get('/wizard-sl', function(req, res){
  res.sendFile(__dirname + '/wizard-sl.html');
});

app.get('/wizard-type', function(req, res){
  res.sendFile(__dirname + '/wizard-type.html');
});

app.get('/wizard-click', function(req, res){
  res.sendFile(__dirname + '/wizard-click.html');
});

app.get('/wizard-wf', function(req, res){
  res.sendFile(__dirname + '/wizard-wf.html');
});

app.get('/wizard-hl', function(req, res){
  res.sendFile(__dirname + '/wizard-hl.html');
});

app.get('/wizard-demo', function(req, res){
  res.sendFile(__dirname + '/wizard-demo.html');
});

app.get('/wizard-scenario', function(req, res){
  res.sendFile(__dirname + '/wizard-scenario.html');
});

//Associated files
app.get('/map.jpg', function(req, res){
  res.sendFile(__dirname + '/map.jpg');
});

app.get('/pitchdetect.js', function(req, res){
  res.sendFile(__dirname + '/pitchdetect.js');
});

io.on('connection', function(socket){
  socket.on('sound message', function(msg){
    io.emit('sound message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
