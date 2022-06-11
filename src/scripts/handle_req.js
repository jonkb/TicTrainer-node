/**
*	Functions that handle HTTP requests
*/

//Import modules
const fs = require("fs");
const scriptsroot = __dirname;
const aux = require(scriptsroot+"/auxiliary.js");
const inventory = require(scriptsroot+"/../webroot/scripts/store.js").inv;
const settings = JSON.parse(fs.readFileSync(__dirname+"/../settings.json"));

// Middleware
module.exports.slash_redirect = slash_redirect;
module.exports.check_login = check_login;
module.exports.check_isadmin = check_isadmin;
module.exports.check_lid = check_lid;
module.exports.check_isuser = check_isuser;
module.exports.verify_account = verify_account;
module.exports.log_req = log_req;
// Handlers
module.exports.root = root;
module.exports.err_get = err_get;
module.exports.ghses = ghses;
module.exports.bug_report = bug_report;
// Requests related to accounts (registration, login, manage account)
module.exports.login_get = login_get;
module.exports.login = login;
module.exports.logout = logout;
module.exports.register_user = register_user;
module.exports.register_trainer = register_trainer;
module.exports.manage_get = manage_get;
module.exports.manage = manage;
module.exports.store_get = store_get;
module.exports.store = store;
// Requests related to surveys
module.exports.survey_get = survey_get;
module.exports.survey_consent = survey_consent;
module.exports.survey_initial = survey_initial;
module.exports.survey_weekly = survey_weekly;
// Requests related to training sessions
module.exports.new_session_get = new_session_get;
module.exports.new_session = new_session;
module.exports.ll_get = ll_get;
module.exports.llt = llt;
module.exports.llu = llu;
module.exports.ss_get = ss_get;
module.exports.sst = sst;
module.exports.ssu = ssu;
module.exports.ses_get = ses_get;
module.exports.tspses_get = tspses_get;
module.exports.sest = sest;
module.exports.sesu = sesu;
module.exports.session_ended_get = session_ended_get;
module.exports.ses_again = ses_again;
module.exports.new_tspses_get = new_tspses_get;
module.exports.tspsesu = tspsesu;
// Admin interface
module.exports.MAA_LA = MAA_LA;
module.exports.MAA_CP = MAA_CP;
module.exports.MAA_CA = MAA_CA;
module.exports.MRU_LA = MRU_LA;
module.exports.MRU_EA = MRU_EA;
module.exports.VL_log = VL_log;
//module.exports.admin_get = admin_get;
// GJ (Get Json) API
module.exports.gj_recent_session = gj_recent_session;
module.exports.gj_settings = gj_settings;
module.exports.gj_archived_logs = gj_archived_logs;
module.exports.gj_leaderboard = gj_leaderboard;

// Middleware

function slash_redirect(req, res, next){
	/**
	*	If the url is a directory without a trailing slash, 
	*	redirect to that same url with the slash.
	*	This helps relative urls to work more reliably.
	*/
	// console.log(66, req.path, req.path.endsWith("/"));
	if(!req.path.endsWith("/")){
		res.redirect(301, req.path + "/");
	}
	else{
		next();
	}
}

function check_login(req, res, next){
	/**
	*	Check if logged in. If not, redirect to login page
	*	However, does not re-verify the password
	*/
	
	if(req.session && req.session.acc_obj){
		// console.log(82, req.session.acc_obj);
		next();
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect="+encodeURIComponent(req.url));
	}
}

function check_lid(req, res, next){
	/**
	*	Check if the user is currently in a session
	*		(Is there req.session.lid?)
	*/
	//console.log(93, req.session.lid)
	if(req.session.lid){
		next();
	}
	else{
		let ses_root = req.url.slice(0, req.url.lastIndexOf("/")+1);
		res.redirect(ses_root);
	}
}

function check_isadmin(req, res, next){
	/**
	*	Same as check_login, but specific to admin
	*	Must be logged in as admin
	*	However, does not re-verify the password
	*/
	if(req.session && req.session.acc_obj && 
		req.session.acc_obj.id[0] == "a"){
		next();
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect="+encodeURIComponent(req.url));
	}
}

function check_isuser(req, res, next){
	/**
	*	Same as check_login, but specific to user
	*	Must be logged in as user
	*	However, does not re-verify the password
	*/
	if(req.session && req.session.acc_obj && 
		req.session.acc_obj.id[0] == "u"){
		next();
	}
	else{
		// Go to the login page
		res.redirect("/account/login?redirect="+encodeURIComponent(req.url));
	}
}

function verify_account(req, res, next){
	/**
	*	Verify account password (also update session.acc_obj)
	*	Should only be called after check_login or check_isadmin
	*/
	let credentials = {
		id: req.session.acc_obj.id,
		pwh: req.session.acc_obj.pwh
	};
	aux.login(credentials, (err, acc_obj) => {
		if(err){
			ret_error(res, err);
			return;
		}
		req.session.acc_obj = acc_obj;
		next();
	});
	
}

function log_req(req, res, next){
	/**
	*	Print the request to the console for debugging
	*/
	console.log(req.method, " request for ", req.url);
	console.log("\treq.body:", req.body);
	console.log("\treq.session keys:", Object.keys(req.session));
	console.log("\treq.query:", req.query);
	next();
}

// General handlers

function ret_error(res, err, retry){
	/**
	*	Return an error page, rendered dynamically with handlebars.
	*	err should (usually) be one of the elements of aux.err_types
	*/
	
	let default_retry = "/";
	if(err == "conses"){
		default_retry = "/session/";
	}
	retry = retry || default_retry;
	
	let hbs_data = {
		layout: "simple",
		title: "Unknown Error",
		retry: retry,
		retry_cls: "bigBtn"
	};
	let status_code = 400;
	if(["fe", "se"].includes(err)){
		status_code = 500;
		hbs_data.e500 = true;
		hbs_data.retry_cls = "btn";
	}
	res.status(status_code);
	
	if(aux.err_types.includes(err)){
		aux.db_log("38: "+err);
		hbs_data[err] = true;
		hbs_data.title = aux.err_titles[err];
		res.render("error", hbs_data);
	}
	else{
		aux.db_log("54: "+err);
		res.render("error", hbs_data);
		// IMPROVEMENT_TODO: Handle other errors better
	}
}

function err_get(req, res, next){
	/**
	*	Handle GET requests for error pages
	*/
	
	let err = req.path.slice(req.path.lastIndexOf("/")+1);
	let retry = req.query.retry || "/";
	if(err.slice(-5) == ".html"){
		// Process a normal GET
		next();
	}
	else{
		// Treat err as one of the error codes in aux.err_types
		ret_error(res, err, retry);
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
	// IMPROVEMENT_TODO: Use the new login session system?
	aux.login(credentials, (err, acc_obj) => {
		if(err){
			ret_error(res, err);
			return;
		}
		let tid = req.body.tid;
		if(tid[0] == 'a'){
			tid = 'a';
		}
		var sesFile = aux.logroot + "session/ongoing/"+ tid + "-" + req.body.uid + ".ttsd";
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
					let message = "ghost session archived between "+tid+" and "+req.body.uid;
					aux.log_error("ghost session", message, (err) => {
						if(err){
							ret_error(res, err);
							return;
						}
						res.redirect("/session/");
					});
				});
			}
		});
	});
}

function bug_report(req, res){
	/**
	*	Handle POST requests from the Bug Report / Feedback page
	*/
	// Build the string to be saved in the log file
	let message = `FROM:${req.body.fName}
EMAIL:${req.body.email}
MSG:${req.body.message}`;
	aux.log_feedback(req.body, (err) => {
		if(err){
			ret_error(res, err);
			return;
		}
		// Return report sent
		var hbs_data = {
			layout: "simple",
			title: "Report Sent",
			fn: req.body.fName
		};
		res.render("report_sent", hbs_data);
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
	let hbs_data = {
		layout: "simple",
		title: "Log in"
	};
	const lang = req.acceptsLanguages(...aux.languages);
	aux.get_locale_data(lang, (err, locale_data) => {
		if(err){
			ret_error(res, "se");
			return;
		}
		// Combine all the data into one object for Handlebars
		let all_data = {...hbs_data, ...locale_data};
		res.render("login", all_data);
	});
}

function login(req, res){
	/**
	*	Handle POST requests for "/account/login"
	*	Log the user in and redirect them to where they were trying to go.
	*/
	aux.login(req.body, (err, acc_obj) => {
		if(err){
			ret_error(res, err, "/account/login");
			return;
		}
		// Save login id & hash in cookie
		req.session.acc_obj = acc_obj;
		let next = req.query.redirect || "/";
		res.redirect(next);
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
	let acc_obj = req.session.acc_obj;
	
	if(acc_obj.id[0] == "a"){
		res.redirect("/admin/MAA.html");
		return;
	}
	
	aux.get_links(acc_obj, (err, lids) => {
		if(err){
			ret_error(res, "se"); // IMPROVEMENT_TODO: better error pages
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

function manage(req, res){
	/**
	*	Handle POST requests from "/account/manage"
	*	Follows check_login and verify_account
	*	req.body.source is one of:
	*		- addL
	*		- editP
	*/
	
	let acc_obj = req.session.acc_obj;
	switch(req.body.source){
		case "addL":
			// IMPROVEMENT_TODO: This would be a good candidate for XHR instead of
			// constantly redirecting back to the same page.
			let link_data = {
				id: acc_obj.id,
				lid: req.body.lid
			};
			aux.add_link(link_data, (err) => {
				if(err){
					if(err.code == "ER_DUP_ENTRY"){
						// Link already exists
						aux.db_log("Link already exists");
						res.redirect("/account/manage");
					}
					else if(err.code == "ER_NO_REFERENCED_ROW" ||
						err.code == "ER_NO_REFERENCED_ROW_2"){
						// Account does not exist
						aux.db_log("That account does not exist");
						res.redirect("/account/manage");
					}
					else{
						aux.db_log(err.code);
						ret_error(res, err);
					}
					return;
				}
				// Reload the account manage page
				res.redirect("/account/manage");
			});
			break;
		case "editP":
			let data = {
				id: acc_obj.id,
				edits: {
					"password": req.body.pw
				}
			}
			aux.edit_account(data, (err, acc_obj) => {
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
			break;
		default:
			ret_error(res, "ife");
	}
}

function store_get(req, res){
	/**
	*	Handle GET requests for "/account/store"
	*/
	let acc_obj = req.session.acc_obj;
	let hbs_data = {
		layout: "main",
		title: "TicTrainer Store",
		acc_obj: JSON.stringify(acc_obj),
		id: acc_obj.id
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
		res.render("store", all_data);
	});
}

function store(req, res){
	/**
	*	Handle POST requests for "/account/store"
	*/
	
	let acc_obj = req.session.acc_obj;
	
	if(req.body.source != "buy"){
		// Currently "buy" is the only source from the store page
		ret_error(res, "ife");
		return;
	}
	
	// Check that the user really has enough coins, then make the purchase
	aux.load_account(acc_obj.id, (err, acc_obj) => {
		if(err){
			ret_error(res, "se");
			return;
		}
		// TODO: validate this
		let price = inventory[req.body.item];
		if(price > acc_obj.coins){
			// In normal use, this should be impossible because the client checks
			ret_error(res, "ife");
			return;
		}
		let newcoins = acc_obj.coins - price;
		let newitems = acc_obj.items + req.body.item;
		let data = {
			id: acc_obj.id,
			edits: {
				"coins": newcoins,
				"items": newitems
			}
		}
		aux.edit_account(data, (err, acc_obj) => {
			if(err){
				ret_error(res, err);
				return;
			}
			// Update the cookie to reflect the change
			req.session.acc_obj = acc_obj;
			// Reload the store
			res.redirect("/account/store");
		});
	});
}

// Requests related to surveys

function survey_get(req, res){
	/** 
	*	Handle GET requests for "/survey/*"
	*/
	const lang = req.acceptsLanguages(...aux.languages);
	aux.get_locale_data(lang, (err, locale_data) => {
		if(err){
			ret_error(res, "se");
			return;
		}
		// Combine all the data into one object for Handlebars
		var all_data = {layout: "simple", ...locale_data};
		switch(req.path){
			case "/survey/consent":
				all_data.title = "Survey Consent";
				res.render("survey_consent", all_data);
				break;
			case "/survey/initial":
				all_data.title = "Initial Survey";
				res.render("survey_initial", all_data);
				break;
			case "/survey/weekly":
				all_data.title = "Weekly Survey";
				res.render("survey_weekly", all_data);
				break;
		}
	});
}

function survey_consent(req, res){
	/**
	*	Handle POST requests for "/survey/consent"
	*	body: consent_state, redirect
	*/
	let consent_state = req.body.consent == "Y" ? aux.consent_yes : aux.consent_no;
	let data = {
		tid: req.session.acc_obj.id,
		uid: req.session.lid,
		consent_state: consent_state
	};
	let next_url = "/";
	aux.log_survey("consent", data, (err) => {
		if(err){
			ret_error(res, err);
			return;
		}
		// query.redirect is the final destination (encoded), after finishing the whole survey
		//		Could be manage account or llt
		if(req.body.consent == "Y"){
			next_url = "/survey/initial?redirect="+encodeURIComponent(req.query.redirect);
		}
		else if(req.query.redirect){
			// Go straight to the final redirect, without taking the survey first
			next_url = req.query.redirect;
		}
		res.redirect(next_url);
	});
}

function survey_initial(req, res){
	/**
	*	Handle POST requests for "/survey/initial"
	*	Questions asked just the first time
	*	req.body should be entirely survey answers
	*/
	let data = {
		tid: req.session.acc_obj.id,
		uid: req.session.lid,
		answers: req.body
	};
	aux.log_survey("initial", data, (err) => {
		if(err){
			ret_error(res, err);
			return;
		}
		res.redirect(req.query.redirect);
	});
}

function survey_weekly(req, res){
	/**
	*	Handle POST requests for "/survey/weekly"
	*	req.body should be entirely survey answers
	*	MAYBE_TODO: Consolidate with survey_initial
	*/
	let data = {
		tid: req.session.acc_obj.id,
		uid: req.session.lid,
		answers: req.body
	};
	aux.log_survey("weekly", data, (err) => {
		if(err){
			ret_error(res, err);
			return;
		}
		res.redirect(req.query.redirect);
	});
}

// Requests related to training sessions

function new_session_get(req, res){
	/**
	*	Return the page for starting a new session
	*/
	let acc_obj = req.session.acc_obj;
	if(acc_obj.id[0] == "a"){
		// Admins don't use regular sessions
		res.redirect("/tsp/");
		return;
	}
	
	aux.get_links(acc_obj, (err, lids) => {
		if(err){
			ret_error(res, "se");
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

function new_tspses_get(req, res){
	/**
	*	Handle GET requests for /tsp/
	*/
	let acc_obj = req.session.acc_obj;
	let isuser = acc_obj.id[0] == "u";
	let israter = acc_obj.id[0] == "a";
	if(isuser){
		// Go ahead and start waiting for rater
		// MAYBE_TODO: Should this really use admin accounts?
		req.session.lid = "a";
		// Add uid to lnusers
		let link_data = {
			uid: req.session.acc_obj.id,
			tid: "a"
		};
		aux.ln_add(link_data);
		res.redirect("llu");
	}
	else if(israter){
		let hbs_data = {
			layout: "simple",
			title: "New TSP Session",
			acc_obj: JSON.stringify(acc_obj),
			linked_accounts: "u",
			isuser: false,
			israter: true
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
	}
	else{
		res.redirect("/");
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
	if(req.body.id[0] == "a"){
		tid = "a";
	}
	// Validate ids
	tid = aux.validate_id(tid, "at");
	uid = aux.validate_id(uid, "u");
	if(tid == "-" || uid == "-"){
		ret_error(res, "ife");
		return;
	}
	
	let sesFile = aux.logroot + "session/ongoing/" + tid + "-" + uid + ".ttsd";
	fs.stat(sesFile, function(err){
		if(err){
			if(err.code == "ENOENT"){ //Good.
				if(isuser){
					//Now add uid to lnusers
					let link_data = {
						uid: uid,
						tid: tid
					};
					aux.ln_add(link_data);
					// Save lid in the session & go to link loading.
					req.session.lid = tid;
					res.redirect("llu");
				}
				else if(tid[0] == "a"){
					// No need for surveys for admins
					// Save lid in the session
					req.session.lid = uid;
					res.redirect("llt");
				}
				else{
					// Before continuing to llt, check the survey state
					if(!settings.enable_surveys){
						req.session.lid = uid;
						res.redirect("llt");
						return;
					}
					aux.survey_check({tid: tid, uid: uid}, (err, next) => {
						if(err){
							ret_error(res, err);
							return;
						}
						// Save lid in the session
						req.session.lid = uid;
						if(next == "skip"){
							res.redirect("llt");// Skip the survey
						}
						else{
							// next should be "consent" or "weekly" (consent forwards to "initial")
							let redirect_url = req.path.slice(0,req.path.lastIndexOf("/")) + "/llt";
							let next_url = `/survey/${next}?redirect=${encodeURIComponent(redirect_url)}`;
							res.redirect(next_url);
						}
					});
				}
			}
			else{
				ret_error(res, "fe");//Why? Some weird error.
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

function llt(req, res){
	/**
	*	Handle POST requests from "/session/llt"
	*		1. Exit if timeout reached
	*		2. Look for entry in lnusers
	*		3. If not found, return "wait"
	*			If found, create session and return start session page
	*/
	let id = req.session.acc_obj.id;
	if(id[0] == "a"){
		id = "a";
	}
	let lid = req.session.lid;
	let link_data = {
		uid: lid,
		tid: id
	};
	console.log(659, link_data);
	if(aux.ln_has(link_data)){
		aux.ln_delete(link_data);
		var sesFileName = aux.logroot + "session/ongoing/"+ id + "-" + lid + ".ttsd";
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
	// TODO: since there's no beforepageunload here, the trainer 
	// 	could leave this page with session.lid intact and then go to one of 
	//		the ongoing session pages, leading to an error.
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
		delete req.session.lid;
		res.end();
		return;
	}
	// See if the session file exists
	var searchFile = aux.logroot + "session/ongoing/"+ lid + "-" + id + ".ttsd";
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
	let id = req.session.acc_obj.id;
	let lid = req.session.lid;
	let isuser = id[0] == "u";
	let israter = id[0] == "a";
	let hbs_data = {
		layout: "simple",
		title: "Link Successful",
		id: id,
		lid: lid
	};
	if(isuser)
		res.render("ssu", hbs_data);
	else if(israter)
		res.render("ssr", hbs_data);
	else
		res.render("sst", hbs_data);
}

function sst(req, res){
	/**
	*	Handle POST requests from "/session/sst"
	*		1. If reqType == start, start session
	*		2. If reqType == leave, delete session file
	*/
	
	let id = req.session.acc_obj.id;
	if(id[0] == "a")
		id = "a";
	let lid = req.session.lid;
	let sesFile = aux.logroot + "session/ongoing/" + id + "-" + lid + ".ttsd";
	//If aborting, delete the session file.
	//don't bother with archive because it hasn't even started yet
	if(req.body.reqType == 'leave'){
		fs.unlink(sesFile, function(err){
			// The browser isn't actually listening
			if(err){
				ret_error(res, "fe");
				return;
			}
			delete req.session.lid;
			res.end();
		});
	}
	else if(req.body.reqType == 'start'){ //START pressed
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){
					//user left (or magic ghosts deleted the file)
					aux.db_log("1284", 2);
					res.redirect("session_ended");
					//ret_ended(res, req.body);
				}
				else
					ret_error(res, "fe");
			}
			else{//file exists
				// Append "session started at"+time
				var sEntry = "";
				if(id[0] == "a"){
					// Add info specific to TSP sessions
					sEntry = "Research ID|?|"+req.body.stype+"\n";
					sEntry += "Rater ID|"+req.session.acc_obj.id+"\n";
				}
				// Also add a line for communicating ncr reward times if it's NCR mode
				if(req.body.stype == "NCR" && typeof(req.body.rew_times) == "string"){
					sEntry += "ncr reward times|" + req.body.rew_times+"\n";
				}
				sEntry += "session started|" + aux.time();
				fs.appendFile(sesFile, sEntry, function(err){
					if(err){
						ret_error(res, "fe");
						return;
					}
					res.redirect("sest");
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
	let sesFile = aux.logroot + "session/ongoing/" + lid + "-" + id + ".ttsd";
	
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
			delete req.session.lid;
			res.end();
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
				// No need to record lpc in tsp sessions
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
	let acc_obj = req.session.acc_obj;
	let id = acc_obj.id;
	let lid = req.session.lid;
	let isuser = id[0] == "u";
	let hbs_data = {
		layout: "simple",
		title: "Training Session"
	};
	if(isuser){
		hbs_data.acc_obj = JSON.stringify(acc_obj);
		hbs_data.ncr = acc_obj.RS == "ncr";
		hbs_data.none = acc_obj.RS == "none";
		hbs_data.reg = acc_obj.RS == "reg";
		res.render("sesu", hbs_data);
	}
	else
		res.render("sest", hbs_data);
}

function tspses_get(req, res){
	/**
	*	Return either tsp-session-rater or tsp-session-user
	*/
	let acc_obj = req.session.acc_obj;
	let id = acc_obj.id;
	let lid = req.session.lid;
	let isuser = id[0] == "u";
	let hbs_data = {
		layout: "simple",
		title: "TicTimer Session"
	};
	if(isuser){
		hbs_data.acc_obj = JSON.stringify(acc_obj);
		// hbs_data.ncr = acc_obj.RS == "ncr";
		// hbs_data.none = acc_obj.RS == "none";
		// hbs_data.reg = acc_obj.RS == "reg";
		res.render("tspsesu", hbs_data);
	}
	else
		res.render("tspsesr", hbs_data);
}

function sest(req, res){
	/**
	*	Handle POST requests from the Session-trainer page
	*/
	let id = req.session.acc_obj.id;
	if(id[0] == "a")
		id = "a";
	let lid = req.session.lid;
	let sesFile = aux.logroot + "session/ongoing/" + id + "-" + lid + ".ttsd";
	
	aux.db_log("672:" + req.body);
	
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
			delete req.session.lid; // Blocks access to the active session pages
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
	let sesFile = aux.logroot + "session/ongoing/" + lid + "-" + id + ".ttsd";
	
	aux.db_log("975:" + req.body);
	
	switch(req.body.reqType){
		case "check":
			//Check the session file here for tic detected or session ended
			var oldL = req.body.sesL;
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					aux.db_log("983:" + err);
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
						case "session started":
							break;
						case "starting user l,p,c":
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
			// Shouldn't actually change user lpc, since that's saved whenever it's changed
			aux.db_log("977: SE-U");
			req.session.last_lid = req.session.lid;
			delete req.session.lid; // Blocks access to the active session pages
			//End and archive session
			fs.readFile(sesFile, "utf8", function(err, sData){
				if(err){
					res.json({err: "fe"});
					return;
				}
				if(sData.indexOf("session ended") == -1){
					//The session still needs to be ended
					var eEntry = "\nsession ended|"+aux.time();
					fs.appendFile(sesFile, eEntry, function(err){
						if(err){
							res.json({err: "fe"});
							return;
						}
						aux.archive_session(sesFile, function(err, report){
							if(err){
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
							res.json({err: err});
							return;
						}
						res.json({next: "session_ended"});
					});
				}
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
					aux.edit_account(data, (err, acc_obj) => {
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

function tspsesu(req, res){
	/**
	*	Handle POST requests from "/tsp/sesu"
	*/
	let id = req.session.acc_obj.id;
	var sesFile = aux.logroot + "session/ongoing/a-" + id + ".ttsd";
	switch(req.body.reqType){
		case "start":
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					res.json({err: "fe"});
					return;
				}
				var sliced_d = data.slice(data.indexOf("session started|"));
				var end_s_i = sliced_d.indexOf("\n");
				if (end_s_i == -1)
					end_s_i = sliced_d.length;
				var stime = sliced_d.slice(sliced_d.indexOf("|")+1, end_s_i);
				sdate = new Date(stime);
				var timesince = Date.now() - sdate.getTime();
				let res_obj = {timesince: timesince.toString()};
				if(data.indexOf("ncr reward times|") != -1){
					let sliced_d = data.slice(data.indexOf("ncr reward times|"));
					let end_ncr_i = sliced_d.indexOf("\n");
					if (end_ncr_i == -1)
						end_ncr_i = sliced_d.length;
					let rtimes = sliced_d.slice(sliced_d.indexOf("|")+1, end_ncr_i);
					res_obj.rew_times = rtimes;
				}
				// Read reward_scheme + insert user RID
				var insertIndex = data.indexOf("Research ID|")+12;
				var before = data.slice(0,insertIndex);
				after = data.slice(insertIndex);
					after = after.slice(after.indexOf('|'));
				var stype = after.slice(1); // Read the session type / reward scheme
					stype = stype.slice(0,stype.indexOf('\n'));
				res_obj.stype = stype;
				fs.writeFile(sesFile, before+req.session.acc_obj.RID+after, function(err){
					if(err){
						res.json({err: "fe"});
						return;
					}
					console.log(1139);
					res.json(res_obj);
				});
			});
		break;
		case "check": // TEST_TODO
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					res.json({err: "fe"});
					return;
				}
				var entries = data.split("\n");
				var ttime = 0;//Last tic or s.start
				var rtime = 0;
				for(i = 1; i<entries.length; i++){//i=1 cut off first ""\n
					var entryType = entries[i].split("|")[0];//First part
					var entryVal = entries[i].split("|")[1];
					switch(entryType){
						case "session started":
							ttime = entryVal;
							rtime = entryVal;
						break;
						case "tic detected":
							ttime = entryVal;
						break;
						case "session ended":
							res.json({next: "end"});
							return;
						break;
						case "reward dispensed":
							rtime = entryVal;
						break;
						//default:
						//	retMessage += "&?";
						//break;
					}
				}
				
				const undershoot_ms = 50;
				var msi = parseInt(req.body.msi);
				var lasttic = new Date(ttime);
				var lastrew = new Date(rtime);
				var n = Math.max(Math.round((lastrew.getTime()-lasttic.getTime())/msi), 0) + 1;
				var nextrew = new Date(lasttic.getTime() + n*msi);
				var now = Date.now();
				var torew = nextrew.getTime()-now;
				aux.db_log("lt: "+lasttic.getTime()+", lr: "+lastrew.getTime()+", n: "+n
					+", nextrew: "+nextrew.getTime()+", now: "+now +", torew: "+torew);
				if(torew > undershoot_ms){
					res.json({next: "wait", time: torew});
				}
				else{
					res.json({next: "reward", time: torew+msi});
					var rdentry = "\nreward dispensed|" +aux.time();
					//Not done sequentially because I want it to reply fast
					fs.appendFile(sesFile, rdentry, function(err){});
				}
			});
		break;
		case "logrew":
			var rdentry = "\nreward dispensed|" +aux.time();
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					res.json({err: "fe"});
					return;
				}
				fs.appendFile(sesFile, rdentry, function(err){
					if(err){
						res.json({err: "fe"});
						return;
					}
					res.json({});
				});
			});
		break;
		case "end":
			req.session.last_lid = req.session.lid;
			delete req.session.lid; // Blocks access to the active session pages
			//End and archive session
			fs.readFile(sesFile, "utf8", function(err, sData){
				if(err){
					res.json({err: "fe"});
					return;
				}
				if(sData.indexOf("session ended") == -1){
					//The session still needs to be ended
					var eEntry = "\nsession ended|"+aux.time();
					fs.appendFile(sesFile, eEntry, function(err){
						if(err){
							res.json({err: "fe"});
							return;
						}
						aux.archive_session(sesFile, function(err, report){
							if(err){
								res.json({err: err});
								return;
							}
							res.json({});
						});
					});
				}
				else{
					aux.archive_session(sesFile, function(err, report){
						if(err){
							res.json({err: err});
							return;
						}
						res.json({});
					});
				}
			});
		break;
	}
}

function session_ended_get(req, res){
	/**
	*	Handle GET requests for the Session Ended page
	*/
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

function ses_again(req, res){
	let acc_obj = req.session.acc_obj;
	if(acc_obj.id[0] == "a" && req.query.lid){
		req.body.id = "a";
		req.body.lid = req.query.lid;
		// Start new session and redirect to llt
		new_session(req, res);
		return;
	}
	// Go back to /session/ or /tsp/
	res.redirect(".");
}

// Admin interface

function MAA_LA(req, res){
	/**
	*	Handle POST requests for /admin/MAA-load_admin
	*		Verify the password for the specified admin account
	*	Follows check_isadmin and verify_account
	*/
	let credentials = {
		id: req.body.id,
		pw: req.body.pw
	};
	aux.login(credentials, (err, acc_obj) => {
		if(err){
			res.json({err: err});
			return;
		}
		res.json({acc_obj: acc_obj});
	});
}

function MAA_CP(req, res){
	/**
	*	Handle POST requests for /admin/MAA-change_pw
	*		Verify the password for the specified admin account
	*		Change the password
	*	Follows check_isadmin and verify_account
	*/
	let credentials = {
		id: req.body.id,
		pw: req.body.pw
	};
	aux.login(credentials, (err, acc_obj) => {
		if(err){
			res.json({err: err});
			return;
		}
		let data = {
			id: req.body.id,
			edits: {
				password: req.body.new_pw
			}
		};
		aux.edit_account(data, (err) => {
			if(err){
				res.json({err: err});
				return;
			}
			res.json({msg: "good"});
		});
	});
}

function MAA_CA(req, res){
	/**
	*	Handle POST requests for /admin/MAA-create_admin
	*	Follows check_isadmin and verify_account
	*/
	aux.register_admin(req.body, (err, body) => {
		if(err){
			ret_error(res, err);
			return;
		}
		ret_created(res, body);
	});
}

function MRU_LA(req, res){
	/**
	*	Handle POST requests for /admin/MRU-load_acc
	*	Follows check_isadmin and verify_account
	*/
	aux.load_account(req.body.id, (err, acc_obj) => {
		if(err){
			res.json({err: err});
			return;
		}
		res.json({acc_obj: acc_obj});
	});
}

function MRU_EA(req, res){
	/**
	*	Handle POST requests for /admin/MRU-edit_acc
	*	Follows check_isadmin and verify_account
	*/
	let data = {
		id: req.body.id,
		edits: {
			RSTATE: req.body.RS,
			FLASH: req.body.FLASH,
			//RID: req.body.RID,
			//AITI: req.body.AITI,
			//SMPR: req.body.SMPR,
			//PTIR: req.body.PTIR
		}
	};
	// These aren't always updated
	if(req.body.RID)
		data.edits.RID = req.body.RID;
	if(req.body.AITI)
		data.edits.AITI = req.body.AITI;
	if(req.body.SMPR)
		data.edits.SMPR = req.body.SMPR;
	if(req.body.PTIR)
		data.edits.PTIR = req.body.PTIR;
	aux.edit_account(data, (err) => {
		if(err){
			res.json({err: err});
			return;
		}
		res.json({msg: "good"});
	})
}

function VL_log(req, res){
	/**
	*	Handle GET requests for /admin/VL-log
	*	If query.file is one of the three system logs, return that specified log.
	*	Otherwise, assume it's an archived session log filename
	*	Follows check_isadmin and verify_account
	*/
	let filename = req.query.file;
	if(!filename){
		ret_error(res, "ife");
	}
	switch(filename){
		case "console_log":
			res.sendFile(aux.console_log_file);
			break;
		case "err_log":
			res.sendFile(aux.err_log_file);
			break;
		case "lnusers":
			res.json(aux.ln_list());
			break;
		default:
			let path = aux.logroot + "session/archive/" + filename;
			res.sendFile(path);
	}
}

// GJ (Get Json) API

function gj_recent_session(req, res){
	/**
	*	Attempt to load the report data for a recent session
	*/
	let tid = req.session.acc_obj.id;
	let uid = req.query.lid;
	let isuser = req.session.acc_obj.id[0] == "u";
	if(isuser){
		tid = req.query.lid;
		uid = req.session.acc_obj.id;
	}
	if(!uid || uid.length < 2){
		res.json({err: "ife"});
		return;
	}
	aux.load_recent_report(tid, uid, (err, report) => {
		if(err){
			res.json({err: err});
		}
		else if(report){
			let res_obj = {
				msg: "ready",
				report: report
			};
			// Load updated info about the user
			aux.load_account(uid, (err, acc_obj) => {
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

function gj_archived_logs(req, res){
	/**
	*	Return a list of log files associated with the given user
	*	This is used by /admin/VL and /tsp/ (NCR)
	*	Follows check_isadmin and verify_account
	*/
	let uid = req.query.uid;
	if(req.session.lid){
		// Should be used by /tsp/ssa
		uid = uid || req.session.lid;
	}
	let stype = req.query.DRZ ? "DRZ" : null;
	aux.list_archived_sessions(uid, stype, (err, sessions) => {
		if(err){
			res.json({err: err});
			return;
		}
		res.json(sessions);
	});
}

function gj_leaderboard(req, res){
	/**
	*	Return the sorted list of the top 100 users.
	*/
	aux.list_top_users(null, (err, users) => {
		if(err){
			res.json({err: err});
			return;
		}
		res.json(users);
	});
}