/**
*	Functions that handle HTTP requests
*/

//Import modules
const fs = require("fs");
const scriptsroot = __dirname;
const aux = require(scriptsroot+"/auxiliary.js");

module.exports.root = root;
module.exports.err_get = err_get;
module.exports.ghses = ghses;
module.exports.login_get = login_get;
module.exports.login = login;
module.exports.logout = logout;
module.exports.register_user = register_user;
module.exports.register_trainer = register_trainer;
module.exports.manage_get = manage_get;
module.exports.manage = manage;
module.exports.new_session_get = new_session_get;
module.exports.new_session = new_session;
module.exports.ll_get = ll_get;
module.exports.llt = llt;
module.exports.llu = llu;
module.exports.ss_get = ss_get;
module.exports.sst = sst;
module.exports.ssu = ssu;
module.exports.ses_get = ses_get;
module.exports.sest = sest;
module.exports.sesu = sesu;
module.exports.session_ended_get = session_ended_get;
module.exports.gj_recent_session = gj_recent_session;
module.exports.gj_settings = gj_settings;


function ret_error(res, err, redirect){
	/**
	*	Return an error page
	*/
	
	let default_redirect = "/";
	if(err == "conses"){
		default_redirect = "/session/";
	}
	redirect = redirect || default_redirect;
	
	let hbs_data = {
		layout: "simple",
		title: "Unknown Error",
		retry: (redirect ? redirect : "/"),
		retry_cls: "bigBtn"
	};
	let status_code = 400;
	if(["fe", "se"].indexOf(err) > -1){
		status_code = 500;
		hbs_data.e500 = true;
		hbs_data.retry_cls = "btn";
	}
	res.status(status_code);
	
	if(aux.err_types.indexOf(err) > -1){
		aux.db_log("38: "+err);
		hbs_data[err] = true;
		hbs_data.title = aux.err_titles[err];
		res.render("error", hbs_data);
	}
	else{
		aux.db_log("54: "+err);
		res.render("error", hbs_data);
		//TODO: Handle other errors better
	}
}

function err_get(req, res, next){
	/**
	*	Handle GET requests for error pages
	*/
	
	let err = req.path.slice(req.path.lastIndexOf("/")+1);
	if(err.slice(-5) == ".html"){
		// Process a normal GET
		next();
	}
	else{
		//TODO: allow redirect in the query?
		ret_error(res, err);
	}
}

function ghses(req, res){
	/**
	*	Handle POST requests from the Ghost Session Termination page
	*/
	
	let credentials = {
		id: req.body.tid,
		pw: req.body.pw
	}
	aux.login(credentials, (err, acc_obj, con) => {
		if(err){
			ret_error(res, err);
			return;
		}
		let tid = req.body.tid;
		if(tid[0] == 'a'){
			tid = 'a';
		}
		var sesFile = aux.dbroot + "session/ongoing/"+ tid + "-" + req.body.uid + ".ttsd";
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){//already deleted
					res.redirect("/session/");
				}
				else{
					ret_error(res, "fe");
				}
			}
			else{//legit ghost file
				aux.archive_session(sesFile, function(err, report){
					if(err){
						ret_error(res, err);
						return;
					}
					res.redirect("/session/");
					aux.log_error("ghost session", "ghost session archived between "+tid+" and "+req.body.uid);
				});
			}
		});
	});
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
			ret_error(res, "se");
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
			ret_error(res, "se");
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
		let acc_obj = req.session.acc_obj;
		aux.get_links(acc_obj, null, (err, lids) => {
			if(err){
				ret_error(res, "se"); //TODO
				return;
			}
			let isuser = acc_obj.id[0] == "u";
			let hbs_data = {
				layout: "main",
				title: "Manage Account",
				acc_obj: JSON.stringify(acc_obj),
				isuser: isuser,
				id: acc_obj.id,
				linked_accounts: JSON.stringify(lids)
			};
			const lang = req.acceptsLanguages(...aux.languages);
			aux.get_locale_data(lang, (err, locale_data) => {
				if(err){
					ret_error(res, "se");
					return;
				}
				// Combine all the data into one object for Handlebars
				var all_data = {...hbs_data, ...locale_data};
				// This is the step where handlebars injects the data
				res.render("manage", all_data);
			});
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
					if(err.code == "ER_DUP_ENTRY"){
						// Link already exists
						aux.db_log("Link already exists");
						res.redirect("/account/manage");
					}
					else if(err.code == "ER_NO_REFERENCED_ROW_2"){
						// Account does not exist
						aux.db_log("That account does not exist");
						res.redirect("/account/manage");
					}
					else{
						ret_error(res, err);
					}
					return;
				}
				// Reload the account manage page
				res.redirect("/account/manage");
			});
		}
		else{ //editP
			let data = {
				id: acc_obj.id,
				edits: {
					"password": req.body.pw
				}
			}
			aux.edit_account(data, con, (err, acc_obj) => {
				if(err){
					ret_error(res, err);
					return;
				}
				// Update the cookie to reflect the change
				req.session.acc_obj = acc_obj;
				//console.log(`216: ${val}`)
				// Reload the account manage page
				res.redirect("/account/manage");
			})
		}
	});
}

// Requests related to training sessions

function new_session_get(req, res){
	/**
	*	Return the page for starting a new session
	*/
	if(req.session && req.session.acc_obj){
		let acc_obj = req.session.acc_obj;
		aux.get_links(acc_obj, null, (err, lids) => {
			if(err){
				ret_error(res, "se"); //TODO
				return;
			}
			//let isuser = acc_obj.id[0] == "u";
			let hbs_data = {
				layout: "simple",
				title: "New Session",
				acc_obj: JSON.stringify(acc_obj),
				//isuser: isuser,
				linked_accounts: lids//JSON.stringify(lids)
			};
			const lang = req.acceptsLanguages(...aux.languages);
			aux.get_locale_data(lang, (err, locale_data) => {
				if(err){
					ret_error(res, "se");
					return;
				}
				// Combine all the data into one object for Handlebars
				var all_data = {...hbs_data, ...locale_data};
				// This is the step where handlebars injects the data
				res.render("new_session", all_data);
			});
		});
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect=/session/");
	}
}

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
	let tid = req.body.id;
	let uid = req.body.lid;
	let isuser = false;
	if(req.body.id[0] == "u"){
		isuser = true;
		tid = req.body.lid;
		uid = req.body.id;
	}
	let sesFile = aux.dbroot + "session/ongoing/" + tid + "-" + uid + ".ttsd";
	// Note: is this really the right time to check for conses?
	fs.stat(sesFile, function(err){
		if(err){
			if(err.code == "ENOENT"){ //Good.
				// Save lid in the session
				req.session.lid = req.body.lid;
				if(isuser){
					//Now add uid to lnusers
					let link_data = {
						uid: uid,
						tid: tid,
						ts: Date.now()
					};
					aux.ln_add(link_data);
					res.redirect("/session/llu");
				}
				else{
					res.redirect("/session/llt");
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

function ll_get(req, res){
	/**
	*	Return one of the LinkLoading pages
	*/
	if(req.session && req.session.acc_obj){
		if(req.session.lid){
			let id = req.session.acc_obj.id;
			let lid = req.session.lid;
			let isuser = id[0] == "u";
			let hbs_data = {
				layout: "simple",
				title: "Loading Link",
				id: id,
				lid: lid
			};
			if(isuser)
				res.render("llu", hbs_data);
			else
				res.render("llt", hbs_data);
		}
		else{
			res.redirect("/session/");
		}
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect=/session/");
	}
}

function llt(req, res){
	/**
	*	Handle POST requests from "/session/llt"
	*		1. Exit if timeout reached
	*		2. Look for entry in lnusers
	*		3. If not found, return "wait"
	*			If found, create session and return start session page
	*/
	// TODO: Test to see if this crashes if there is no session
	let id = req.session.acc_obj.id;
	let lid = req.session.lid;
	let link_data = {
		uid: lid,
		tid: id
	};
	if(aux.ln_has(link_data)){
		aux.ln_delete(link_data);
		var sesFileName = aux.dbroot + "session/ongoing/"+ id + "-" + lid + ".ttsd";
		/*make a session file - this should only exist for the duration of the session.
			when the session ends, rename and copy the file to an archive: db/session/archive
		*/
		fs.writeFile(sesFileName, "", function(err){
			if(err)
				res.send("err=fe");
				//ret_error(res, "fe");
			else
				res.send("next=sst");
				//res.redirect("/session/sst");
		});
	}
	else{
		res.send("msg=wait");
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
	let id = req.session.acc_obj.id;
	let lid = req.session.lid;
	if(req.body.reqType == 'leave' || req.body.reqType == 'timeout'){
		//remove entry in lnusers
		let link_data = {
			uid: id,
			tid: lid
		};
		aux.ln_delete(link_data);
		return; // No response expected on leave
	}
	// See if the session file exists
	var searchFile = aux.dbroot + "session/ongoing/"+ lid + "-" + id + ".ttsd";
	fs.stat(searchFile, function(err, stats){
		if(err == null){//File exists
			res.send("next=ssu");
		}
		else if(err.code == "ENOENT"){//File does not exist
			res.send("msg=wait");
		}
		else//Some other error
			res.send("err=fe");
	});
}

function ss_get(req, res){
	/**
	*	Return one of the Start Session pages
	*/
	if(req.session && req.session.acc_obj){
		if(req.session.lid){
			let id = req.session.acc_obj.id;
			let lid = req.session.lid;
			let isuser = id[0] == "u";
			let hbs_data = {
				layout: "simple",
				title: "Link Successful",
				id: id,
				lid: lid
			};
			if(isuser)
				res.render("ssu", hbs_data);
			else
				res.render("sst", hbs_data);
		}
		else{
			res.redirect("/session/");
		}
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect=/session/");
	}
}

function sst(req, res){
	/**
	*	Handle POST requests from "/session/sst"
	*		1. If reqType == start, start session
	*		2. If reqType == leave, delete session file
	*/
	
	let id = req.session.acc_obj.id;
	let lid = req.session.lid;
	let sesFile = aux.dbroot + "session/ongoing/" + id + "-" + lid + ".ttsd";
	//If aborting, delete the session file.
	//don't bother with archive because it hasn't even started yet
	if(req.body.reqType == 'leave'){
		fs.unlink(sesFile, function(err){
			if(err)
				ret_error(res, "fe");
			// The browser isn't actually listening
		});
	}
	else if(req.body.reqType == 'start'){ //START pressed
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){
					//user left (or magic ghosts deleted the file)
					aux.db_log("1284", 2);
					res.redirect("/session/session_ended");
					//ret_ended(res, req.body);
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
					res.redirect("/session/sest");
					//ret_session_t(res, req.body);
				});
			}
		});
	}
}

function ssu(req, res){
	/**
	*	Handle POST requests from "/session/ssu"
	*		1. If reqType == started, check if session has started
	*		2. If reqType == leave || timeout, delete the session
	*/
	let id = req.session.acc_obj.id;
	let lid = req.session.lid;
	let sesFile = aux.dbroot + "session/ongoing/" + lid + "-" + id + ".ttsd";
	
	//end session - it has not started yet, so just delete it
	if(req.body.reqType == 'leave' || req.body.reqType == 'timeout'){
		fs.unlink(sesFile, function(err){
			// Not really listening
			/*if(err){
				ret_error(res, "fe");
			}
			else if(req.body.reqType == 'timeout'){
				res.redirect("/session/session_ended");
				//ret_ended(res, req.body);
			}*/
		});
	}
	else if(req.body.reqType == 'started'){
		// Check to see if the session has started
		fs.readFile(sesFile, "utf8", function(err, sfdata){
			if(err){
				if(err.code == "ENOENT")//trainer left
					res.send("next=session_ended");
				else
					res.send("err=fe");
				return;
			}
			if(sfdata.indexOf("session started|") == -1){
				res.send("msg=wait");
				return;
			}
			if(lid == 'a'){
				res.send("next=sesu");
			}
			else{
				//Add the Starting l,p,c line to the session file
				let level = req.session.acc_obj.level;
				let points = req.session.acc_obj.points;
				let coins = req.session.acc_obj.coins;
				let startLPCEntry = "\nstarting user l,p,c|"+ level +","+ points +","+ coins;
				fs.appendFile(sesFile, startLPCEntry, function(err){
					if(err){
						res.send("err=fe");
						return;
					}
					//TO DO: fix so it won't continue an immediately terminated session.
					//current session file length (just two/three lines)
					req.session.sesL = sfdata.length + startLPCEntry.length;
					//req.session.sesL += startLPCEntry.length;
					res.send("next=sesu");
				});
			}
		});
	}
}

function ses_get(req, res){
	/**
	*	Return either Session-trainer or Session-user
	*/
	if(req.session && req.session.acc_obj){
		let acc_obj = req.session.acc_obj;
		if(req.session.lid){
			let id = req.session.acc_obj.id;
			let lid = req.session.lid;
			let isuser = id[0] == "u";
			let hbs_data = {
				layout: "simple",
				title: "Training Session"
			};
			if(isuser){
				hbs_data.acc_obj = JSON.stringify(acc_obj),
				hbs_data.sesL = req.session.sesL;
				hbs_data.ncr = acc_obj.RS == "ncr";
				hbs_data.none = acc_obj.RS == "none";
				hbs_data.reg = acc_obj.RS == "reg";
				res.render("sesu", hbs_data);
			}
			else
				res.render("sest", hbs_data);
		}
		else{
			res.redirect("/session/");
		}
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect=/session/");
	}
}

function sest(req, res){
	/**
	*	Handle POST requests from the Session-trainer page
	*/
	let id = req.session.acc_obj.id;
	let lid = req.session.lid;
	let sesFile = aux.dbroot + "session/ongoing/" + id + "-" + lid + ".ttsd"; //TODO: a for admin
	
	console.log(672, req.body);
	
	switch(req.body.reqType){
		case "tic":
			var tEntry = "\ntic detected|" +aux.time();
			fs.stat(sesFile, function(err, stats){
				if(err == null){//File exists
					fs.appendFile(sesFile, tEntry, function(err){
						if(err)
							res.send("err=fe");
						else{
							res.send("msg=good");
						}
					});
				}
				//File does not exist.
				//This happens when the user has ended the session already
				else if(err.code == "ENOENT"){
					res.send("next=session_ended");
				}
				else//Some other error
					res.send("err=fe");
			});
			break;
		case "end":
			aux.db_log("SE-T");
			req.session.last_lid = req.session.lid;
			req.session.lid = null; // Blocks access to the active session pages
			var eEntry = "\nsession ended|"+aux.time();
			fs.stat(sesFile, function(err, stats){
				if(err == null){//File exists
					aux.db_log("586", 2);
					//should I also archive it? No, the user needs to save their new points and level
					fs.appendFile(sesFile, eEntry, function(err){
						if(err)
							res.send("err=fe");
						else{
							res.send("next=session_ended");
						}
					});
				}
				//File does not exist. 
				//This happens if the user has ended the session already
				else if(err.code == "ENOENT"){
					res.send("next=session_ended");
				}
				else{//Some other error
					res.send("err=fe");
				}
			});
			break;
		default:
			aux.db_log("679: Unknown request");
	}
}

function sesu(req, res){
	/**
	*	Handle POST requests from the Session-user page
	*/
	let id = req.session.acc_obj.id;
	let lid = req.session.lid;
	let sesFile = aux.dbroot + "session/ongoing/" + lid + "-" + id + ".ttsd"; //TODO: a for admin
	
	console.log(748, req.body);
	
	switch(req.body.reqType){
		case "check":
			//Check the session file here for tic detected or session ended
			var oldL = req.body.sesL;
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					console.log(756, err);
					res.json({err: "fe"});
					return;
				}
				var newL = data.length;
				aux.db_log("old: "+oldL+"new:"+newL+"sub: "+data.slice(oldL+1));
				var entries = data.slice(oldL).split("\n");// = cut off first ""\n
				aux.db_log("deltadata == "+entries);
				var retMessage = {
					newL: data.length,
					tics: 0,
					end: false
				};
				for(i = 1; i<entries.length; i++){//i=1 cut off first ""\n
					var entryType = entries[i].split("|")[0];//First part
					switch(entryType){
						case "tic detected":
							retMessage.tics++;
							break;
						case "session ended":
							retMessage.end = true;
							break;
						case "user l,p,c":
							break;
						default:
							aux.db_log("Unknown session file entry");
							break;
					}
				}
				res.json(retMessage);
			});
			break;
		case "end":
			aux.db_log("SE-U");
			req.session.last_lid = req.session.lid;
			req.session.lid = null; // Blocks access to the active session pages
			let data = {
				id: id,
				pwh: req.session.acc_obj.pwh,
				edits: {
					"level": req.body.level,
					"points": req.body.points,
					"coins": req.body.coins
					//TODO: best tfi
				}
			}
			aux.edit_account(data, null, (err, acc_obj) => {
				if(err){
					console.log(802, err);
					res.json({err: "se"});
					return;
				}
				// Update the cookie to reflect the change
				req.session.acc_obj = acc_obj;
				//End and archive session
				fs.readFile(sesFile, "utf8", function(err, sData){
					if(err){
						console.log(809);
						res.json({err: "fe"});
						return;
					}
					if(sData.indexOf("session ended") == -1){
						//The session still needs to be ended
						var eEntry = "\nsession ended|"+aux.time();
						fs.appendFile(sesFile, eEntry, function(err){
							if(err){
								console.log(870);
								res.json({err: "fe"});
								return;
							}
							aux.archive_session(sesFile, function(err, report){
								if(err){
									console.log(875);
									res.json({err: err});
									return;
								}
								res.json({next: "session_ended"});
							});
						});
					}
					else{
						aux.archive_session(sesFile, function(err, report){
							if(err){
								console.log(855);
								res.json({err: err});
								return;
							}
							// TODO: session ended page with report (xhr to load)
							res.json({next: "session_ended"});
						});
					}
				});
			});
			break;
		case "loglpc"://id, pass, l,p,c
			//Append to session file and edit user file.
			//Return an error if the session file doesn't exist.
			fs.access(sesFile, function(err){
				if(err){
					console.log(854);
					res.json({err: "fe"});
					return;
				}
				var newlpc = req.body.level +","+ req.body.points +","+ req.body.coins;
				var lpcEntry = "\nuser l,p,c|" +newlpc+ "|" +aux.time();
				fs.appendFile(sesFile, lpcEntry, function(err){
					if(err){
						console.log(861);
						res.json({err: "fe"});
						return;
					}
					let data = {
						id: id,
						pwh: req.session.acc_obj.pwh,
						edits: {
							"level": req.body.level,
							"points": req.body.points,
							"coins": req.body.coins
						}
					}
					aux.edit_account(data, null, (err, acc_obj) => {
						if(err){
							console.log(875, err); // This is happening
							res.json({err: err});
							return;
						}
						// Update the cookie to reflect the change
						req.session.acc_obj = acc_obj;
						res.json({ msg: "good" });
					});
				});
			});
			break;
	}
}

function session_ended_get(req, res){
	/**
	*	Handle GET requests for the Session Ended page
	*/
	if(req.session && req.session.acc_obj){
		let acc_obj = req.session.acc_obj;
		let isuser = acc_obj.id[0] == "u";
		let hbs_data = {
			layout: "main",
			title: "Session Ended",
			acc_obj: JSON.stringify(acc_obj),
			//isuser: isuser,
			lid: req.session.last_lid
		};
		const lang = req.acceptsLanguages(...aux.languages);
		aux.get_locale_data(lang, (err, locale_data) => {
			if(err){
				console.log(955);
				ret_error(res, "se");
				return;
			}
			// Combine all the data into one object for Handlebars
			var all_data = {...hbs_data, ...locale_data};
			// This is the step where handlebars injects the data
			res.render("session_ended", all_data);
		});
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect=/account/manage");
	}
}

function gj_recent_session(req, res){
	/**
	*	Attempt to load the report data for a recent session
	*/
	//console.log(973);
	let tid = req.session.acc_obj.id;
	let uid = req.query.lid;
	let isuser = false;
	if(req.session.acc_obj.id[0] == "u"){
		isuser = true;
		tid = req.query.lid;
		uid = req.session.acc_obj.id;
	}
	aux.load_report(tid, uid, (err, report) => {
		//console.log(982, err, report);
		if(err){
			res.json({err: err});
		}
		else if(report){
			let res_obj = {
				msg: "ready",
				report: report
			};
			// Load updated info about the user
			aux.load_account(uid, null, (err, acc_obj) => {
				if(err){
					res.json({err: err});
					return;
				}
				if(isuser){
					// Go ahead and update acc_obj if user
					req.session.acc_obj = acc_obj;
				}
				res_obj.user_info = {
					level: acc_obj.level,
					points: acc_obj.points,
					coins: acc_obj.coins,
					best_tfi: acc_obj.best_tfi
				};
				res.json(res_obj);
			});
		}
		else{
			res.json({msg: "wait"});
		}
	});
}

function gj_settings(req, res){
	/**
	*	Return the settings.json file
	*/
	res.sendFile(aux.mainroot + "/settings.json");
}