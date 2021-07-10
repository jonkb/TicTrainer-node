/**
*	Functions that handle HTTP requests
*/

//Import modules
const scriptsroot = __dirname;
const aux = require(scriptsroot+"/auxiliary.js");

module.exports.root = root;
module.exports.logout = logout;

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

function root(req, res){
	/**
	*	Handle requests for "/"
	*/
	var account_obj = "{}";
	if(req.session && req.session.account_obj){
		account_obj = JSON.stringify(req.session.account_obj);
	}
	var hbs_data = {
		layout: "home",
		account_obj : account_obj
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
