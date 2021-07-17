/**
*	Functions that handle HTTP requests
*/

//Import modules
const fs = require("fs");
const scriptsroot = __dirname;
const aux = require(scriptsroot+"/auxiliary.js");

module.exports.root = root;
module.exports.login_get = login_get;
module.exports.login = login;
module.exports.logout = logout;
module.exports.register_user = register_user;
module.exports.register_trainer = register_trainer;
module.exports.manage_get = manage_get;
module.exports.manage = manage;
module.exports.new_session = new_session;


function ret_error(res, err, redirect){
	//TODO: STUB
	console.log(err);
	res.status(400).end();
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

// Requests related to accounts (registration, login, manage account)

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

function manage_get(req, res){
	/**
	*	Handle GET requests for "/account/manage"
	*/
	if(req.session && req.session.acc_obj){
		let isuser = req.session.acc_obj.id[0] == "u";
		let linked_accounts = "TEMP"; //TODO
		let hbs_data = {
			layout: "main",
			title: "Manage Account",
			acc_obj : JSON.stringify(req.session.acc_obj),
			isuser : isuser,
			id: req.session.acc_obj.id,
			linked_accounts: linked_accounts
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
			res.render("manage", all_data);
		});
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect=/account/manage");
	}
}

function manage(req, res){
	/**
	*	Handle POST requests from "/account/manage"
	*	req.body.source is one of:
	*		- addL
	*		- editP
	*/
	// Do admins use this portal? TODO
	if(["addL", "editP"].indexOf(req.body.source) == -1){
		ret_error(res, "ife");
		return;
	}
	let credentials = {
		id: req.session.acc_obj.id,
		pwh: req.session.acc_obj.pwh
	};
	aux.login(credentials, (err, acc_obj, con) => {
		if(err){
			ret_error(res, err);
			return;
		}
		if(req.body.source == "addL"){
			let link_data = {
				id: acc_obj.id,
				lid: req.body.lid
			};
			aux.add_link(link_data, con, (err) => {
				if(err){
					ret_error(res, err);
					return;
				}
				// Reload the account manage page
				res.redirect("/account/manage");
			});
		}
		else{ //editP
			data = {
				id: acc_obj.id,
				key: "password",
				val: req.body.pw
			}
			aux.edit_account(data, con, (err, val) => {
				if(err){
					ret_error(res, err);
					return;
				}
				// Update the cookie to reflect the change
				req.session.acc_obj.pwh = val;
				//console.log(`216: ${val}`)
				// Reload the account manage page
				res.redirect("/account/manage");
			})
		}
	});
}

// Requests related to training sessions

function new_session(req, res){
	/**
	*	Start a new training session
	*		1. [Maybe double-check pw & that they're linked]
	*		2. Check for a concurrent session (ghost session)
	*		3. 
	*			If Trainer: Return the trainer link loading page
	*			If User: 
	*				Add ids to set of lnusers
	*				Return user link loading page
	*/
	let tid = null;
	let uid = null;
	let ist = null;
	if(body.id[0] == "t"){
		ist = true;
		tid = body.id;
		uid = body.lid;
	}
	else if(body.id[0] == "u"){
		ist = false;
		tid = body.lid;
		uid = body.id;
	}
	else{
		ret_error(res, "ife");
		return;
	}
	// Note: is this really the right time to check for conses?
	var oldSFile = aux.dbroot + "session/ongoing/" + tid + uid + ".ttsd";
	fs.stat(oldSFile, function(err){
		if(err){
			if(err.code == "ENOENT"){
				//Good.
				if(ist){
					ret_llt(res, body);
				}
				else{
					//Now add uid to lnusers
					let link_data = {
						uid: uid,
						tid: tid,
						ts: Date.now()
					};
					aux.ln_add(link_data);
				}
			}
			else{
				ret_error(res, "fe", "/");//Why? Some weird error.
			}
		}
		else{//There is a concurrent (or 'ghost') session
			ret_error(res, "conses");
		}
	});	
}

function ret_llt(res, data){
	//TODO
}

function ret_llu(res, data){
	//TODO
}

function llt(req, res){
	/**
	*	Handle POST requests from "/session/llt"
	*		1. Exit if timeout reached
	*		2. Look for entry in lnusers
	*		3. If not found, return "wait"
	*			If found, create session and return start session page
	*/
	if(body.timeout){
		ret_error(res, "toe");
		return;
	}
	let link_data = {
		uid: uid,
		tid: tid
	};
	if(aux.ln_has(link_data)){
		aux.ln_delete(link_data);
		var sesFileName = aux.dbroot + "session/ongoing/"+ body.id + body.lid + ".ttsd";
		/*make a session file - this should only exist for the duration of the session.
			when the session ends, rename and copy the file to an archive: db/session/archive
		*/
		fs.writeFile(sesFileName, "", function(err){
			if(err)
				ret_error(res, "fe");
			else
				ret_start_sest(res, body);
		});
	}
	else{
		res.send("wait");
	}
}

function llu(req, res){
	/**
	*	Handle POST requests from "/session/llu"
	*		1. If timeout or leave, remove the entry from lnusers
	*		2. Look for entry in lnusers
	*		3. If not found, return "wait"
	*			If found, create session and return start session page
	*/
	if(body.reqType == 'leave' || body.reqType == 'timeout'){
		//remove entry in lnusers
		let link_data = {
			uid: uid,
			tid: tid
		};
		aux.ln_delete(link_data);
		if(body.reqType == 'timeout'){
			ret_error("toe");
			return;
		}
		return;
	}
	// See if the session file exists
	var searchFile = aux.dbroot + "session/ongoing/"+ body.lid + body.id + ".ttsd";
	fs.stat(searchFile, function(err, stats){
		if(err == null){//File exists
			ret_start_sesu(res, body);
		}
		else if(err.code == "ENOENT"){//File does not exist
			res.send("wait");
		}
		else//Some other error
			ret_error(res, "fe");
	});
}

function ret_start_sest(res, data){
	//TODO
}

function ret_start_sesu(res, data){
	//TODO
}

function start_sest(req, res){
	/**
	*	Respond to POST requests for "/session/start_t"
	*/
	let sesFile = aux.dbroot + "session/ongoing/" + body.id + body.lid + ".ttsd";
	//If aborting, delete the session file.
	//don't bother with archive because it hasn't even started yet
	if(body.reqType == 'leave'){
		fs.unlink(sesFile, function(err){
			if(err)
				ret_error(res, "fe");
		});
	}
	else{ //START pressed
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){
					//user left (or magic ghosts deleted the file)
					aux.debugShout("1284", 3);
					ret_ended(res, body);
				}
				else
					ret_error(res, "fe");
			}
			else{//file exists
				//Append "session started at"+time
				//Show Tic Detected, Stop Session butttons
				var sEntry = "session started|" + aux.time();
				fs.appendFile(sesFile, sEntry, function(err){
					if(err){
						ret_error(res, "fe");
						return;
					}
					ret_session_t(res, body);
				});
			}
		});
	}
}

function start_sesu(req, res){
	/**
	*	Respond to POST requests for "/session/start_u"
	*/
	let sesFile = aux.dbroot + "session/ongoing/" + body.lid + body.id + ".ttsd";
	//end session - it has not started yet, so just delete it
	if(body.reqType == 'leave' || body.reqType == 'timeout'){
		fs.unlink(sesFile, function(err){
			if(err){
				ret_error(res, "fe");
			}
			else if(body.reqType == 'timeout'){
				ret_ended(res, body);
			}
		});
	}
	else if(body.reqType == 'started'){
		// Check to see if the session has started
		let searchFile = aux.dbroot + "session/ongoing/"+ body.lid + body.id + ".ttsd";
		fs.readFile(searchFile, "utf8", function(err, sfdata){
			if(err){
				if(err.code == "ENOENT")//trainer left
					ret_ended(res, body);
				else
					ret_error("fe");
					callback("fe");
				return;
			}
			if(sfdata.indexOf("session started|") == -1){
				res.send("wait");
				return;
			}
			//load level and points and start session
			//TODO
			aux.loadAcc(body.id, function(err, uData){
				if(err){
					ret_error(res, err);//anfe or ide
					return;
				}
				if(body.lid == 'a'){
					body.ntid = uData[8];
					callback(null, "session", body);
				}
				else{
					// TODO: Populate the hbs_data object
					var ru_settings = uData[7].split(","); //(RS,AITI,SMPR,PTIR,FLASH)
					if(ru_settings[4] == "YES")
						body.flash = true;
					else//This could be a moment to check if it says NO or if there's an error
						body.flash = false;
					var startLPEntry = "\nstarting user l,p,c|"+ lpc[0]+","+lpc[1]+","+lpc[2];
					fs.appendFile(searchFile, startLPEntry, function(err){
						if(err){
							callback("fe");
							return;
						}
						//current session file length (just two/three lines)
						//TO DO: fix so it won't continue an immediately terminated session.
						body.sesL = sfdata.length + startLPEntry.length;
						ret_sesu(res, body);
					});
				}
			});
		});
	}
}

function ret_ended(res, data){
	//TODO
}

function ret_session_t(res, data){
	//TODO
}

//TODO: sest & sesu