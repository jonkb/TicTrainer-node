var fs = require("fs");
var url = require("url");
var qs = require("querystring");
//Auxiliary functions stored in aux to make this file shorter
var aux = require("./auxiliary.js");
//Functions that return dynamic webpages. Always pass with res as first arg.
var ret = require("./ret_dynamic.js");
var inventory = require("./store.js").inv;

module.exports.hrq = handleRequest;


function handleRequest(req, res){
	//Parse the request file name
	var pathname = url.parse(req.url).pathname;
	aux.debugShout(req.method + " request for " + pathname + " received.");
	var filename = pathname.substr(pathname.lastIndexOf("/"));
	if(filename == "/"){
		pathname += "index.html";
	}
	else if(aux.subdirs.includes(filename.slice(1))){
		/*This part makes it so typing the name of the subdirectory (eg. account, nt)
			Redirects to the correct place
		*/
		ret.redirect(res, pathname+"/index.html");
		return;
	}
	//Used twice below
	function reg_acc_cb(err, data){
		if(err){
			ret.error(res, err, pathname);
			return;
		}
		ret.created(res, data);
	}
	if(req.method == "POST"){
		var body = [];
		req.on('data', function(chunk) {
			body.push(chunk);
		}).on('end', function(){
			body = qs.parse(Buffer.concat(body).toString());
			aux.debugShout("request body:"+ JSON.stringify(body));
			//Decide what to do with the request based on its source
			switch(pathname){
				case "/register/trainer.html":
					reg_acc_req("t", body, reg_acc_cb);
				break;
				case "/register/user.html":
					reg_acc_req("u", body, reg_acc_cb);
				break;
				case "/account/index.html":
					acc_req(body, function(err, data){
						if(err){
							ret.error(res, err, pathname);
							return;
						}
						ret.manage_account(res, data);
					});
				break;
				//Start of session-related URLs
				case "/session/index.html":
					new_session_req(body, function(err, data){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						data.tryN = 0; //Necessary?
						//Go to Link Loading Page
						if(data.id[0]=="t")
							ret.link_loading_trainer(res, data);
						else if(data.id[0]=="u"){ 
							/* data.id[0] is definitely "u" because the error would have 
							 * already been caught otherwise. Except maybe 'a' somehow...*/
							ret.link_loading_user(res, data);
						}
					});
				break;
				case "/nt/index.html": //new TicTimer session (user)
				case "/nt/rater.html": //new TicTimer session (rater)
					new_session_req(body, function(err, data){
						if(err){
							ret.error(res, err, pathname);
							return;
						}
						//data.tryN = 0;
						//Go to Link Loading Page
						aux.debugShout("271: "+data.id);
						if(data.id[0] == "a")
							ret.link_loading_rater(res, data);
						else
							ret.link_loading_ntuser(res, data);
					});
				break;
				case "/session/linkloading-trainer.dynh":
					linkloading_t_req(body, function(err, next){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						if(next == "wait"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							//res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
							res.write("wait", function(err){res.end();});
						}
						else if(next == "start"){
							ret.start_session_trainer(res, body);
						}
					});
				break;
				case "/session/linkloading-user.dynh":
					linkloading_u_req(body, function(err, next){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						if(next == "wait"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("wait", function(err){res.end();});
						}
						else if(next == "start"){
							body.tryN = 0;
							ret.start_session_user(res, body);
						}
					});
				break;
				case "/nt/linkloading-rater.dynh":
					linkloading_t_req(body, function(err, next){
						if(err){
							ret.error(res, err, "/nt/rater.html");
							return;
						}
						if(next == "wait"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("wait", function(err){res.end();});
						}
						else if(next == "start"){
							ret.start_session_rater(res, body);
						}
					});
				break;
				case "/nt/linkloading-ntuser.dynh":
					linkloading_u_req(body, function(err, next){
						if(err){
							ret.error(res, err, "/nt/index.html");
							return;
						}
						if(next == "wait"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("wait", function(err){res.end();});
						}
						else if(next == "start"){
							body.tryN = 0;
							ret.start_session_ntuser(res, body);
						}
					});
				break;
				case "/session/startsession-trainer.dynh":
					startsession_t_req(body, function(err,next){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						if(next == "ended"){
							ret.redirect(res, "/session/session-ended.html");
							return;
						}
						if(next == "session"){
							ret.session_trainer(res, body);
						}
					});
				break;
				case "/session/startsession-user.dynh":
					startsession_u_req(body, function(err, next, body){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						if(next == "ended"){
							ret.redirect(res, "/session/session-ended.html");
							return;
						}
						if(next == "wait"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("wait", function(err){res.end();});
							return;
						}
						if(next == "session"){
							ret.session_user(res, body);
						}
					});
				break;
				case "/nt/startsession-rater.dynh":
					startsession_rater_req(body, function(err, next){
						if(err){
							ret.error(res, err, "/nt/rater.html");
							return;
						}
						if(next == "ended"){
							ret.nt_session_ended(res, body);
							//ret.redirect(res, "/session/session-ended.html");
							return;
						}
						if(next == "session"){
							ret.session_rater(res, body);
						}
					});
				break;
				case "/nt/startsession-ntuser.dynh":
					startsession_u_req(body, function(err, next, body){
						if(err){
							ret.error(res, err, "/nt/index.html");
							return;
						}
						if(next == "ended"){
							body.pw = "";//blank stand in so there's no error. Could switch with actual pw.
							ret.nt_session_ended(res, body);
							//ret.redirect(res, "/session/session-ended.html");
							return;
						}
						if(next == "wait"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("wait", function(err){res.end();});
							return;
						}
						if(next == "session"){
							//Now go in and figure out what kind of session it is. Also insert the NTID.
							var sesFile = "./session/ongoing/" + body.lid + body.id + ".ttsd";
							fs.readFile(sesFile, "utf8", function(err,data){
								if(err){
									ret.error(res, err, "/nt/index.html");
									return;
								}
								var insertIndex = data.indexOf('|')+1;
								var before = data.slice(0,insertIndex);
								after = data.slice(insertIndex);
									after = after.slice(after.indexOf('|'));
								var stype = after.slice(1);
									stype = stype.slice(0,stype.indexOf('\n'));
								body.stype = stype;
								fs.writeFile(sesFile, before+body.ntid+after, function(err){
									if(err){
										ret.error(res, "fe", "/nt/index.html");
										return;
									}
									ret.session_ntuser(res, body);
								});
							});
						}
					});
				break;
				case "/session/session-trainer.dynh":
					session_t_req(body, function(err, next){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						if(next == "ended"){
							ret.redirect(res, "/session/session-ended.html");
							return;
						}
						if(next == "good"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("good", function(err){res.end();});
							return;
						}
					});
				break;
				case "/nt/session-rater.dynh":
					session_t_req(body, function(err, next){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						if(next == "ended"){
							ret.nt_session_ended(res, body);
							return;
						}
						if(next == "good"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("good", function(err){res.end();});
							return;
						}
					});
				break;
				case "/session/session-user.dynh":
					session_u_req(body, function(err, next, retMessage){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						if(next == "check"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write(retMessage, function(err){res.end();});
						}
						else if(next == "log"){
							res.writeHead(200);
							res.end();
						}
						else if(next == "ended"){
							ret.redirect(res, "/session/session-ended.html");
						}
					});
				break;
				case "/nt/session-ntuser.dynh":
					session_ntu_req(body, function(err, next, retMessage){
						if(err){
							ret.error(res, err, "/nt/index.html");
							return;
						}
						switch(next){
							case "check":
							case "start":
								aux.debugShout("479: "+aux.time()+":"+retMessage, 3);
								res.writeHead(200, {"Content-Type": "text/plain"});
								res.write(retMessage, function(err){res.end();});
							break;
							case "rewlogged":
								res.writeHead(200, {"Content-Type": "text/plain"});
								res.end();
							break;
							case "end":
								res.writeHead(200, {"Content-Type": "text/plain"});
								res.write("end", function(err){res.end();});
							break;
							case "ended":
								body.pw = "";//blank stand in so there's no error. Could switch with actual pw.
								ret.nt_session_ended(res, body);
							break;
						}
					});
				break;
				case "/nt/nt-session-ended.dynh":
					ff_nt_ses(body, function(err){
						if(err){
							ret.error(res, err, "/nt/index.html");
							return;
						}
						//Go to Link Loading Page
						aux.debugShout("498: "+body.id);
						if(body.id[0] == "a")
							ret.link_loading_rater(res, body);
						else
							ret.link_loading_ntuser(res, body);
					});
				break;
				//End of session-related URLs
				case "/error/report.html":
					var content = body.fName+aux.division_char+body.email+aux.division_char+body.message;
					aux.log_error("report", content);
					ret.report_sent(res, body);
				break;
				case "/error/ghses.html":
					ghses_req(body, function(err){
						if(err){
							ret.error(res, err, pathname);
							return;
						}
						ret.redirect(res, "/session/index.html");
					});
				break;
				case "/admin/index.html":
					var req_flds = {
						"id": "id",
						"pw": "string"
					};
					var validation = aux.validate(body, req_flds);
					if(validation !== true){
						ret.error(res, validation);
						return;
					}
					if(body.id[0] != "a"){
						//No need to be courteous with a return address for the hackers
						ret.error(res, "ide");
						return;
					}
					aux.loadAcc(body.id, function(err, acc){
						if(err){
							ret.error(res, err, "/admin/index.html");
							return;
						}
						if(body.pw != acc[1]){
							ret.error(res, "pce", "/admin/index.html");
							return;
						}
						ret.admin(res, body);
					});
				break;
				case "/admin/interface.dynh":
					var req_flds = {
						"id": "id",
						"pw": "string",
						"target": "string"
					};
					var validation = aux.validate(body, req_flds);
					if(validation !== true){
						ret.error(res, validation);
						return;
					}
					if(body.id[0] != "a"){
						ret.error(res, "ide");
						return;
					}
					aux.loadAcc(body.id, function(err, acc){
						if(err){
							ret.error(res, err, "/admin/index.html");
							return;
						}
						if(body.pw != acc[1]){
							ret.error(res, "pce", "/admin/index.html");
							return;
						}
						switch(body.target){
							case "MAA":
								ret.manageAA(res, body);
							break;
							case "MRU":
								ret.manageRU(res, body);
							break;
							case "VL":
								ret.viewLogs(res, body);
							break;
						}
					});
				break;
				case "/admin/manageRU.dynh":
					MRU_req(body, function(err, to_write){
						if(err){
							ret.error(res, err, "/admin/index.html");
							return;
						}
						res.writeHead(200, {"Content-Type": "text/plain"});
						res.write(to_write, function(err){res.end();});
					});
				break;
				case "/admin/manageAA.dynh":
					MAA_req(body, function(err, to_write, adata){
						if(err){
							ret.error(res, err, "/admin/index.html");
							return;
						}
						if(to_write){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write(to_write, function(err){res.end();});
							return;
						}
						ret.created(res, adata);
					});
				break;
				case "/admin/viewLogs.dynh":
					VL_req(body, function(err, next_code, to_write){
						if(err){
							ret.error(res, err, "/admin/index.html");
							return;
						}
						if(next_code == 403){
							res.writeHead(403, {"Content-Type": "text/html; charset=UTF-8"});
							res.end();
							return;
						}
						if(next_code == 200){
							res.writeHead(200, {"Content-Type": "text/plain"});
							if(to_write.length > 0)
								res.write(to_write, function(err){res.end();});
							else
								res.end();
						}
						else
							ret.error(res, "se", "/admin/index.html");
					});
				break;
				case "/account/store/index.html":
					store_req(body, function(err, data){
						if(err){
							ret.error(res, err, pathname);
							return;
						}
						ret.store(res, data);
					});
				break;
			}//pathname switch
		});
	}//POST
	else{
		ret.requested_file(res, pathname);
	}
}

function reg_acc_req(type, body, callback){
	var req_flds = {
		"pw": "ice_check",
		"pwConf": "ice_check"
	};
	var newFile = "./account/";
	if(type == "t"){
		req_flds.birth = "date-year";
		newFile += "trainer_data/";
	}
	else if(type == "u"){
		req_flds.birth = "date-ms";
		req_flds.sex = "sex";
		newFile += "user_data/";
	}
	else{
		callback("se");
		return;
	}
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	var pass = body.pw;
	if(pass != body.pwConf){
		callback("pce");
		return;
	}
	var bD = body.birth;
	aux.getNextID(type, function(err, ID){
		if(err){
			callback("fe");
			return;
		}
		newFile += ID+".ttad";
		if(type == "u")
			var newData = aux.newU(ID,pass,bD,body.sex);
		else if(type == "t")
			var newData = aux.newT(ID,pass,bD);
		
		fs.writeFile(newFile, newData, function(err){
			if(err){
				callback("fe");
				return;
			}
			callback(null, newData);
		});
	});
}

function acc_req(body, callback){
	switch(body.source){
		case "manageAccount"://Log on page
			aux.debugShout("612", 3);
			var req_flds = {
				"id": "id",
				"pw": "string"
			};
			var validation = aux.validate(body, req_flds);
			if(validation !== true){
				callback(validation);
				return;
			}
			//loadAcc tests for ide too
			aux.loadAcc(body.id, function(err,user){
				aux.debugShout("615", 3);
				if(err){
					callback(err);
					return;
				}
				if(user[1] == body.pw)
					callback(null, user);
				else{
					callback("pce");
					aux.debugShout("624", 3);
				}
			});
		break;
		case "editP"://Source: editP, id, oldPass, pass
			var req_flds = {
				"id": "id",
				"oldPass": "string",
				"pass": "ice_check"//Checks for [<>]
			};
			var validation = aux.validate(body, req_flds);
			if(validation !== true){
				callback(validation);
				return;
			}
			var opw = body.oldPass;
			var pw = body.pass;
			
			aux.debugShout("Editing "+body.id, 1);
			aux.editAcc(body.id, 1, function(dEntry){
				if(dEntry[1] !== opw){
					aux.debugShout("640|" + dEntry[1] + "|" + opw + "|" + pw);
					callback("pce");
					return "<cancel>";
				}
				return pw;
			}, function(err, dEntry){
				if(err){
					if(err != "canceled"){
						if(dEntry)
							aux.debugShout(dEntry);
						callback(err);
					}
					return;
				}
				callback(null, dEntry);
			});
		break;
		case "addL"://Add Account Link
			var req_flds = {
				"id": "id",
				"lid": "id",
				"pw": "string"
			};
			var validation = aux.validate(body, req_flds);
			if(validation !== true){
				callback(validation);
				return;
			}
			var iD = body.id;// body = {source, id, lid, pw}
			var lID = body.lid;
			var lFile = "./account/";
			
			if(iD[0] == "t")
				lFile += "user_data/";
			else if(iD[0] == "u")
				lFile += "trainer_data/";
			else if(iD[0] == "a"){ //We don't link admin accouts
				callback("ide");
				return;
			}
			lFile += lID+".ttad";
			
			aux.debugShout("Linking " + lID + " to " + iD, 1);
			//Check that the other (lID) account exists
			fs.stat(lFile, function(err, stat){
				if(err == null){
					//Link to the account
					aux.editAcc(iD, 3, function(dEntry){
						if(dEntry[1] !== body.pw){
							callback("pce");
							return "<cancel>";
						}
						var dLinks = dEntry[3];
						var newLData = lID;//e.g. "t2"
						if(dLinks != ""){
							//verify that the account is not already linked
							var linkedAccs = dLinks.split(",");//split
							for(var i=0; i < linkedAccs.length; i++){
								if(linkedAccs[i] == lID){
									callback(null, dEntry);//do nothing
									return "<cancel>";//already linked
								}
							}
							newLData += "," + dLinks; //e.g. "t2"+","+"t1,t0"
						}
						return newLData;
					}, function(err, dEntry){
						if(err){
							if(err !== "canceled"){
								if(dEntry)
									aux.debugShout(dEntry);
								callback(err);
							}
							return;//canceled - page has already been returned
						}
						callback(err, dEntry);
					});
				}
				else if(err.code == 'ENOENT') {
					//File does not exist
					callback("anfe");
				}
				else {
					//Other error
					callback("fe");
				}
			});
		break;
	}
}

function new_session_req(body, callback){
	/**handle form submission for new session. Overview:
	verify password, check that accounts are linked,
	(if user) add id to lnusers.ttd,
		[loading page]set timer to look for session file every 2s for 1m -->
		[link successful page]set timer to look for "session started" every 2s for 1m -->
			[counter page]start local reward timer

	(if trainer) [loading page]set timer to look for other account (in lnusers) every 2s for 1m --> 
		[start page]create session data file, show Start button --> 
			[session control page]Append "session started at"+, show Tic Detected & End Session butttons
	 */
	var req_flds = {
		"id": "id",
		"lid": "string",
		"pw": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	/*Check that the accounts are linked and confirm pw.
		Note that this code is reused for users and trainers.
	*/
	aux.loadAcc(body.id, function(err, aData){
		if(err){
			callback(err, body);//make the default case an error
			return;
		}
		if(aData[1] != body.pw){
			//Password Confirmation Error
			callback("pce");
			return;
		}
		if(body.lid[0] == 'a'){
			//From now on, it doesn't matter which rater it is.
			body.lid = 'a';
		}
		else if(body.id[0] != 'a'){
			//Check if accounts are linked only if neither one is a rater (non-nt session)
			var lnAcc = aData[3].split(",");
			if(lnAcc.indexOf(body.lid) < 0){
				//Account not linked error
				callback("anle");
				return;
			}
		}
		/*Continue with the next step.
			See if a session file already exists between those users.
			If so, it's called a concurrent or ghost session.
		*/
		if("at".indexOf(body.id[0]) != -1){
			/* This section should hopefully never need to be used, but it 
			 * handles ghost sessions. Logs a ghost session error.*/
			var oldSFile = "./session/ongoing/" + body.id + body.lid + ".ttsd";
			if(body.id[0] == 'a')
				oldSFile = "./session/ongoing/a" + body.lid + ".ttsd";
			fs.stat(oldSFile, function(err){
				if(err){
					if(err.code == "ENOENT"){//Does not exist. Good.
						callback(null, body);//go to trainer loading page
					}
					else
						callback("fe");
				}
				else{//Bad, it's an old ghost session. Or it's concurrent.
					callback("conses");
				}
			});
		}
		else{//user
			var oldSFile = "./session/ongoing/"+ body.lid + body.id + ".ttsd";
			fs.stat(oldSFile, function(err){
				if(err){
					if(err.code == "ENOENT"){//Good.
						/*Data entry for the new waiting link
							Format: <uN,tM> [no \n]
						*/
						var linkData = aux.open_char +body.id+ aux.division_char +body.lid+ aux.close_char;
						fs.readFile("./session/lnusers.ttd", "utf8", function(err,data){
							if(err){
								callback("fe");
								ret.error(res, "fe", "/session/index.html", "new-session: reading lnusers.ttd");
								return;
							}
							if(data.indexOf(linkData) == -1)
								fs.appendFile("./session/lnusers.ttd", linkData, function(err){
									if(err){
										callback("fe");
									}
									else{
										//Go to user loading page
										callback(null, body);
									}
								});
							else//no need to add a new entry - should this throw an error?
								callback(null, body);
						});
					}
					else//why? weird error.
						callback("fe");
				}
				else{//There is a concurrent (or 'ghost') session
					callback("conses");
				}
			});
		}
	});
}

function linkloading_t_req(body, callback){
	if(body.timeout){
		callback("toe")
		//ret.error(res, "toe", "/session/index.html");
		return;
	}
	var req_flds = {
		"id": "id",
		"lid": "id"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
		if(err){
			callback("fe");
			//ret.error(res, "fe", "/session/index.html", "linkloading-trainer: reading lnusers.ttd");
		}
		else{
			//look for other account
			var searchEntry = aux.open_char +body.lid+ aux.division_char +body.id+ aux.close_char;
			var sesFileName = "./session/ongoing/"+ body.id + body.lid + ".ttsd";
			if(body.id[0] == "a"){
				searchEntry = aux.open_char +body.lid+ aux.division_char +"a"+ aux.close_char;
				sesFileName = "./session/ongoing/a"+ body.lid + ".ttsd";
			}
			var iSE = data.indexOf(searchEntry);
			if(iSE == -1){
				callback(null, "wait");
				//Wait two seconds and try again
			}
			else{
				var iSEEnd = iSE + searchEntry.length;
				var newData = data.slice(0, iSE) + data.slice(iSEEnd, data.length);
				fs.writeFile("./session/lnusers.ttd", newData, function(err){
					if(err){
						callback("fe");
						return;
					}
					/*make a session file - this should only exist for the duration of the session.
						when the session ends, rename and copy the file to an archive: ./session/archive
					*/
					fs.writeFile(sesFileName, "", function(err){
						if(err)
							callback("fe");
						else
							callback(null, "start");
					});
				});
			}
		}
	});
}

function linkloading_u_req(body, callback){
	//(if user) [loading page]set timer to look for session file every 2s for 1m -->
	var req_flds = {
		"reqType": "string",
		"id": "id",
		"lid": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	if(body.reqType == 'leave' || body.reqType == 'timeout'){
		//remove entry in lnusers
		fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
			if(err){
				callback("fe");
				//ret.error(res, "fe", "/", "linkloading-user: leave/timeout - read lnusers");
			}
			else{
				var searchEntry = aux.open_char +body.id+ aux.division_char +body.lid+ aux.close_char;
				aux.debugShout("attempting to delete entry: "+searchEntry);
				var iSE = data.indexOf(searchEntry);
				if(iSE != -1){
					var iSEEnd = iSE + searchEntry.length;
					var newData = data.slice(0, iSE) + data.slice(iSEEnd);
					fs.writeFileSync("./session/lnusers.ttd", newData, "utf8");//Cut out entry
					if(body.reqType == 'timeout')
						callback("toe");
						//ret.error(res, "toe", "/session/index.html");
				}
				else{
					callback("fe");
				}
			}
		});
	}
	else if(body.reqType == 'exists'){
		var searchFile = "./session/ongoing/"+ body.lid + body.id + ".ttsd";
		fs.stat(searchFile, function(err, stats){
			if(err == null){//File exists
				callback(null, "start");
				//body.tryN = 0;
				//ret.start_session_user(res, body);
			}
			else if(err.code == "ENOENT"){//File does not exist
				callback(null, "wait");
				//res.writeHead(200, {"Content-Type": "text/plain"});
				//res.write("wait", function(err){res.end();});
			}
			else//Some other error
				callback("fe");
		});
	}
}

function startsession_t_req(body, callback){
	var req_flds = {
		"id": "id",
		"lid": "id"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	//If aborting, delete the session file.
	//don't bother with archive because it hasn't even started yet
	if(body.reqType == 'leave'){
		var sesFile = "./session/ongoing/" + body.id + body.lid + ".ttsd";
		aux.debugShout("1270", 3);
		fs.unlink(sesFile, function(err){
			if(err)
				callback("fe");
				//ret.error(res, "fe", "/session/index.html", "start_session-trainer: leave");
		});
	}
	else{ //START pressed
		var sesFile = "./session/ongoing/"+ body.id + body.lid + ".ttsd";
		//If file does not exist, the user must have left early
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){
					//user left (or magic ghosts deleted the file)
					aux.debugShout("1284", 3);
					callback(null, "ended");
					//ret.redirect(res, "/session/session-ended.html");
				}
				else
					callback("fe");
			}
			else{//file exists
				//Append "session started at"+time, show Tic Detected, Stop Session butttons
				var sEntry = "session started|" + aux.time();
				fs.appendFile(sesFile, sEntry, function(err){
					if(err)
						callback("fe");
					else{
						callback(null, "session");
						//ret.session_trainer(res, body);
					}
				});
			}
		});
	}
}

function startsession_rater_req(body, callback){
	var req_flds = {
		"id": "id",
		"lid": "id",
		"reqType": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	//If aborting, delete the session file.
	//don't bother with archive because it hasn't even started yet
	var sesFile = "./session/ongoing/a" + body.lid + ".ttsd";
	if(body.reqType == 'leave'){
		aux.debugShout("1270", 3);
		fs.unlink(sesFile, function(err){
			if(err)
				callback("fe");
		});
	}
	else{ //One of the START buttons pressed
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){
					//user left (or magic ghosts deleted the file)
					aux.debugShout("1284", 3);
					callback(null, "ended");
					//ret.redirect(res, "/session/session-ended.html");
				}
				else
					callback("fe");
			}
			else{ //file exists
				var sEntry = "Research ID|?|"+body.stype;
				sEntry += "\nsession started|" + aux.time();
				if(body.stype == "NCR"){
					sEntry += "\nncr reward times|";
					if(typeof(body.rew_times) == "undefined"){
						body.rew_times = [];
					}
					else if(typeof(body.rew_times) == "string"){
						body.rew_times = [ body.rew_times ];
					}
					for(const t of body.rew_times){
						sEntry += t+",";
					}
					if(sEntry[sEntry.length-1] == ','){
						sEntry = sEntry.slice(0,-1);
					}
				}
				
				fs.appendFile(sesFile, sEntry, function(err){
					if(err)
						callback("fe");
					else{
						callback(null, "session");
					}
				});
			}
		});
	}
}

function startsession_u_req(body, callback){
	var req_flds = {
		"id": "id",
		"lid": "string", //nt lid is 'a'
		"reqType": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	if(body.reqType == 'leave' || body.reqType == 'timeout'){
		//end session - it has not started yet, so just delete it
		var sesFile = "./session/ongoing/" + body.lid + body.id + ".ttsd";
		fs.unlink(sesFile, function(err){
			if(err){
				callback("fe");
				//ret.error(res, "fe", "/session/index.html", "start_session-user: unlink");
			}
			else{
				callback(null, "ended", body);
				//ret.redirect(res, "/session/session-ended.html");
			}
		});
	}
	else if(body.reqType == 'started'){
		//has the session started
		var searchFile = "./session/ongoing/"+ body.lid + body.id + ".ttsd";
		fs.readFile(searchFile, "utf8", function(err, sfdata){
			if(err){
				if(err.code == "ENOENT")//trainer left
					callback(null, "ended", body);
					//ret.redirect(res, "/session/session-ended.html");
				else
					callback("fe");
					//ret.error(res, "fe", "/session/index.html", "start_session-user: read sesFile");
				return;
			}
			if(sfdata.indexOf("session started|") == -1){
				callback(null, "wait");
				return;
			}
			//load level and points and start session
			aux.loadAcc(body.id, function(err, uData){
				if(err){
					callback(err);//anfe or ide
					return;
				}
				if(body.lid == 'a'){
					body.ntid = uData[8];
					callback(null, "session", body);
				}
				else{
					if(body.pw != uData[1]){
						callback("pce");
						return;
					}
					var lpc = uData[5].split(",");
					body.level = lpc[0];
					body.points = lpc[1];
					body.coins = lpc[2];
					body.heap = uData[6];
					var ru_settings = uData[7].split(","); //(RS,AITI,SMPR,PTIR,FLASH)
					body.RS = ru_settings[0];
					body.aiti = ru_settings[1];
					body.smpr = ru_settings[2];
					body.ptir = ru_settings[3];
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
						callback(null, "session", body);
						//ret.session_user(res, body);
					});
				}
			});
		});
	}
}

function session_t_req(body, callback){
	var req_flds = {
		"id": "id",
		"lid": "id",
		"reqType": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	var sesFile = "./session/ongoing/"+ body.id + body.lid + ".ttsd";
	if(body.id[0] == 'a'){
		sesFile = "./session/ongoing/a" + body.lid + ".ttsd";
	}
	if(body.reqType == "tic"){
		var tEntry = "\ntic detected|" +aux.time();
		fs.stat(sesFile, function(err, stats){
			if(err == null){//File exists
				fs.appendFile(sesFile, tEntry, function(err){
					if(err)
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "session-trainer: append to sesFile");
					else{
						callback(null, "good");
						//res.writeHead(200, {"Content-Type": "text/plain"});
						//res.write("good", function(err){res.end();});
					}
				});
			}
			//File does not exist. 
			//This happens when the user has ended the session already
			else if(err.code == "ENOENT"){
				callback(null, "ended");
				//ret.redirect(res, "/session/session-ended.html");
			}
			else//Some other error
				callback("fe");
				//ret.error(res, "fe", "/session/index.html", "session-trainer: stat sesFile");
		});
	}
	else if(body.reqType == "end"){
		aux.debugShout("SE-T");
		var eEntry = "\nsession ended|"+aux.time();
		fs.stat(sesFile, function(err, stats){
			if(err == null){//File exists
				aux.debugShout("586", 3);
				//should I also archive it? No, the user needs to save their new points and level
				fs.appendFile(sesFile, eEntry, function(err){
					if(err)
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "session_end-trainer: append to sesFile");
					else{
						callback(null, "ended");
						//ret.redirect(res, "/session/session-ended.html");
					}
				});
			}
			//File does not exist. 
			//This happens if the user has ended the session already
			else if(err.code == "ENOENT"){
				callback(null, "ended");
			}
			else{//Some other error
				callback("fe");
			}
		});
	}
}

function session_u_req(body, callback){
	//Requests made from the ongoing user session
	var req_flds = {
		"id": "id",
		"lid": "id",
		"reqType": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	switch(body.reqType){
		case "check":
			//Check the session file here for tic detected or session ended
			var oldL = body.sesL;
			var sesFile = "./session/ongoing/"+ body.lid + body.id + ".ttsd";
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					callback("fe");
					return;
				}
				var newL = data.length;
				aux.debugShout("old: "+oldL+"new:"+newL+"sub: "+data.slice(oldL+1));
				var entries = data.slice(oldL).split("\n");// = cut off first ""\n
				aux.debugShout("deltadata == "+entries);
				var retMessage = data.length.toString();//new sesL
				for(i = 1; i<entries.length; i++){//i=1 cut off first ""\n
					var entryType = entries[i].split("|")[0];//First part
					switch(entryType){
						case "tic detected":
							retMessage += "&tic";
						break;
						case "session ended":
							retMessage += "&end";
						break;
						case "user l,p,c":
						break;
						default:
							retMessage += "&?";
						break;
					}
				}
				callback(null, "check", retMessage);
				//res.writeHead(200, {"Content-Type": "text/plain"});
				//res.write(retMessage, function(err){res.end();});
			});
		break;
		case "end":
			aux.debugShout("SE-U");
			var sesFile = "./session/ongoing/" + body.lid + body.id + ".ttsd";
			var newlpc = body.level +","+ body.points +","+ body.coins;
			//save user lpc
			aux.editAcc(body.id, 5, newlpc, function(err, uData){
				/* (newlpc) used to be a function that checked the password again and cancelled
				 * if there was a password error, but I decided that I'd rather not leave
				 * behind ghost sessions for every pce. Not that it's likely to happen much.
				*/
				if(err){
					callback(err);
					return;
				}
				//End and archive session
				fs.readFile(sesFile, "utf8", function(err, sData){
					if(err){
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "session_end-user: read sesFile");
						return;
					}
					if(sData.indexOf("session ended") == -1){
						//The session still needs to be ended
						var eEntry = "\nsession ended|"+aux.time();
						fs.appendFile(sesFile, eEntry, function(err){
							if(err){
								callback("fe");
								return;
							}
							aux.archiveSession(sesFile, function(err){
								if(err){
									callback(err);
									return;
								}
								callback(null, "ended")
							});
						});
					}
					else{
						aux.archiveSession(sesFile, function(err){
							if(err){
								callback(err);
								return;
							}
							callback(null, "ended")
						});
					}
				});
			});
		break;
		case "loglpc"://id, pass, l,p,c
			var sesFile = "./session/ongoing/"+ body.lid + body.id + ".ttsd";
			var newlpc = body.level +","+ body.points +","+ body.coins;
			var lpcEntry = "\nuser l,p,c|" +newlpc+ "|" +aux.time();
			//Append to session file and edit user file.
			//Return an error if the session file doesn't exist.
			fs.access(sesFile, function(err){
				if(err){
					callback("fe");
					//ret.error(res, "fe", "/session/index.html", "session-user: append to sesFile: "+body);
					return;
				}
				fs.appendFile(sesFile, lpcEntry, function(err){
					if(err){
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "session-user: append to sesFile: "+body);
						return;
					}
					aux.editAcc(body.id, 5, function(userData){
						if(body.pw != userData[1]){
							aux.debugShout("1277: "+body.pw+", "+userData[1]);
							callback("pce");
							//ret.error(res, "pce");
							return "<cancel>";
						}
						return newlpc;
					}, function(err, userData){
						if(err){
							if(err !== "canceled"){
								callback(err);
								//ret.error(res, err, "/session/index.html", userData);
							}
							return;
						}
						callback(null, "log");
						//res.writeHead(200);
						//res.end();
					});
				});
			});
		break;
	}
}

function session_ntu_req(body, callback){
	var req_flds = {
		"id": "id",
		"reqType": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	var sesFile = "./session/ongoing/a" + body.id + ".ttsd";
	switch(body.reqType){
		case "start":
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					callback("fe");
					return;
				}
				var sliced_d = data.slice(data.indexOf("session started|"));
				var end_s_i = sliced_d.indexOf("\n");
				if (end_s_i == -1)
					end_s_i = sliced_d.length;
				var stime = sliced_d.slice(sliced_d.indexOf("|")+1, end_s_i);
				sdate = new Date(stime);
				var timesince = Date.now() - sdate.getTime();
				let res = timesince.toString();
				if(data.indexOf("ncr reward times|") != -1){
					let sliced_d = data.slice(data.indexOf("ncr reward times|"));
					let end_ncr_i = sliced_d.indexOf("\n");
					if (end_ncr_i == -1)
						end_ncr_i = sliced_d.length;
					let rtimes = sliced_d.slice(sliced_d.indexOf("|")+1, end_ncr_i);
					res += "&" + rtimes;
				}
				aux.debugShout("1319: "+res, 3);
				callback(null, "start", res);
			});
		break;
		case "check":
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					callback("fe");
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
							callback(null, "end");
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
				var msi = parseInt(body.msi);
				var lasttic = new Date(ttime);
				var lastrew = new Date(rtime);
				var n = Math.max(Math.round((lastrew.getTime()-lasttic.getTime())/msi), 0) + 1;
				var nextrew = new Date(lasttic.getTime() + n*msi);
				var now = Date.now();
				var torew = nextrew.getTime()-now;
				aux.debugShout("lt: "+lasttic.getTime()+", lr: "+lastrew.getTime()+", n: "+n
					+", nextrew: "+nextrew.getTime()+", now: "+now +", torew: "+torew);
				if(torew > undershoot_ms){
					var msg = "wait:" + torew;
					callback(null, "check", msg);
				}
				else{
					var msg = "reward:" + (torew+msi);
					var rdentry = "\nreward dispensed|" +aux.time();
					//Not done sequentially because I want it to reply fast
					callback(null, "check", msg);
					fs.appendFile(sesFile, rdentry, function(err){});
				}
			});
		break;
		case "logrew":
			var rdentry = "\nreward dispensed|" +aux.time();
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					callback("fe");
					return;
				}
				fs.appendFile(sesFile, rdentry, function(err){
					if(err){
						callback("fe");
						return;
					}
					callback(null, "rewlogged");
				});
			});
		break;
		case "end":
			//End and archive session
			fs.readFile(sesFile, "utf8", function(err, sData){
				if(err){
					callback("fe");
					return;
				}
				if(sData.indexOf("session ended") == -1){
					//The session still needs to be ended
					var eEntry = "\nsession ended|"+aux.time();
					fs.appendFile(sesFile, eEntry, function(err){
						if(err){
							callback("fe");
							return;
						}
						aux.archiveSession(sesFile, function(err){
							if(err){
								callback(err);
								return;
							}
							callback(null, "ended")
						});
					});
				}
				else{
					aux.archiveSession(sesFile, function(err){
						if(err){
							callback(err);
							return;
						}
						callback(null, "ended")
					});
				}
			});
		break;
	}
}

function ff_nt_ses(body, callback){
	/*Here, we skip password verification and everything,
		fast-forwarding to the linkloading pages.
	*/
	var req_flds = {
		"id": "id",
		"lid": "string" //string, not id, since ntu sends lid of 'a'
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	if(body.id[0] == 'u'){
		var oldSFile = "./session/ongoing/a" + body.id + ".ttsd";
		fs.stat(oldSFile, function(err){
			if(err){
				if(err.code == "ENOENT"){//Good.
					/*Data entry for the new waiting link
						Format: <uN,tM> [with no \n]
					*/
					var linkData = aux.open_char +body.id+ aux.division_char +body.lid+ aux.close_char;
					fs.readFile("./session/lnusers.ttd", "utf8", function(err,data){
						if(err){
							callback("fe");
							ret.error(res, "fe", "/session/index.html", "new-session: reading lnusers.ttd");
							return;
						}
						if(data.indexOf(linkData) == -1)
							fs.appendFile("./session/lnusers.ttd", linkData, function(err){
								if(err){
									callback("fe");
								}
								else{
									//Go to user loading page
									callback(null, body);
								}
							});
						else//no need to add a new entry - should this throw an error?
							callback(null, body);
					});
				}
				else
					callback("fe");
			}
			else{//There is a concurrent (or 'ghost') session
				callback("conses");
			}
		});
	}
	else if(body.id[0] == "a"){
		var oldSFile = "./session/ongoing/a" + body.lid + ".ttsd";
		/*Concurrent session check.
			This could happen if the rater doesn't wait for the user's session to end.
		*/
		fs.stat(oldSFile, function(err){
			if(err){
				if(err.code == "ENOENT"){//Does not exist. Good.
					callback(null, body);
				}
				else
					callback("fe");
			}
			else{
				callback("conses");
			}
		});
	}
	else{
		callback("ife");
	}
}

function ghses_req(body, callback){
	var req_flds = {
		"tid": "id",
		"uid": "id",
		"pw": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	
	//verify password
	aux.loadAcc(body.tid, function(err, tData){
		if(err){
			callback(err);
			//ret.error(res, err);
			return;
		}
		if(tData[1] != body.pw){
			callback("pce");
			//ret.error(res, "pce");
			return;
		}
		if(body.tid[0] == 'a'){
			body.tid = 'a';
		}
		var sesFile = "./session/ongoing/"+ body.tid + body.uid + ".ttsd";
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){//already deleted
					callback();
				}
				else{
					callback("fe");
				}
			}
			else{//legit ghost file
				aux.archiveSession(sesFile, function(err){
					if(err){
						callback(err);
						return;
					}
					callback();
					aux.log_error("ghost session", "ghost session archived between "+body.tid+" and "+body.uid);
				});
			}
		});
	});
}

function MRU_req(body, callback){
	var req_flds = {
		"admin_id": "id",
		"admin_pw": "string",
		"source": "string",
		"id": "id"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	if(body.admin_id[0] != "a" || body.id[0] != "u"){
		callback("ide");
		return;
	}
	
	aux.loadAcc(body.admin_id, function(err, admin_acc){
		if(err){
			debugShout("1674", 2);
			callback(err);
			return;
		}
		if(body.admin_pw != admin_acc[1]){
			callback("pce");
			return;
		}
		aux.loadAcc(body.id, function(err, user_acc){
			if(err){
				callback(null, "error="+err);
				//res.writeHead(200, {"Content-Type": "text/plain"});
				//res.write("error="+err, function(err){res.end();});
				return;
			}
			if(body.source == "load_user_data"){
				var ntid = user_acc[8];
				var research_settings = user_acc[7].split(","); //(RS,AITI,SMPR,PTIR,FLASH)
				var res_str = "research_state="+research_settings[0]+
					"&aiti="+research_settings[1]+"&smpr="+research_settings[2]+
					"&ptir="+research_settings[3]+"&flash="+research_settings[4]+
					"&ntid="+ntid;
				callback(null, res_str);
				//res.writeHead(200, {"Content-Type": "text/plain"});
				//res.write(res_str, function(err){res.end();});
			}
			else if(body.source = "edit_acc"){
				//(RS,AITI,SMPR,PTIR,FLASH, NTID) Though all are optional except RS and FLASH
				req_flds.RS = "string";
				req_flds.FLASH = "string";
				validation = aux.validate(body, req_flds);
				if(validation !== true){
					callback(validation);
					return;
				}
				var old_settings = user_acc[7].split(","); //(RS,AITI,SMPR,PTIR,FLASH)
				var new_settings = user_acc[7].split(",");
				new_settings[0] = body.RS;
				new_settings[4] = body.FLASH;
				if(body.AITI)
					new_settings[1] = body.AITI;
				if(body.SMPR)
					new_settings[2] = body.SMPR;
				if(body.PTIR)
					new_settings[3] = body.PTIR;
				aux.debugShout(new_settings, 3);
				if(new_settings != old_settings){
					aux.editAcc(body.id, 7, new_settings.join(), function(err, uData){
						if(err){
							if(uData)
								aux.debugShout("899 "+uData);
							callback(err);
							//ret.error(res, err, "/admin/index.html");
							return;
						}
						edit_ntid(body);
					});
				}
				else{
					edit_ntid(body);
				}
			}
		});
	});
	function edit_ntid(body){
		if(body.NTID){
			aux.editAcc(body.id, 8, body.NTID, function(err, uData){
				if(err){
					if(uData)
						aux.debugShout("899 "+uData);
					callback(err);
					return;
				}
				callback(null, "good");
			});
		}
		else{
			callback(null, "good");
		}
	}
}

function MAA_req(body, callback){
	var req_flds = {
		"admin_id": "id",
		"admin_pw": "string",
		"source": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	if(body.admin_id[0] != "a"){
		callback("ide");
		return;
	}
	
	//Authenticate Admin
	aux.loadAcc(body.admin_id, function(err, admin_acc){
		if(err){
			debugShout("1775", 2);
			callback(err);
			return;
		}
		if(body.admin_pw != admin_acc[1]){
			callback("pce");
			return;
		}
		switch(body.source){
			case "load_user_data":
				req_flds.id = "id";
				req_flds.pw = "ice_check";
				validation = aux.validate(body, req_flds);
				if(validation !== true){
					callback(validation);
					return;
				}
				if(body.id[0] != "a"){
					callback("ide");
					return;
				}
				aux.loadAcc(body.id, function(err, acc){
					if(err){
						callback(null, "error="+err);
						return;
					}
					if(body.pw != acc[1]){
						callback(null, "error=pce");
						return;
					}
					/* Not really necessary. Though logically, it's like a placeholder 
					 * for if there were more account info to load and send back.
					 */
					callback(null, "aa_pass="+acc[1]);
				});
			break;
			case "change_pw":
				req_flds.id = "id";
				req_flds.pw = "ice_check";
				req_flds.new_pw = "ice_check";
				validation = aux.validate(body, req_flds);
				if(validation !== true){
					callback(validation);
					return;
				}
				if(body.id[0] != "a"){
					callback("ide");
					return;
				}
				aux.editAcc(body.id, 1, function(uData){
					if(body.pw != uData[1]){
						callback(null, "error=pce");
						return "<cancel>";
					}
					return body.new_pw;
				}, function(err, uData){
					if(err){
						if(err !== "canceled"){
							if(uData)
								aux.debugShout("946 "+uData);
							callback(err);
						}
						return;//already sent res (pce)
					}
					callback(null, "good");
				});
			break;
			case "register":
				req_flds.pw = "ice_check";
				req_flds.pwc = "ice_check";
				validation = aux.validate(body, req_flds);
				if(validation !== true){
					callback(validation);
					return;
				}
				if(body.pw != body.pwc){
					callback("pce");
					return;
				}
				//Get the next available iD number
				aux.getNextID("a", function(err, ID){
					if(err){
						callback(err);
						return;
					}
					var newAFile = "./account/admin_data/"+ID+".ttad";
					var aData = aux.newA(ID, body.pw);
					fs.writeFile(newAFile, aData, function(err){
						if(err)
							callback("fe");
						else
							callback(null, null, aData);
					});
				});
			break;
		}
	});
}

function VL_req(body, callback){
	var req_flds = {
		"admin_id": "id",
		"admin_pw": "string",
		"source": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	if(body.admin_id[0] != "a"){
		callback("ide");
		return;
	}
	aux.loadAcc(body.admin_id, function(err, admin_acc){
		if(err){
			aux.debugShout("1891", 2);
			callback(err);
			return;
		}
		if(body.admin_pw != admin_acc[1]){
			callback("pce");
			return;
		}
		if(body.source == "reqlist"){
			req_flds.uid = "string";
			var validation = aux.validate(body, req_flds);
			if(validation !== true){
				callback(validation);
				return;
			}
			fs.readdir("./session/archive", function(err,items){
				if(err){
					callback("fe");
					return;
				}
				var loglist = [];
				for(var i=0; i<items.length; i++){
					var item = items[i];
					//indexOf(): Only return those log files involving uid
					if(item[0] != "." && item.indexOf(body.uid+'_') != -1)
						loglist.push(item);
				}
				callback(null, 200, JSON.stringify(loglist));
			});
		}
		else if(body.source == "reqlog"){
			req_flds.file = "string";
			var validation = aux.validate(body, req_flds);
			if(validation !== true){
				callback(validation);
				return;
			}
			var ext = body.file.slice(body.file.lastIndexOf("."));
			if([".ttd", ".ttsd", ".txt"].indexOf(ext) < 0){
				//Requested the wrong type of file somehow
				aux.debugShout("1931", 2);
				callback(null, 403);
			}
			fs.readFile(body.file, "utf8", function(err, data){
				if(err){
					ret.error("fe", "/admin/index.html", "admin/viewLogs - reqlog");
					return;
				}
				callback(null, 200, data);
			});
		}
	});
}

function store_req(body, callback){
	var req_flds = {
		"id": "id",
		"pw": "string",
		"source": "string"
	};
	var validation = aux.validate(body, req_flds);
	if(validation !== true){
		callback(validation);
		return;
	}
	if(body.id[0] !== "u"){
		callback("ide");
		return;
	}
	if(body.source == "enterStore"){
		aux.loadAcc(body.id, function(err,user){
			if(err){
				callback(err);
				return;
			}
			if(body.pw != user[1]){
				callback("pce");
				return;
			}
			body.coins = user[5].split(",")[2];
			body.heap = user[6];
			aux.debugShout("1910: "+JSON.stringify(body), 3);
			callback(null, body);
		});
	}
	else if(body.source == "buy"){
		var item_price = inventory[body.item];
		if(isNaN(item_price)){
			/* Is not in inventory(may give a false positive)
			 * I'm ok with this because it would only be triggered by hackers, 
			 * who I feel no need to be courteous to. */
			callback("ife");
			return;
		}
		//Subtract the needed coins
		aux.editAcc(body.id, 5, function(uData){
			/* These really should have been caught earlier, 
			 * but it's good to be safe. */
			if(uData[1] !== body.pw){
				callback("pce");
				return "<cancel>";
			}
			var lpc = uData[5].split(",");
			if(lpc[2] < item_price){
				/* Not really the right error code, but again, this should 
				 * never happen to someone using the normal interface. */
				callback("ife");
				return "<cancel>";
			}
			var newlpc = lpc[0]+ "," +lpc[1]+ "," +(lpc[2]-item_price);
			return newlpc;
		}, function(err, uData){
			if(err){
				if(err !== "canceled"){
					if(uData)
						aux.debugShout("1944 "+uData);
					callback(err);
				}
				return;//already returned - ret.error
			}
			//add the item to their loot pile
			newHeap = body.item + uData[6];
			aux.editAcc(body.id, 6, newHeap, function(err, uData){
				if(err){
					if(uData)
						aux.debugShout("1954 "+uData);
					callback(err);
					return;
				}
				//Fix the body object to send back to the store page
				var lpc = uData[5].split(",");
				body.coins = lpc[2];
				body.heap = uData[6];
				aux.debugShout("1962 "+JSON.stringify(body), 3);
				callback(null, body);
			});
		});
	}
}
