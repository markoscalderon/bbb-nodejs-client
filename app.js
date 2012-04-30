
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer()
	, io = require('socket.io').listen(app);
	
//redis
var redis = require("redis"),
        publisher = redis.createClient();

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
	subscriber = redis.createClient();
	
	subscriber.on("pmessage",function (pattern, channel, message) {
		var obj = eval('(' + message + ')');
		var username = obj["username"];
		var meetingID = obj["meetingID"];
		var evt = obj["event"];
		var protocol = obj["protocol"];
		
		if(channel == "bigbluebutton:bridge:participants"){
			
			//checking if the event is join
			if(evt == "join"){
				// if room doesn't exist create it...
				if(rooms[meetingID] == undefined){
					rooms[meetingID] = {}
				}
				// add the client's username to the room
				rooms[meetingID][username] = username;
				
				if(socket.username == undefined){
					
					if(protocol == "websockets"){
						// we store the username and the room in the socket session for this client
						socket.username = username;
						socket.room = meetingID;
						//join a socket to a room
						socket.join(meetingID);
						// echo to client they've connected
						socket.emit('updatechat', 'SERVER', 'you have connected to ' + meetingID);
					}
				}
				
				// echo to the room that a person has connected
				socket.broadcast.to(meetingID).emit('updatechat', 'SERVER', username + ' has connected');

				// update the list of users in chat, client-side
				socket.to(meetingID).emit('updateusers', rooms[meetingID]);
			}
			else if(evt == "leave"){
				// remove the username from global usernames list
				delete rooms[meetingID][username];

				//delete room if the room is empty
				if(Object.keys(rooms[meetingID]).length == 0){
					delete rooms[meetingID];
				}
				
				// update list of users in chat, client-side
				io.sockets.to(meetingID).emit('updateusers', rooms[meetingID]);
				// echo globally that this client has left
				socket.broadcast.to(meetingID).emit('updatechat', 'SERVER', username + ' has disconnected');
			}
		}else if(channel == "bigbluebutton:bridge:chat"){
			if(evt == "newMessage"){
				var message = obj["message"];
				// we tell the client to execute 'updatechat' with 2 parameters
				socket.to(meetingID).emit('updatechat', username, message);
			}
			
		}
	});
	
	
	subscriber.psubscribe("bigbluebutton:*");
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		console.log("test: "+socket.username)
		var obj = {};
		obj["username"] = socket.username;
		obj["meetingID"] = socket.room;
		obj["event"] = "newMessage";
		obj["protocol"] = "websockets";
		obj["message"] = data;
		
		publisher.publish("bigbluebutton:bridge:chat", JSON.stringify(obj));
		
	});
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username, meetingID){
		
		//Add the user to the list using redis pubsub
		var obj = {};
		obj["username"] = username;
		obj["meetingID"] = meetingID;
		obj["event"] = "join";
		obj["protocol"] = "websockets";
		publisher.publish("bigbluebutton:bridge:participants", JSON.stringify(obj));

	});
	
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		//Remove the user using redis pubsub
		var obj = {};
		obj["username"] = socket.username;
		obj["meetingID"] = socket.room;
		obj["event"] = "leave";
		obj["protocol"] = "websockets";
		publisher.publish("bigbluebutton:bridge:participants", JSON.stringify(obj));
		
	});	
		
});
