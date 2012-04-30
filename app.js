
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer()
	, io = require('socket.io').listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

//Testing modules
var participants_module = require('./bbb_modules/participants');
participants_module.hello();

//Rooms
var rooms = {};
// Routes

app.get('/', routes.index);
app.get('/join',routes.join);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

io.sockets.on('connection', function (socket) {
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.to(socket.room).emit('updatechat', socket.username, data);
	});
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username, meetingID){
		// we store the username and the room in the socket session for this client
		socket.username = username;
		socket.room = meetingID;
		
		// if room doesn't exist create it...
		if(rooms[meetingID] == undefined){
			rooms[meetingID] = {}
		}
		
		// add the client's username to the room
		rooms[meetingID][username] = username;
		
		//join a socket to a room
		socket.join(meetingID);
		
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to ' + meetingID);
		
		// echo to the room that a person has connected
		socket.broadcast.to(meetingID).emit('updatechat', 'SERVER', username + ' has connected');
		
		// update the list of users in chat, client-side
		io.sockets.to(meetingID).emit('updateusers', rooms[meetingID]);
	});
	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete rooms[socket.room][socket.username];
		
		//delete room if the room is empty
		if(Object.keys(rooms[socket.room]).length == 0){
			delete rooms[socket.room];
		}
		
		// update list of users in chat, client-side
		io.sockets.to(socket.room).emit('updateusers', rooms[socket.room]);
		// echo globally that this client has left
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});	
		
});
