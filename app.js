/*
	NODE SERVER FOR DUB-DRINKS
*/

var port = process.env.PORT || 8081;
// express modules
var express = require('express');
var app = express();
var session = require('express-session');
// external modules
var mongo = require('mongojs');
var facebook = require('facebook-sdk');
var FB = new facebook.Facebook({
	appId		: 	'1481238075482245',
	xfbml		: 	true,
	version		: 	'v2.1'
});
var db = mongo('drinker:ilikesodaenergy@146.148.61.59/drinkdb');
var http = require('http');

/*
	invoke this function to update a drink tally
	if successful, it will also add a 'prev' field
	to the session that indicates that most recent action performed
*/
function updateDrinkCount(filter, session, callback) {
	db.collection('drink').find(filter, function(err, data) {
		if (err === null && data.length === 1) {
			db.collection('user_drink').find({'drink_id': data._id, 'fb_id': session.uid},
				callback({'drink_id': data._id, 'fb_id': session.uid}));
		}
	});
}

/*
	verifies the authenticity of user by checking fb login and then
	creating a new entry in the users collection only if necessary
*/
function fbAuth(fid, accessToken, callback) {
	// make api call with access token and userID
	FB.api('/' + fid + '/', 'GET', {access_token: accessToken}, function(response) {
		if (!response || response.error) {
			callback(false);
		} else {
			db.collection('user').find({'fb_id': fid}, function(err, data) {
				if (err !== null) {
					callback(false);
				} else if (data.length < 1) {
					db.collection('user').insert({
						'fb_id': fid,
						'gender': response.gender,
						'timezone': response.timezone
					});
					callback(true);
				} else {
					callback(true);
				}
			});
		}
	});
}

/*
	extracts certain statistics and measurements based on the filter
	object that is passed as an argument
*/
function getStatistics() {
	return 0;
}

/*
	wrapper function to make reque
*/
function getNutrition() {
	return 0;
}

/*
	returns true only if given client has an active logged session
*/
function isInSession(req) {
	return req.session.hasOwnProperty('logged') && req.session.logged === true;
}

/*
	renders the standard server response
*/
function renderResponse(status, err, req, res) {
	if (status === 1) {
		var result = {
			status: 1,
			uid: req.session.uid
		};
	} else {
		var result = {
			status: 0,
			message: err
		};
	}
	res.writeHead(200, {'Content-Type': 'application/json'});
	res.end(JSON.stringify(result));
}

app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: 'temp',
	cookie: {maxAge: 5400000}
}));

// handle get requests
app.get('/auth/', function(req, res) {
	if (isInSession(req)) {
		renderResponse(0, 'Session already active', req, res);
	} else {
		if (req.query.hasOwnProperty('fid') && req.query.hasOwnProperty('accToken')) {
			// client wants to authenticate thru facebook
			fbAuth(req.query.fid, req.query.accToken, function(status) {
				if (status) {
					req.session.logged = true;
					req.session.uid = req.query.fid;
					req.session.prev = null;
					renderResponse(1, '', req, res);
				} else {
					req.session.logged = false;
					renderResponse(0, 'Authentication Failed', req, res);
				}
			});
		}
	}
});

app.get('/update/', function(req, res) {
	if (isInSession(req)) {
		if (req.query.hasOwnProperty('name') 
		&& req.query.hasOwnProperty('type')
		&& req.query.hasOwnProperty('volume')) {
			// we have a well formed query, find the drink_id
			db.collection('drink').find({'name': req.query.name, 'type': req.query.type, 
			'volume': parseInt(req.query.volume)}, function(err, data){
				if (err === null && data.length === 1) {
					// found an entry, extract the ObjectId and update the user_drink
					var drinkId = data[0]._id;
					db.collection('user_drink').update({'drink_id': drinkId, 'user_id': req.session.uid},
						{$inc: {'quantity': 1}, $push: {timestamp: new Date()}}, {upsert: true});
					req.prev = drinkId;
					renderResponse(1, '', req, res);
				} else {
					renderResponse(0, 'Update Failed', req, res);
				}
			});
		} else {
			renderResponse(0, 'Malformed Data', req, res);
		}
	} else {
		renderResponse(0, 'User not authenticated', req, res);
	}
});

function userStatRespond(name, vol, type, sess, returnRes, res, req) {
	// find the id of the specified drink
	db.collection('drink').find({
		name: name,
		type: type,
		volume: vol
	}, function(err, data) {
		if (err === null && data.length > 0) {
			db.collection('user_drink').find({
				user_id: req.uid,
				drink_id: data._id
			}, function(err, data) {
				if (err == null && data.length > 0) {
					returnRes.log = data.timestamp;
				} else {
					renderResponse(0, 'No data found', req, res);
				}
			});
		} else {
			renderResponse(0, 'No data found', req, res);
		}
	});
}

function masheryWrapper(outParam, callback) {
	var api_key = 'czy8yd2qgary8424wczyjzav';
	var uid = 'ert';
	var devid = 'ert';
	var appid = 'ert';
	var options = {
	  host: 'api.foodessentials.com',
	  path: '/createsession?uid=' + uid + '&devid=' + devid + '&appid=' + appid + '&f=json&api_key=' + api_key,
	  method: 'GET'
	};
	var reqGet = http.request(options, function(res) {
    	res.on('data', function(d) {
    		outParam.data = JSON.parse(d);
    		callback();
    	});
	});
	reqGet.end();
}

function masheryWork(res, callback) {
	var sid = {};
	masheryWrapper(sid, function() {
		/*
		var response = {};
		masheryWrapper(response, "url", function() {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(JSON.stringify(response));
		});
		*/
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.end(JSON.stringify(sid));
	});
}

app.get('/user/', function(req, res) {
	if (isInSession(req) && req.query.hasOwnProperty('type')
	&& req.query.hasOwnProperty('volume')
	&& req.query.hasOwnProperty('name')) {
		//userStatRespond(req.query.name, req.query.volume, req.query.type, req.session, response, res, req);
		masheryWork(res, function(response) {
			res.writeHead(200, {'Content-Type': 'application/json'});
			res.end(JSON.stringify(response));
		});
	} else {
		renderResponse(0, 'User not authenticated', req, res);
	}
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(port, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});