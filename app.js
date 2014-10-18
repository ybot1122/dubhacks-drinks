/*
	NODE SERVER FOR DUB-DRINKS
*/

var port = 9210;

var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');
var url = require('url');
var queryString = require('querystring');
var mongo = require('mongojs');
var facebook = require('facebook-sdk');

var serve = serveStatic('.', {});

var server = http.createServer(function(req, res) {
	var queryObj = queryString.parse(url.parse(req.url).query);

	if (queryObj.hasOwnProperty('hello') && queryObj.hello === 'true') {
		res.writeHead(200, {'Content-Type': 'application/json'});
		console.log(JSON.stringify({text: 'yo yo yo', content: 'hello'}));
		res.end(JSON.stringify({text: 'yo yo yo', content: 'hello'}));
	} else {
		// no valid GET variables. just serve the HTML file to client.
		var done = finalhandler(req, res);
		serve(req, res, done);
	}
});

// Listen
server.listen(port);

// Put a friendly message on the terminal
console.log('Server running at http://127.0.0.1:' + port);