var https = require("https");
var http = require("http");//For port 80 redirect server
var fs = require("fs");
var url = require("url");
//Auxiliary functions stored in aux to make this file shorter
var aux = require("./scripts/auxiliary.js");
//Functions that return dynamic webpages. Always pass with res as first arg.
var ret = require("./scripts/ret_dynamic.js");
var inventory = require("./scripts/store.js").inv;

const HTTPS_PORT = 443;
const TESTING_PORT = 8888;
const testing = true;


function handleRequest(req, res){
	// Parse the request file name
	var pathname = url.parse(req.url).pathname;
	var filename = pathname.substr(pathname.lastIndexOf("/"));
	if(filename == "/"){
		pathname += "index.html";
	}
	else if(filename.indexOf(".") == -1){
		pathname += "/index.html";
	}
	aux.debugShout(req.method + " request for " + pathname + " received.");
	//Handle POST requests
	if(req.method == "POST"){
		var body = [];
		req.on('data', function(chunk) {
			body.push(chunk);
		}).on('end', function(){
			var qs = require("querystring");
			body = qs.parse(Buffer.concat(body).toString());
			aux.debugShout("request body:"+ JSON.stringify(body));
			
			//Decide what to do with the request based on its source
			switch(pathname){
				case "/register/trainer.html":
					var bD = body.birth;
					var pass = body.pw;
					var passC = body.pwConf;
					
					//Double check validation
					if(!bD || !pass || !passC){
						ret.error(res, "ife", pathname);
						break;
					}
					if(isNaN(bD) || bD.length != 4){
						ret.error(res, "dfe", pathname);
						break;
					}
					if(pass != passC){
						ret.error(res, "pce", pathname);
						break;
					}
					//Make sure the plain text fields don't include < or >
					if(/[<>]/.test(pass+bD)){
						ret.error(res, "ice", pathname);//Invalid Character Error
						break;
					}
					//Get the next available iD number
					aux.getNextID("t", function(err, ID){
						if(err){
							ret.error(res, err);
							return;
						}
						var newTFile = "./account/trainer_data/"+ID+".ttad";
						var tData = aux.newT(ID,pass,bD);
						fs.writeFile(newTFile, tData, function(err){
							if(err)
								ret.error(res, "fe", pathname, "register-trainer: write newTFile");
							else
								ret.created(res, tData);
						});
					});
				break;
				case "/register/user.html":
					var sex = body.sex;
					var bD = body.birth;
					var pass = body.pw;
					var passC = body.pwConf;
					
					//Double check validation
					if(sex != "M" && sex != "F"){
						ret.error(res, "ife", pathname);
						break;
					}
					if(isNaN(bD)){//catches undefined 
						ret.error(res, "dfe", pathname);
						//I could check and do it anyway if they submitted month and year, but why be that courteous
						break;
					}
					if(pass != passC){
						ret.error(res, "pce", pathname);
						break;
					}
					//Make sure these don't include < or >
					if(/[<>]/.test(pass+bD)){
						ret.error(res, "ice", pathname);//Invalid Character Error
						break;
					}
					
					aux.getNextID("u", function(err, ID){
						if(err){
							ret.error(res, "fe", pathname, "register-user: getNextID");
							return;
						}
						var newUFile = "./account/user_data/"+ID+".ttad";
						var uData = aux.newU(ID,pass,bD,sex);
						fs.writeFile(newUFile, uData, function(err){
							if(err)
								ret.error(res, "fe", pathname, "register-user: write newUFile");
							else
								ret.created(res, uData);
						});
					});
				break;
				case "/account/index.html":
					function acc_ret(data){
						switch(data){
							case "fe":
							case "ide":
							case "ice":
							case "pce":
							case "anfe":
								ret.error(res, data, pathname);
							break;
							
							default:
								ret.manage_account(res, data);
							break;
						}
					}
					switch(body.source){
						case "manageAccount"://Log on page
						aux.debugShout("141", 2);
						//loadAcc tests for ide
						aux.loadAcc(body.id, function(err,user){
							aux.debugShout("143", 2);
							if(err){
								acc_ret(err);
								return;
							}
							if(user[1] == body.pw)
								acc_ret(user);
							else{
								acc_ret("pce");
								aux.debugShout("147", 2);
							}
						});
						break;
						case "editP"://Source: editP, id, oldPass, pass
							var iD = body.id;
							var opw = body.oldPass;
							var pw = body.pass;
							if(/[<>]/.test(pw)){
								acc_ret("ice");
								break;
							}
							
							aux.debugShout("Editing "+iD, 1);
							aux.editAcc(iD, 1, function(dEntry){
								if(dEntry[1] !== opw){
									aux.debugShout("163|" + dEntry[1] + "|" + opw + "|" + pw);
									acc_ret("pce");
									return "<cancel>";
								}
								return pw;
							}, function(err, dEntry){
								if(err){
									if(err != "canceled"){
										if(dEntry)
											aux.debugShout(dEntry);
										acc_ret(err);
									}
									return;
								}
								acc_ret(dEntry);
							});
						break;
						case "addL"://Add Account Link
							var iD = body.id;// body = {source, id, lid, pw}
							var lID = body.lid;
							var lFile = "./account/";
							
							iD = aux.isID(iD);
							lID = aux.isID(lID);
							if(iD === false || lID === false){
								acc_ret("ide");
								break;
							}
							if(iD[0] == "t")
								lFile += "user_data/";
							else if(iD[0] == "u")
								lFile += "trainer_data/";
							lFile += lID+".ttad";
							
							aux.debugShout("Linking " + lID + " to " + iD, 1);
							//Check that the other account exists
							fs.stat(lFile, function(err, stat){
								if(err == null) {
									//Link to the account
									aux.editAcc(iD, 3, function(dEntry){
										if(dEntry[1] !== body.pw){
											acc_ret("pce");
											return "<cancel>";
										}
										var dLinks = dEntry[3];
										var newLData = lID;//e.g. "t2"
										if(dLinks != ""){
											//verify that the account is not already linked
											var linkedAccs = dLinks.split(",");//split
											for(var i=0; i < linkedAccs.length; i++){
												if(linkedAccs[i] == lID){
													acc_ret(dEntry);//do nothing
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
												acc_ret(err);
											}
											return;//canceled - page has already been returned
										}
										acc_ret(dEntry);
									});
								}
								else if(err.code == 'ENOENT') {
									//File does not exist
									acc_ret("anfe");
								} 
								else {
									//Other error
									acc_ret("fe");
								}
							});
						break;
					}//Switch (body.source) (Within /account/index.html)
				break;
				//Start of session-related URLs
				case "/session/index.html":
					new_session_req(body, function(err, body){
						if(err){
							ret.error(res, err, "/session/index.html");
							return;
						}
						body.tryN = 0;
						//Go to Link Loading Page
						if(body.id[0]=="t")
							ret.link_loading_trainer(res, body);
						else{ //body.id[0] is definitely "u" because the error would have already been caught otherwise. Except maybe 'a' somehow...
							ret.link_loading_user(res, body);
						}
					});
				break;
				case "/nt/index.html": //new NewTics session (user)
				case "/nt/rater.html": //new NewTics session (rater)
					new_session_req(body, function(err, body){
						if(err){
							ret.error(res, err, pathname);
							return;
						}
						body.tryN = 0;
						//Go to Link Loading Page
						aux.debugShout("271: "+body.id);
						if(body.id == "a")
							ret.link_loading_rater(res, body);//TO DO: make new page here 
						else{ //body.id[0] is definitely "u" because the error would have already been caught otherwise.
							ret.link_loading_ntuser(res, body);//TO DO: make new page here
						}
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
							//res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
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
							ret.redirect(res, "/session/session-ended.html");
							return;
						}
						if(next == "session"){
							ret.session_trainer(res, body);//Reuse? Will that be ok?
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
							ret.redirect(res, "/session/session-ended.html");
							return;
						}
						if(next == "wait"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("wait", function(err){res.end();});
							return;
						}
						if(next == "session"){
							//Now go in and figure out what kind of session it is. Also insert the NTID.
							var sesFile = "./session/temp/session" + body.lid + body.id + ".ttsd";
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
							ret_error(res, err, "/session/index.html");
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
				case "/session/session-user.dynh":
					session_u_req(body, function(err, next, retMessage){
						if(err){
							ret_error(res, err, "/session/index.html");
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
						if(next == "check" || next == "start"){
							aux.debugShout("479: "+aux.time()+":"+retMessage);
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write(retMessage, function(err){res.end();});
							return;
						}
						else if(next == "end"){
							res.writeHead(200, {"Content-Type": "text/plain"});
							res.write("end", function(err){res.end();});
						}
						else if(next == "ended"){
							ret.redirect(res, "/session/session-ended.html");
						}
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
							ret_error(res, err, pathname);
							return;
						}
						ret.redirect(res, "/session/index.html");
					});
				break;
				case "/admin/index.html":
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
					switch(body.source){
						case "enterStore":
							//verify form
							body.id = aux.isID(body.id);
							if(body.id === false || body.id[0] !== "u"){
								ret.error(res, "ide", pathname);
								break;
							}
							aux.loadAcc(body.id, function(err,user){
								if(err){
									ret.error(res, err, pathname);//anfe
									return;
								}
								if(body.pw != user[1]){
									ret.error(res, "pce", pathname);
									return;
								}
								body.coins = user[5].split(",")[2];
								body.heap = user[6];
								aux.debugShout("1099 "+JSON.stringify(body), 3);
								ret.store(res, body);
							});
						break;
						case "buy":
							body.id = aux.isID(body.id);
							if(body.id === false || body.id[0] !== "u"){
								ret.error(res, "ide", pathname);
								break;
							}
							if(isNaN(inventory[body.item])){
								//Is not in inventory(may give a false positive)
								//I'm ok with this because it would only be triggered by hackers, 
								//who I feel no need to be courteous to
								ret.error(res, "ife", pathname);
								break;
							}
							//Subtract the needed coins
							aux.editAcc(body.id, 5, function(uData){
								//Again, these really should have been caught earlier
								if(uData[1] !== body.pw){
									ret.error(res, "pce", pathname);
									return "<cancel>";
								}
								var lpc = uData[5].split(",");
								if(lpc[2] < inventory[body.item]){
									ret.error(res, "ife", pathname);//Not really the right error code
									return "<cancel>";
								}
								var newlpc = lpc[0]+ "," +lpc[1]+ "," +(lpc[2]-inventory[body.item]);
								return newlpc;
							}, function(err, uData){
								if(err){
									if(err !== "canceled"){
										if(uData)
											aux.debugShout("1217 "+uData);
										ret.error(res, err, pathname);
									}
									return;//already returned - ret.error
								}
								//add the item to their loot pile
								newHeap = body.item + uData[6];
								aux.editAcc(body.id, 6, newHeap, function(err, uData){
									if(err){
										if(uData)
											aux.debugShout("1204 "+uData);
										ret.error(res, err, pathname);
										return;//already returned - ret.error
									}
									//Fix the body object to send back to the store page
									var lpc = uData[5].split(",");
									body.coins = lpc[2];
									body.heap = uData[6];
									aux.debugShout("1153 "+JSON.stringify(body), 3);
									ret.store(res, body);
								});
							});
						break;
					}
				break;//store
			}//pathname switch
		});
	}//POST
	else{
		ret.requested_file(res, pathname);
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
			[session control page]Append "session started at"+, show Tic Detected & Stop Session butttons
	 */
	
	body.id = aux.isID(body.id);
	body.lid = aux.isID(body.lid);
	if(body.id === false || body.lid === false){
		callback("ide");
		//ret.error(res, "ide", "/session/index.html");
		return;
	}
	/*Check that the accounts are linked and confirm pw.
		Note that this code is reused for users and trainers.
	*/
	aux.loadAcc(body.id, function(err, aData){
		if(err){
			callback(err, body);//make the default case an error
			//ret.error(res, err);
			return;
		}
		if(aData[1] != body.pw){
			//Password Confirmation Error
			callback("pce");
			//ret.error(res, "pce", "/session/index.html");
			return;
		}
		if(body.id[0] == 'a'){
			body.id = 'a';//From now on, it doesn't matter which rater it is.
		}
		else if(body.lid[0] == 'a'){
			body.lid = 'a';//From now on, it doesn't matter which rater it is.
		}
		else {
			//Check if accounts are linked only if neither one is a rater (non-nt session)
			var lnAcc = aData[3].split(",");
			if(lnAcc.indexOf(body.lid) < 0){
				//Account not linked error
				callback("anle");
				//ret.error(res, "anle", "/session/index.html");
				return;
			}
		}
		/*Continue with the next step.
			See if a session file already exists between those users.
			If so, it's called a concurrent or ghost session.
		*/
		if("at".indexOf(body.id[0]) != -1){
			//This section should hopefully never need to be used, but it handles ghost sessions. Logs a ghost session error.
			var oldSFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
			fs.stat(oldSFile, function(err){
				if(err){
					if(err.code == "ENOENT"){//Does not exist. Good.
						callback(null, body);//go to trainer loading page
					}
					else
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "new-session: checking if oldSFile exists"); //Some other bizarre error
				}
				else{//Bad, it's an old ghost session. Or it's concurrent.
					callback("conses");
					//ret.error(res, "conses", "/session/index.html");
				}
			});
		}
		else{//user
			var oldSFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
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
										//ret.error(res, "fe", "/session/index.html", "new-session: appending to lnusers.ttd");
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
						//ret.error(res, "fe", "/session/index.html", "new-session: checking if oldSFile exists");
				}
				else{//There is a concurrent (or 'ghost') session
					callback("conses");
					//ret.error(res, "conses", "/session/index.html", "new-session: concurrent/ghost session");
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
	//All the errors for id format have been caught already
	fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
		if(err){
			callback("fe");
			//ret.error(res, "fe", "/session/index.html", "linkloading-trainer: reading lnusers.ttd");
		}
		else{
			//look for other account
			var searchEntry = aux.open_char +body.lid+ aux.division_char +body.id+ aux.close_char;
			var iSE = data.indexOf(searchEntry);
			if(iSE == -1){
				callback(null, "wait");
				//Wait two seconds and try again
			}
			else{
				var iSEEnd = iSE + searchEntry.length;
				var newData = data.slice(0, iSE) + data.slice(iSEEnd, data.length);
				/*Cut out entry
					It's done sync so that the old entry isn't sitting in lnusers too long
				*/
				fs.writeFileSync("./session/lnusers.ttd", newData, "utf8");
				/*make a session file - this should only exist for the duration of the session.
					when the session ends, rename and copy the file to an archive: ./session/archive
				*/
				var sesFileName = "./session/temp/session"+ body.id + body.lid + ".ttsd";
				fs.writeFile(sesFileName, "", function(err){
					if(err)
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "linkloading-trainer: making session file");
					else
						callback(null, "start");
						//ret.start_session_trainer(res, body);//source, id, pw, lid, tryN 
				});
			}
		}
	});
}

function linkloading_u_req(body, callback){
	//(if user) [loading page]set timer to look for session file every 2s for 1m -->
	if(body.reqType == 'leave' || body.reqType == 'timeout'){
		//remove entry in lnusers
		fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
			if(err){//lnusers got destroyed?
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
					//ret.error(res, "fe", "/session/index.html", "linkloading-user: where did the lnusers entry go?");
				}
			}
		});
	}
	else if(body.reqType == 'exists'){
		var searchFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
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
				//ret.error(res, "fe", "/session/index.html", "linkloading-user: stat session file");
		});
	}
}

function startsession_t_req(body, callback){
	//If aborting, delete the session file - don't bother with archive because it hasn't even started yet
	if(body.reqType == 'leave'){
		var sesFile = "./session/temp/session" + body.id + body.lid + ".ttsd";
		aux.debugShout("1270", 3);
		fs.unlink(sesFile, function(err){
			if(err)
				callback("fe");
				//ret.error(res, "fe", "/session/index.html", "start_session-trainer: leave");
		});
	}
	else{ //START pressed
		var sesFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
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
					//ret.error(res, "fe","/session/index.html", "start_session-trainer: stat session file");
			}
			else{//file exists
				//TO DO: add here a line similar to in TicTimer with the ids (NTID) and the session type.
				//Append "session started at"+time, show Tic Detected, Stop Session butttons
				var sEntry = "session started|" + aux.time();
				fs.appendFile(sesFile, sEntry, function(err){
					if(err)
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "start_session-trainer: append to sesFile");
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
	//If aborting, delete the session file - don't bother with archive because it hasn't even started yet
	var sesFile = "./session/temp/session" + body.id + body.lid + ".ttsd";
	if(body.reqType == 'leave'){
		aux.debugShout("1270", 3);
		fs.unlink(sesFile, function(err){
			if(err)
				callback("fe");
				//ret.error(res, "fe", "/session/index.html", "start_session-trainer: leave");
		});
	}
	else{ //One of the START buttons pressed
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
					//ret.error(res, "fe","/session/index.html", "start_session-trainer: stat session file");
			}
			else{//file exists
				//Append "session started at"+time, show Tic Detected, Stop Session butttons
				var sEntry = "NewTics subject|?|"+body.stype+"\n";
				sEntry += "session started|" + aux.time();
				fs.appendFile(sesFile, sEntry, function(err){
					if(err)
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "start_session-trainer: append to sesFile");
					else{
						callback(null, "session");
						//ret.session_trainer(res, body);
					}
				});
			}
		});
	}
}

function startsession_u_req(body, callback){
	if(body.reqType == 'leave' || body.reqType == 'timeout'){
		//end session - it has not started yet, so just delete it
		var sesFile = "./session/temp/session" + body.lid + body.id + ".ttsd";
		fs.unlink(sesFile, function(err){
			if(err){
				callback("fe");
				//ret.error(res, "fe", "/session/index.html", "start_session-user: unlink");
			}
			else{
				callback(null, "ended");
				//ret.redirect(res, "/session/session-ended.html");
			}
		});
	}
	else if(body.reqType == 'started'){
		//has the session started
		var searchFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
		fs.readFile(searchFile, "utf8", function(err, sfdata){
			if(err){
				if(err.code == "ENOENT")//trainer left
					callback(null, "ended");
					//ret.redirect(res, "/session/session-ended.html");
				else
					callback("fe");
					//ret.error(res, "fe", "/session/index.html", "start_session-user: read sesFile");
				return;
			}
			if(sfdata.indexOf("session started|") == -1){
				callback(null, "wait");
				//return 'wait'
				//res.writeHead(200, {"Content-Type": "text/plain"});
				//res.write("wait", function(err){res.end();});
				return;
			}
			//load level and points and start session
			aux.loadAcc(body.id, function(err, uData){
				if(err){
					callback(err);
					//ret.error(res, err);//anfe or ide
					return;
				}
				if(body.pw != uData[1]){
					callback("pce");
					//ret.error(res, "pce");
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
				body.ntid = uData[8];
				var startLPEntry = "\nstarting user l,p,c|"+ lpc[0]+","+lpc[1]+","+lpc[2];
				fs.appendFile(searchFile, startLPEntry, function(err){
					if(err){
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "start_session-user: append to sesFile");
						return;
					}
					body.sesL = sfdata.length + startLPEntry.length;//current session file length (just two/three lines)
					callback(null, "session", body);
					//ret.session_user(res, body);
				});
			});
		});
	}
}

function session_t_req(body, callback){
	if(body.reqType == "tic"){
		var sesFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
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
		var sesFile = "./session/temp/session" + body.id + body.lid + ".ttsd";
		var eEntry = "\nsession ended|"+aux.time();
		fs.stat(sesFile, function(err, stats){
			if(err == null){//File exists
				aux.debugShout("586", 3);
				fs.appendFile(sesFile, eEntry, function(err){//should I also archive it? No, the user needs to save their new points and level
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
				//ret.redirect(res, "/session/session-ended.html");
			}
			else{//Some other error
				callback("fe");
				//ret.error(res, "fe", "/session/index.html", "session_end-trainer: stat sesFile");
			}
		});
	}
}

function session_u_req(body, callback){
	//Requests made from the ongoing user session
	switch(body.reqType){
		case "check":
			//Check the session file here for tic detected or session ended
			var oldL = body.sesL;
			var sesFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					callback("fe");
					//ret.error(res, "fe", "/session/index.html", "session-user: read sesFile");
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
			var sesFile = "./session/temp/session" + body.lid + body.id + ".ttsd";
			var sF2 = "./session/archive/session" + body.lid + body.id + aux.time("forfile") + ".ttsd";
			var newlpc = body.level +","+ body.points +","+ body.coins;
			//Defined here because it's used twice below
			function archiveSession(){
				fs.rename(sesFile, sF2, function(err){
					if(err){
						callback("fe");
						//ret.error(res, "fe", "/session/index.html", "session_end-user: rename sesFile");
					}
					else{
						/**append report*/
						fs.readFile(sF2, "utf8", function(err, data){
							if(err){
								callback("fe");
								//ret.error(res, "fe", "/session/index.html", "session_end-user: read sf2");
								return;
							}
							fs.appendFile(sF2, aux.genReport(data), function(err){
								if(err)
									callback("fe");
								else
									callback(null, "ended");
							});
						});
					}
				});
			}
			//save user lpc
			aux.editAcc(body.id, 5, function(uData){
				if(body.pw != uData[1]){
					aux.debugShout("body.pw= "+body.pw+"; pass= "+uData[1]);
					//This would be weird because the user entered his own password at the beginning.
					callback("pce");
					//ret.error(res, "pce");
					return "<cancel>";
				}
				return newlpc;
			}, function(err, uData){
				if(err){
					if(err !== "canceled"){
						callback(err);
						//ret.error(res, err, "/session/index.html", uData);
					}
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
								//ret.error(res, "fe", "/session/index.html", "session_end-user: append to sesFile");
								return;
							}
							archiveSession();
						});
					}
					else{
						archiveSession();
					}
				});
			});
		break;
		case "loglpc"://id, pass, l,p,c
			var sesFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
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
	switch(body.reqType){
		case "start":
			var sesFile = "./session/temp/sessiona" + body.id + ".ttsd";
			fs.readFile(sesFile, "utf8", function(err, data){
				if(err){
					callback("fe");
					return;
				}
				var sliced_d = data.slice(data.indexOf("session started|"));
				var stime = sliced_d.slice(sliced_d.indexOf("|")+1, sliced_d.indexOf("\n"));
				sdate = new Date(stime);
				var timesince = Date.now() - sdate;
				callback(null, "start", timesince.toString());
			});
		break;
		case "check":
			var sesFile = "./session/temp/sessiona" + body.id + ".ttsd";
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
		case "end":
			var sesFile = "./session/temp/sessiona" + body.id + ".ttsd";
			var sF2 = "./session/archive/sessiona" + body.id + aux.time("forfile") + ".ttsd";
			function archiveSession(){
				fs.rename(sesFile, sF2, function(err){
					if(err){
						callback("fe");
					}
					else{
						/**append report*/
						fs.readFile(sF2, "utf8", function(err, data){
							if(err){
								callback("fe");
								return;
							}
							fs.appendFile(sF2, aux.genReport(data), function(err){
								if(err)
									callback("fe");
								else
									callback(null, "ended");
							});
						});
					}
				});
			}
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
						archiveSession();
					});
				}
				else{
					archiveSession();
				}
			});
		break;
	}
}

function ghses_req(body, callback){
	body.tid = aux.isID(body.tid);
	body.uid = aux.isID(body.uid);
	if(body.tid === false || body.uid === false){
		callback("ide");
		//ret.error(res, "ide", pathname);
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
		var sesFile = "./session/temp/session"+ body.tid + body.uid + ".ttsd";
		fs.stat(sesFile, function(err){
			if(err){
				if(err.code == "ENOENT"){//already deleted
					callback();
					//ret.redirect(res, "/session/index.html");
				}
				else{
					callback("fe");
					//ret.error(res, "fe", pathname, "ghost session: looking at ghost session file");
				}
			}
			else{//legit ghost file
				//Archive the session file under a new name
				var sF2 = "./session/archive/session" + body.tid + body.uid + aux.time("forfile") + ".ttsd";
				fs.rename(sesFile, sF2, function(err){
					if(err){
						callback("fe");
						//ret.error(res, "fe", pathname, "ghost session: rename sesFile");
					}
					else{
						/**append report*/
						fs.readFile(sF2, "utf8", function(err, data){
							if(err){
								callback("fe");
								//ret.error(res, "fe", pathname, "ghost session: read sf2");
								return;
							}
							fs.appendFile(sF2, aux.genReport(data), function(err){
								if(err)
									callback("fe");
									//ret.error(res, "fe", pathname, "ghost session: append report");
								else{
									callback();
									//ret.redirect(res, "/session/index.html");
									aux.log_error("ghost session", "ghost session archived between "+body.tid+" and "+body.uid);
								}
							});
						});
					}
				});
			}
		});
	});
}

function MRU_req(body, callback){
	if(body.admin_id[0] != "a" || body.id[0] != "u"){
		callback("ide");
		//ret.error(res, "ide");
		return;
	}
	switch(body.source){
		case "load_user_data":
			/*1. check admin pass 
				2. check user pass
				3. return user data
			*/
			aux.loadAcc(body.admin_id, function(err, admin_acc){
				if(err){
					debugShout("854", 2);
					callback(err);
					//ret.error(res, err, "/admin/index.html");
					return;
				}
				if(body.admin_pw != admin_acc[1]){
					callback("pce");
					//ret.error(res, "pce", "/admin/index.html");
					return;
				}
				aux.loadAcc(body.id, function(err, acc){
					if(err){
						callback(null, "error="+err);
						//res.writeHead(200, {"Content-Type": "text/plain"});
						//res.write("error="+err, function(err){res.end();});
						return;
					}
					var ntid = acc[8];
					var research_settings = acc[7].split(","); //(RS,AITI,SMPR,PTIR,FLASH)
					var res_str = "research_state="+research_settings[0]+
						"&aiti="+research_settings[1]+"&smpr="+research_settings[2]+
						"&ptir="+research_settings[3]+"&flash="+research_settings[4]+
						"&ntid="+ntid;
					callback(null, res_str);
					//res.writeHead(200, {"Content-Type": "text/plain"});
					//res.write(res_str, function(err){res.end();});
				});
			});
		break;
		case "edit_acc":
			aux.loadAcc(body.admin_id, function(err, admin_acc){
				if(err){
					callback(err);
					//ret.error(res, err, "/admin/index.html");
					return;
				}
				if(body.admin_pw != admin_acc[1]){
					callback("pce");
					//ret.error(res, "pce", "/admin/index.html");
					return;
				}
				aux.loadAcc(body.id, function(err, user_acc){
					if(err){
						callback(err);
						//ret.error(res, err, "/admin/index.html");
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
		break;
	}
}

function MAA_req(body, callback){
	switch(body.source){
		case "load_user_data":
			if(body.admin_id[0] != "a" || body.id[0] != "a"){
				callback("ide");
				//ret.error(res, "ide");
				return;
			}
			/*1. check admin pass 
				2. check aa pass
				3. return aa pass
			*/
			aux.loadAcc(body.admin_id, function(err, admin_acc){
				if(err){
					debugShout("901", 2);
					callback(err);
					//ret.error(res, err, "/admin/index.html");
					return;
				}
				if(body.admin_pw != admin_acc[1]){
					callback("pce");
					//ret.error(res, "pce", "/admin/index.html");
					return;
				}
				aux.loadAcc(body.id, function(err, acc){
					if(err){
						callback(null, "error="+err);
						//res.writeHead(200, {"Content-Type": "text/plain"});
						//res.write("error="+err, function(err){res.end();});
						return;
					}
					if(body.pw != acc[1]){
						callback(null, "error=pce");
						//res.writeHead(200, {"Content-Type": "text/plain"});
						//res.write("error=pce", function(err){res.end();});
						return;
					}
					callback(null, "aa_pass="+acc[1]);
					//res.writeHead(200, {"Content-Type": "text/plain"});
					//res.write("aa_pass="+acc[1], function(err){res.end();});
				});
			});
		break;
		case "change_pw":
			if(body.admin_id[0] != "a" || body.id[0] != "a"){
				callback("ide");
				//ret.error(res, "ide");
				return;
			}
			//Make sure pw doesn't include < or >
			if(/[<>]/.test(body.pw)){
				callback("ice");
				//ret.error(res, "ice", "/admin/index.html");//Invalid Character Error
				break;
			}
			aux.loadAcc(body.admin_id, function(err, admin_acc){
				if(err){
					callback(err);
					//ret.error(res, err, "/admin/index.html");
					return;
				}
				if(body.admin_pw != admin_acc[1]){
					callback("pce");
					//ret.error(res, "pce", "/admin/index.html");
					return;
				}
				aux.editAcc(body.id, 1, function(uData){
					if(body.pw != uData[1]){
						callback(null, "error=pce");
						//res.writeHead(200, {"Content-Type": "text/plain"});
						//res.write("error=pce", function(err){res.end();});
						return "<cancel>";
					}
					return body.new_pw;
				}, function(err, uData){
					if(err){
						if(err !== "canceled"){
							if(uData)
								aux.debugShout("946 "+uData);
							callback(err);
							//ret.error(res, err, "/admin/index.html");
						}
						return;//already sent res
					}
					callback(null, "good");
					//res.writeHead(200, {"Content-Type": "text/plain"});
					//res.write("good", function(err){res.end();});
				});
			});
		break;
		case "register":
			if(body.admin_id[0] != "a"){
				callback("ide");
				//ret.error(res, "ide");
				return;
			}
			//Make sure pw doesn't include < or >
			if(/[<>]/.test(body.pw)){
				callback("ice");
				//ret.error(res, "ice", "/admin/index.html");//Invalid Character Error
				break;
			}
			if(body.pw != body.pwc){
				callback("pce");
				//ret.error(res, "pce", "/admin/index.html");
				break;
			}
			//Authenticate admin
			aux.loadAcc(body.admin_id, function(err, admin_acc){
				if(err){
					callback(err);
					//ret.error(res, err, "/admin/index.html");
					return;
				}
				aux.debugShout("981");
				if(body.admin_pw != admin_acc[1]){
					callback("pce");
					//ret.error(res, "pce", "/admin/index.html");
					return;
				}
				//Get the next available iD number
				aux.getNextID("a", function(err, ID){
					if(err){
						callback(err);
						//ret.error(res, err);
						return;
					}
					var newAFile = "./account/admin_data/"+ID+".ttad";
					var aData = aux.newA(ID, body.pw);
					fs.writeFile(newAFile, aData, function(err){
						if(err)
							callback("fe");
							//ret.error(res, "fe", "/admin/index.html", "register-admin: write newAFile");
						else
							callback(null, null, aData);
							//ret.created(res, aData);
					});
				});
			});
		break;
	}
}

function VL_req(body, callback){
	if(body.admin_id[0] != "a"){
		callback("ide");
		//ret.error(res, "ide");
		return;
	}
	switch(body.source){
		case "reqlist":
			/*Authenticate
				Return list
			*/
			aux.loadAcc(body.admin_id, function(err, admin_acc){
				if(err){
					aux.debugShout("896", 2);
					callback(err);
					//ret.error(res, err, "/admin/index.html");
					return;
				}
				if(body.admin_pw != admin_acc[1]){
					callback("pce");
					//ret.error(res, "pce", "/admin/index.html");
					return;
				}
				fs.readdir("./session/archive", function(err,items){
					if(err){
						callback("fe");
						//ret.error(res, "fe", "/admin/index.html", "admin/viewLogs - reqlist");
						return;
					}
					var loglist = [];
					for(var i=0; i<items.length; i++){
						var item = items[i];
						if(item[0] != "." && item.indexOf(body.uid) != -1)//Only return those log files involving uid
							loglist.push(item);
					}
					callback(null, 200, JSON.stringify(loglist));
					//res.writeHead(200, {"Content-Type": "text/plain"});
					//res.write(JSON.stringify(loglist), function(err){res.end();});
				});
			});
		break;
		case "reqlog":
			/*Authenticate
				Load Log file
				Parse it to HTML and respond
			*/
			aux.loadAcc(body.admin_id, function(err, admin_acc){
				if(err){
					aux.debugShout("927", 2);
					callback(err);
					//ret.error(res, err, "/admin/index.html");
					return;
				}
				if(body.admin_pw != admin_acc[1]){
					callback("pce");
					//ret.error(res, "pce", "/admin/index.html");
					return;
				}
				var ext = body.file.slice(body.file.lastIndexOf("."));
				if([".ttd", ".ttsd", ".txt"].indexOf(ext) < 0){
					//Requested the wrong type of file somehow
					aux.debugShout("1618", 2);
					callback(null, 403);
					//res.writeHead(403, {"Content-Type": "text/html; charset=UTF-8"});
					//res.end();
				}
				fs.readFile(body.file, "utf8", function(err, data){
					if(err){
						ret.error("fe", "/admin/index.html", "admin/viewLogs - reqlog");
						return;
					}
					callback(null, 200, data);
					/*res.writeHead(200, {"Content-Type": "text/plain"});
					if(data.length > 0)
						res.write(data, function(err){res.end();});
					else
						res.end();*/
				});
			});
		break;
	}
}


if(testing){
	var server = http.createServer(handleRequest);
	server.listen(TESTING_PORT);
}
else{
	//Set up redirect server to run on port 80
	var server_80 = http.createServer(function(req, res){
		res.writeHead(301, {"Location": "https://tictrainer.com:" + HTTPS_PORT});
		res.end();
	}).listen(80);

	//Set up main https server
	const options = {
		key: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/privkey.pem"),
		cert: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/fullchain.pem")
	};
	//Create server using handleRequest
	var server = https.createServer(options, handleRequest);
	//Start server
	server.listen(HTTPS_PORT, function(){
		console.log("Started at "+aux.time());
		console.log("Server listening on: https://localhost:" + HTTPS_PORT);
	});

}
