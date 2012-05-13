
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
	var request = require('request');
	var meetingID = encodeURIComponent(req.query.meetingID);
	var username = encodeURIComponent(req.query.username);

	var crypto = require('crypto')
  	, shasum = crypto.createHash('sha1');
	shasum.update('joinmeetingID='+meetingID+'&password=mp&fullName='+username+'754d6b702cb591bd38bfd3a3290aef5b');
	
	request('http://10.250.2.215/bigbluebutton/api/join?meetingID='+meetingID+'&password=mp&fullName='+username+'&checksum='+shasum.digest('hex'), function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    //console.log(body) // Print the google web page.
	    request('http://10.250.2.215/bigbluebutton/api/enter', function (error2, response2, body2) {
		  if (!error && response.statusCode == 200) {
		  	res.contentType('application/json');
			res.send(JSON.stringify({username: req.query.username, meetingID: req.query.meetingID }));
		  }
		})
	  }
	});
	
};

exports.client = function(req,res){
	res.render('client',{ title: 'BigBlueButton Node.js Client', rooms: roomnames })
}