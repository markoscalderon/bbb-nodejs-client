// on load of page
$(function(){

	$("#main").hide();
	
	$('#btnLogin').click( function(){
		$.get('/join', { username: $('#username').val(), meetingID: $('#meetingID').val() } , function(data) {
			console.log("now, let's connect " + data.username + " to the room " + data.meetingID);
			$("#login").hide();
			$("#main").show()
			socket.emit('adduser', data.username, data.meetingID);
		});
	});
	
	$('#username').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#btnLogin').focus().click();
		}
	});
	
	$('#btnSendMsg').click( function() {
		var message = $('#msg').val();
		$('#msg').val('');
		// tell server to execute 'sendchat' and send along one parameter
		socket.emit('sendchat', message);
	});

	$('#msg').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#btnSendMsg').focus().click();
		}
	});
});

var socket = io.connect('http://10.250.2.215:3000');
socket.on('connect', function () {
	console.log("socket connection works!");
});
// listener, whenever the server emits 'updateusers', this updates the username list
socket.on('updateusers', function(data) {
	$('#users').empty();
	$.each(data, function(key,value) {
		$('#users').append('<div>' + value + '</div>');
	});
});

socket.on('updatechat', function (username, data) {
	$('#history').append('<b>'+username + ':</b> ' + data + '<br>');
});

