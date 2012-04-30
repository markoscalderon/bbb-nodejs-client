
/*
 * GET home page.
 */

exports.index = function(req, res){
	//Rooms
	var roomnames = ['Demo Meeting','English 232','English 411'];
	
  res.render('index', { title: 'BigBlueButton Node.js Client', rooms: roomnames })
};

exports.join = function(req, res){
	console.log("checking variable: " + req.query.username + req.query.meetingID);
	res.contentType('application/json');
	res.send(JSON.stringify({username: req.query.username, meetingID: req.query.meetingID }));
};