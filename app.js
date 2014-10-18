/*
	NODE SERVER FOR DUB-DRINKS
*/

var port = 9210;
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

/*
	invoke this function to update a drink tally
	if successful, it will also add a 'prev' field
	to the session that indicates that most recent action performed
*/
function updateDrinkCount(drinkId, session) {
	return 0;
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

app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: 'temp',
	cookie: {maxAge: 5400000}
}));

// handle get requests
app.get('/auth/', function(req, res) {
	if (isInSession(req)) {
		res.end('already have a session');
	} else {
		if (req.query.hasOwnProperty('fid') && req.query.hasOwnProperty('accToken')) {
			// client wants to authenticate thru facebook
			fbAuth(req.query.fid, req.query.accToken, function(status) {
				if (status) {
					req.session.logged = true;
					req.session.uid = req.query.fid;
					req.session.prev = null;
					res.end('yeah baby');
				} else {
					req.session.logged = false;
					res.end('auth failed');
				}
			});
		}
	}
});

app.get('/update/', function(req, res) {
	if (isInSession(req)) {
		if (req.query.hasOwnProperty('did')) {
			if (updateDrinkCount(req.query.did, req.session)) {
				res.end('ok we made the update');
			} else {
				res.end('database error - item not updated');
			}
		} else {
			res.end('malformed data');
		}
	} else {
		res.end('session error');
	}
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});