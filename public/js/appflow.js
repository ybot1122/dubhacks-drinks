function loadTemplate($destination, selector, filename, data, callback) {
	$destination.fadeOut(1000, function() {
		$destination.load('templates/' + filename + ' ' + selector, 
		function(response, status, xhr) {
			$destination.html(Mustache.render($destination.text(), data));
			callback();
			$destination.fadeIn(1000);
		});
	});
}		

function attachClickBehavior(user) {
	$('img').on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		user.changeState(1, $(this).data('info'));
	});
	$('#back').on('click', function(e) {
		e.preventDefault();
		e.stopPropagation();
		user.changeState(0, null);
	});
}

// Definition of a UserState 
var UserState = function(sessId) {

	var user = this;

	this.state = 0;
	this.bev = {};
	this.sess = sessId;

	this.clickBehavior = function() {
		attachClickBehavior(user);
	}

	// action = 1 means advance, action != 1 means back
	this.changeState = function(action, data) {
		var states = [
			{	
				currTemplate: 'splash',
				dataItem: 'type'
			},
			{	
				currTemplate: 'size',
				dataItem: 'size'
			},
			{	
				currTemplate: 'brand',
				dataItem: 'name'
			}
		];

		if (action == 1) {
			this.bev[states[this.state].dataItem] = data;
			this.state = (this.state == 2) ? 2 : this.state + 1;
		} else {
			this.state = (this.state == 0) ? 0 : this.state - 1;
			delete this.bev[states[this.state].dataItem];
		}

		if (this.state == 2) {
			var result = {};
			result[this.bev.type] = true;
			console.log(result);
			loadTemplate($('#centerbody'), '#template-' + states[this.state].currTemplate, 'appflow.html', 
				result, this.clickBehavior);
		} else {
			loadTemplate($('#centerbody'), '#template-' + states[this.state].currTemplate, 'appflow.html', 
				{}, this.clickBehavior);
		}
		console.log(this.bev);
	}

	// render the starting splash screen
	loadTemplate($('#centerbody'), '#template-splash', 'appflow.html', {}, this.clickBehavior);
}

