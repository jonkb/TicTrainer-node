/**
*	Functions that handle HTTP requests
*/

//Import modules
const scriptsroot = __dirname;
const aux = require(scriptsroot+"/auxiliary.js");

module.exports.root = root;
module.exports.login_get = login_get;
module.exports.login = login;
module.exports.logout = logout;
module.exports.register_user = register_user;
module.exports.register_trainer = register_trainer;

function ret_error(res, err, redirect){
	//TODO: STUB
	console.log(err);
	res.status(400).end();
}

function login_get(req, res){
	/**
	*	Handle GET requests for "/account/login"
	*/
	var redirect = req.query.redirect || "/";
	var hbs_data = {
		layout: "simple",
		title: "Log in",
		redirect: redirect
	};
	const lang = req.acceptsLanguages(...aux.languages);
	aux.get_locale_data(lang, (err, locale_data) => {
		if(err){
			res.status(500).end(); //TODO
			return;
		}
		// Combine all the data into one object for Handlebars
		var all_data = {...hbs_data, ...locale_data};
		res.render("login", all_data);
	});
}

function login(req, res){
	/**
	*	Handle POST requests for "/account/login"
	*	Log the user in and redirect them to where they were trying to go.
	*/
	aux.login(req.body, (err, acc_obj, con) => {
		if(err){
			ret_error(res, err, "/account/login");
			return;
		}
		con.end(); // Close the sql connection, since we're done with it
		// Save login id & hash in cookie
		req.session.acc_obj = acc_obj;
		res.redirect(req.body.redirect);
	});
}

function logout(req, res){
	/**
	*	Handle GET requests for "/account/logout"
	*	Log the user out (delete their session)
	*/
	// Delete the session
	req.session = null;
	//Just send an OK
	res.status(200).end();
}

function register_user(req, res){
	/**
	*	Handle POST requests for "/register/user.html"
	*	Create a new user account
	*/
	aux.register_user(req.body, (err, data) => {
		if(err){
			ret_error(res, err, "/register/");
			return;
		}
		ret_created(res, data);
	});
}

function register_trainer(req, res){
	/**
	*	Handle POST requests for "/register/trainer.html"
	*	Create a new trainer account
	*/
	aux.register_trainer(req.body, (err, data) => {
		if(err){
			ret_error(res, err, "/register/");
			return;
		}
		ret_created(res, data);
	});
}

function ret_created(res, data){
	/**
	*	Return the account created page
	*/
	var hbs_data = {
		layout: "simple",
		title: "Account Successfully Created",
		id: data.id,
		pw: data.pw,
		birth: data.birth,
		isuser: data.id[0] == "u",
		isadmin: data.id[0] == "a"
	};
	res.render("created", hbs_data);
}


function root(req, res){
	/**
	*	Handle requests for "/"
	*/
	var acc_obj = "{}";
	if(req.session && req.session.acc_obj){
		acc_obj = JSON.stringify(req.session.acc_obj);
	}
	var hbs_data = {
		layout: "home",
		acc_obj : acc_obj
	};
	const lang = req.acceptsLanguages(...aux.languages);
	aux.get_locale_data(lang, (err, locale_data) => {
		if(err){
			res.status(500).end(); //TODO
			return;
		}
		// Combine all the data into one object for Handlebars
		var all_data = {...hbs_data, ...locale_data};
		// This is the step where handlebars injects the data
		res.render("root_index", all_data);
	});
}
