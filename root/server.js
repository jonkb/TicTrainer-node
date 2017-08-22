var https = require("https");
var fs = require("fs");
var url = require("url");
//Auxiliary functions stored in aux to make this file shorter
var aux = require("./scripts/auxiliary.js");
//Functions that return dynamic webpages. Always pass with res.
var ret = require("./scripts/ret_dynamic.js");
var inventory = require("./scripts/store.js").inv;
const PORT = 443;

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
						ret.error(res, "ife", "/register/trainer.html");
						break;
					}
					if(isNaN(bD) || bD.length != 4){
						ret.error(res, "dfe", "/register/trainer.html")
						break;
					}
					if(pass != passC){
						ret.error(res, "pce", "/register/trainer.html");
						break;
					}
					//Make sure these don't include ; or < or > - VITAL
					//Could allow semicolon now
					if(pass.indexOf(";") != -1 || pass.indexOf("<") != -1 || pass.indexOf(">") != -1){
						ret.error(res, "ice", "/register/trainer.html");//Invalid Character Error
						break;
					}
					if(bD.indexOf(";") != -1 || bD.indexOf("<") != -1 || bD.indexOf(">") != -1){
						ret.error(res, "ice", "/register/trainer.html");
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
								ret.error(res, "fe", "/register/user.html", "register-user: write newUFile");
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
						ret.error(res, "ife", "/register/user.html");
						break;
					}
					if(isNaN(bD)){//catches undefined 
						ret.error(res, "dfe", "/register/user.html");
						//I could check and do it anyway if they submitted month and year, but why be that courteous
						break;
					}
					if(pass != passC){
						ret.error(res, "pce", "/register/user.html");
						break;
					}
					//Make sure these don't include ; or < or > - VITAL
					//Could allow semicolon now
					if(pass.indexOf(";") != -1 || pass.indexOf("<") != -1 || pass.indexOf(">") != -1){
						ret.error(res, "ice", "/register/trainer.html");//Invalid Character Error
						break;
					}
					if(bD.indexOf(";") != -1 || bD.indexOf("<") != -1 || bD.indexOf(">") != -1){
						ret.error(res, "ice", "/register/trainer.html");
						break;
					}
					
					aux.getNextID("u", function(err, ID){
						if(err){
							ret.error(res, "fe", "/register/user.html", "register-user: getNextID");
							return;
						}
						var newUFile = "./account/user_data/"+ID+".ttad";
						var uData = aux.newU(ID,pass,bD,sex);
						fs.writeFile(newUFile, uData, function(err){
							if(err)
								ret.error(res, "fe", "/register/user.html", "register-user: write newUFile");
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
							case "pce":
							case "anfe":
								ret.error(res, data, "/account/index.html");
							break;
							
							default:
								ret.manage_account(res, data);
							break;
						}
					}
					switch(body.source){
						case "manageAccount"://Log on page
						aux.debugShout("141", 2);
						aux.loadAcc(body.id, function(err,user){
							aux.debugShout("143", 2);
							if(err){
								acc_ret(err);
								return;
							}
							if(user[1] == body.pw)
								acc_ret(user);
							else
								acc_ret("pce");
								aux.debugShout("152", 2);
						});
						break;
						case "editP"://Source: editP, id, oldPass, pass
							var iD = body.id;
							var opw = body.oldPass;
							var pw = body.pass;
							aux.debugShout("Editing "+iD, 1);
							aux.editAcc(iD, 1, function(dEntry){//return new PW
								if(dEntry[1] !== opw){
									aux.debugShout("160|" + dEntry[1] + "|" + opw + "|" + pw);
									acc_ret("pce");
									return "<cancel>";
								}
								return pw;
							}, function(err, dEntry){//callback
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
							if(iD[0] == "t"){
								lFile += "user_data/"+lID+".ttad";
							}
							else if(iD[0] == "u"){
								lFile += "trainer_data/"+lID+".ttad";
							}
							
							aux.debugShout("Linking " + lID + " to " + iD, 1);
							//Check that the other account exists
							fs.stat(lFile, function(err, stat){
								if(err == null) {
									//Link to the account
									//addL
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
				case "/session/index.html":
					switch(body.source){
						case "newSession"://source, id, pw, lid
							/**handle form submission for new session
							verify password, 
							check that accounts are linked,
							(if user) add id to lnusers.ttd,
								[loading page]set timer to look for session file every 2s for 1m -->
								[link successful page]set timer to look for "session started" every 2s for 1m -->
									[counter page]start local reward timer

							(if trainer) [loading page]set timer to look for other account (in lnusers) every 2s for 1m --> 
								[start page]create session data file, show Start button --> 
									[session control page]Append "session started at"+, show Tic Detected & Stop Session butttons
							 */
							 
							var pass = body.pw;
							var file = "./account/";
							
							body.id = aux.isID(body.id);
							body.lid = aux.isID(body.lid);
							if(body.id === false || body.lid === false){
								ret.error(res, "ide", "/session/index.html");
								break;
							}
							/*Check that the accounts are linked and confirm pw.
								Note that this code is reused for users and trainers.
							*/
							aux.loadAcc(body.id, function(err, aData){
								if(err){
									ret.error(res, err);
									return;
								}
								if(aData[1] != pass){
									//Password Confirmation Error
									ret.error(res, "pce", "/session/index.html");
									return;
								}
								var found = false;
								var lnAcc = aData[3].split(",");
								for(i=0; i<lnAcc.length; i++){
									if(lnAcc[i] == body.lid){
										found = true;
										break;
									}
								}
								if(!found){
									//Account not linked error
									ret.error(res, "anle", "/session/index.html");
								}
								else{
									/*Continue with the next step.
										See if a session file already exists between those users.
										If so, it's called a concurrent or ghost session.
									*/
									if(body.id[0] == "t"){
										//This section should hopefully never need to be used, but it handles ghost sessions. Logs a ghost session error.
										var oldSFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
										fs.stat(oldSFile, function(err){
											if(err){
												if(err.code == "ENOENT"){//Does not exist. Good.
													//Go to trainer loading page. (Again, a new function is used to decrease indentation insanity. It is reused though, so it makes sense.)
													success();
												}
												else
													ret.error(res, "fe", "/session/index.html", "new-session: checking if oldSFile exists"); //Some other bizarre error
											}
											else{//Bad, it's an old ghost session. Or it's concurrent.
												ret.error(res, "conses", "/session/index.html");
											}
										});
									}
									else{
										var oldSFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
										fs.stat(oldSFile, function(err){
											if(err){
												if(err.code == "ENOENT"){//Good.
													/*Data entry for the new waiting link
														Format: <uN,tM> [no \n]
													*/
													var linkData = "<" +body.id+ ";" +body.lid+ ">";
													fs.readFile("./session/lnusers.ttd", "utf8", function(err,data){
														if(err){
															ret.error(res, "fe", "/session/index.html", "new-session: reading lnusers.ttd");
															return;
														}
														if(data.indexOf(linkData) == -1)
															fs.appendFile("./session/lnusers.ttd", linkData, function(err){
																if(err){
																	ret.error(res, "fe", "/session/index.html", "new-session: appending to lnusers.ttd");
																}
																else{
																	//Go to user loading page
																	success();
																}
															});
														else//no need to add a new entry - should this throw an error?
															success();
													});
												}
												else//why? weird error.
													ret.error(res, "fe", "/session/index.html", "new-session: checking if oldSFile exists");
											}
											else{//Bad, it's an old ghost session. Or it's concurrent.
												ret.error(res, "conses", "/session/index.html", "new-session: concurrent/ghost session");
											}
										});
									}
								}
							});
							//return the linkloading page
							function success(){
								body.tryN = 0;
								//Go to Link Loading Page
								if(body.id[0]=="t")
									ret.link_loading_trainer(res, body);
								else{ //b.i[0] is definitely "u" because the error would have already been caught otherwise
									ret.link_loading_user(res, body);
								}
							}
						break;
						case "linkloading-trainer"://source, id, pw, lid, tryN  tryN is the try number
							if(body.timeout){
								ret.error(res, "toe", "/session/index.html");
								break;
							}
							//All the errors for id format have been caught already
							fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
								if(err){
									ret.error(res, "fe", "/session/index.html", "linkloading-trainer: reading lnusers.ttd");
								}
								else{
									//look for other account
									var searchEntry = "<" +body.lid+ ";" +body.id + ">";
									var iSE = data.indexOf(searchEntry);
									if(iSE == -1){
										//Wait two seconds and try again
										res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
										res.write("wait", function(err){res.end();});
									}
									else{
										var iSEEnd = iSE + searchEntry.length;
										var newData = data.substring(0, iSE) + data.substring(iSEEnd, data.length);
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
												ret.error(res, "fe", "/session/index.html", "linkloading-trainer: making session file");
											else
												ret.start_session_trainer(res, body);//source, id, pw, lid, tryN 
										});
									}
								}
							});
						break;
						case "linkloading-user"://source, id, pw, lid, tryN 
							/*(if user) [loading page]set timer to look for session file every 2s for 1m -->
							*/
							if(body.reqType == 'leave' || body.reqType == 'timeout'){
								//remove entry in lnusers
								fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
									if(err){//lnusers got destroyed?
										ret.error(res, "fe", "/", "linkloading-user: leave/timeout - read lnusers");
									}
									else{
										var searchEntry = "<" +body.id+ ";" +body.lid+ ">";
										aux.debugShout("attempting to delete entry: "+searchEntry);
										var iSE = data.indexOf(searchEntry);
										if(iSE != -1){
											var iSEEnd = iSE + searchEntry.length;
											var newData = data.slice(0, iSE) + data.slice(iSEEnd);
											fs.writeFileSync("./session/lnusers.ttd", newData, "utf8");//Cut out entry
											if(body.reqType == 'timeout')
												ret.error(res, "toe", "/session/index.html");
										}
										else{
											ret.error(res, "fe", "/session/index.html", "linkloading-user: where did the lnusers entry go?");
										}
									}
								});
							}
							else if(body.reqType == 'exists'){
								var searchFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
								fs.stat(searchFile, function(err, stats){
									if(err == null){//File exists
										body.tryN = 0;
										ret.start_session_user(res, body);
									}
									else if(err.code == "ENOENT"){//File does not exist
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("wait", function(err){res.end();});
									}
									else//Some other error
										ret.error(res, "fe", "/session/index.html", "linkloading-user: stat session file");
								});
							}
						break;
						case "start_session-trainer"://source, id, pw, lid
							//If aborting, delete the session file - don't bother with archive because it hasn't even started yet
							if(body.reqType == 'leave'){
								var sesFile = "./session/temp/session" + body.id + body.lid + ".ttsd";
								aux.debugShout("791", 3);
								fs.unlink(sesFile, function(err){
									if(err)
										ret.error(res, "fe", "/session/index.html", "start_session-trainer: leave");
								});
							}
							else{ //START pressed
								var sesFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
								//If file does not exist, the user must have left early
								fs.stat(sesFile, function(err){
									if(err){
										if(err.code == "ENOENT"){//user left (or magic ghosts deleted the file){
											ret.redirect(res, "/session/session-ended.html");
											aux.debugShout("836", 3);
										}
										else
											ret.error(res, "fe","/session/index.html", "start_session-trainer: stat session file");
									}
									else{//file exists
										//Append "session started at"+time, show Tic Detected, Stop Session butttons
										var sEntry = "session started|" + aux.time();
										fs.appendFile(sesFile, sEntry, function(err){
											if(err)
												ret.error(res, "fe", "/session/index.html", "start_session-trainer: append to sesFile");
											else{
												ret.session_trainer(res, body);
											}
										});
										
									}
								});
							}
						break;
						//See if the session has started
						case "start_session-user"://source, id, pw, lid, tryN 
							if(body.reqType == 'leave' || body.reqType == 'timeout'){
								//end session - it has not started yet, so just delete it
								var sesFile = "./session/temp/session" + body.lid + body.id + ".ttsd";
								fs.unlink(sesFile, function(err){
									if(err){
										ret.error(res, "fe", "/session/index.html", "start_session-user: unlink");
									}
									else{
										ret.redirect(res, "/session/session-ended.html");
									}
								});
							}
							else if(body.reqType == 'started'){
								//has the session started
								var searchFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
								fs.readFile(searchFile, "utf8", function(err, sfdata){
									if(err){
										if(err.code == "ENOENT")//trainer left
											ret.redirect(res, "/session/session-ended.html");
										else
											ret.error(res, "fe", "/session/index.html", "start_session-user: read sesFile");
										return;
									}
									if(sfdata.indexOf("session started|") == -1){
										//return 'wait'
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("wait", function(err){res.end();});
										return;
									}
									//load level and points and start session
									aux.loadAcc(body.id, function(err, uData){
										if(err){
											ret.error(res, err);//anfe or ide
											return;
										}
										if(body.pw != uData[1]){
											ret.error(res, "pce");
											return;
										}
										var lpc = uData[5].split(",");
										body.level = lpc[0];
										body.points = lpc[1];
										body.coins = lpc[2];
										body.heap = uData[6];
										var startLPEntry = "\nstarting user l,p,c|"+ lpc[0]+","+lpc[1]+","+lpc[2];
										fs.appendFile(searchFile, startLPEntry, function(err){
											if(err){
												ret.error(res, "fe", "/session/index.html", "start_session-user: append to sesFile");
												return;
											}
											body.sesL = sfdata.length + startLPEntry.length;//current session file length (just three lines)
											ret.session_user(res, body);
										});
									});
								});
							}
						break;
						case "session-trainer"://Tic. body= source:session-trainer, id:t0000, pw: , lid:u0000
							var sesFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
							var tEntry = "\ntic detected|" +aux.time();
							fs.stat(sesFile, function(err, stats){
								if(err == null){//File exists
									fs.appendFile(sesFile, tEntry, function(err){
										if(err)//Why would this happen? 
											ret.error(res, "fe", "/session/index.html", "session-trainer: append to sesFile");
										else{
											res.writeHead(200, {"Content-Type": "text/plain"});
											res.write("good", function(err){res.end();});
										}
									});
								}
								//File does not exist. 
								//This happens when the user has ended the session already
								else if(err.code == "ENOENT"){
									ret.redirect(res, "/session/session-ended.html");
								}
								else//Some other error
									ret.error(res, "fe", "/session/index.html", "session-trainer: stat sesFile");
							});
						break;
						case "session-user"://body: source, id, pw, lid
							//Requests made from the ongoing user session
							/*Check the session file here for tic detected or session ended*/
							var oldL = body.sesL;
							var sesFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
							fs.readFile(sesFile, "utf8", function(err, data){
								if(err){
									ret.error(res, "fe", "/session/index.html", "session-user: read sesFile");
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
								res.writeHead(200, {"Content-Type": "text/plain"});
								res.write(retMessage, function(err){res.end();});
							});
						break;//session-user
						case "loglpc"://id, pass, l,p,c
							var sesFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
							var lpcEntry = "\nuser l,p,c|" +body.level+ "," +body.points+ "," +body.coins+ "|" +aux.time();
							fs.appendFile(sesFile, lpcEntry, function(err){
								if(err){
									ret.error(res, "fe", "/session/index.html", "session-user: append to sesFile");
									return;
								}
								res.writeHead(200);
								res.end();
							});
						break;//loglpc
						case "savelpc"://id, pass, l,p,c
							var newlpc = body.level +","+ body.points +","+ body.coins;
							aux.editAcc(body.id, 5, function(userData){
								if(body.pw != userData[1]){
									ret.error(res, "pce");
									return "<cancel>";
								}
								return newlpc;
							}, function(err, userData){
								if(err){
									if(err !== "canceled"){
										ret.error(res, err, "/session/index.html", userData);
									}
									return;//res.end happened already (ret.error(res, "pce"))
								}
								res.writeHead(200);
								res.end();
							});
						break;// savelpc
						case "session_end-trainer":
							aux.debugShout("SE-T");
							var sesFile = "./session/temp/session" + body.id + body.lid + ".ttsd";
							var eEntry = "\nsession ended|"+aux.time();
							fs.stat(sesFile, function(err, stats){
								if(err == null){//File exists
									aux.debugShout("1002", 3);
									fs.appendFile(sesFile, eEntry, function(err){//should I also archive it? No, the user needs to save their new points and level
										if(err)
											ret.error(res, "fe", "/session/index.html", "session_end-trainer: append to sesFile");
										else{
											ret.redirect(res, "/session/session-ended.html");
										}
									});
								}
								//File does not exist. 
								//This happens if the user has ended the session already
								else if(err.code == "ENOENT"){
									ret.redirect(res, "/session/session-ended.html");
								}
								else//Some other error
									ret.error(res, "fe", "/session/index.html", "session_end-trainer: stat sesFile");
							});
						break;
						case "session_end-user":
							aux.debugShout("SE-U");
							var sesFile = "./session/temp/session" + body.lid + body.id + ".ttsd";
							var sF2 = "./session/archive/session" + body.lid + body.id + aux.time("forfile") + ".ttsd";
							var newlpc = body.level +","+ body.points +","+ body.coins;
							//Defined here because it's used twice below
							function archiveSession(){
								fs.rename(sesFile, sF2, function(err){
									if(err){
										ret.error(res, "fe", "/session/index.html", "session_end-user: rename sesFile");
									}
									else{
										/**append report*/
										fs.readFile(sF2, "utf8", function(err, data){
											if(err){
												ret.error(res, "fe", "/session/index.html", "session_end-user: read sf2");
												return;
											}
											fs.appendFile(sF2, aux.genReport(data), function(err){
												if(err)
													ret.error(res, "fe", "/session/index.html", "session_end-user: append report");
												else
													ret.redirect(res, "/session/session-ended.html");
											});
										});
									}
								});
							}
							//save user l & p
							aux.editAcc(body.id, 5, function(uData){
								if(body.pw != uData[1]){
									aux.debugShout("body.pw= "+body.pw+"; pass= "+uData[1]);
									ret.error(res, "pce");
									return "<cancel>";
								}
								return newlpc;
							}, function(err, uData){
								if(err){
									if(err !== "canceled"){
										ret.error(res, err, "/session/index.html", uData);
									}
									return;
								}
								//End and archive session
								fs.readFile(sesFile, "utf8", function(err, sData){
									if(err){
										ret.error(res, "fe", "/session/index.html", "session_end-user: read sesFile");
										return;
									}
									if(sData.indexOf("session ended") == -1){
										//The session still needs to be ended
										var eEntry = "\nsession ended|"+aux.time();
										fs.appendFile(sesFile, eEntry, function(err){
											if(err){
												ret.error(res, "fe", "/session/index.html", "session_end-user: append to sesFile");
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
					}
				break; // "/session/index.html"
				case "/error/report.html":
					var content = body.fName+";"+body.email+";"+body.message;
					aux.log_error("report", content);
					ret.report_sent(res, body);
				break;
				case "/error/ghses.html":
					body.tid = aux.isID(body.tid);
					body.uid = aux.isID(body.uid);
					if(body.tid === false || body.uid === false){
						ret.error(res, "ide", "/error/ghses.html");
						break;
					}
					
					//verify password
					aux.loadAcc(body.tid, function(err, tData){
						if(err){
							ret.error(res, err);
							return;
						}
						if(tData[1] != body.pw){
							ret.error(res, "pce");
							return;
						}
						var sesFile = "./session/temp/session"+ body.tid + body.uid + ".ttsd";
						fs.stat(sesFile, function(err){
							if(err){
								if(err.code == "ENOENT"){//already deleted
									ret.redirect(res, "/session/index.html");
								}
								else{
									ret.error(res, "fe", "/error/ghses.html", "ghost session: looking at ghost session file");
								}
							}
							else{//legit ghost file
								//Archive the session file under a new name
								var sF2 = "./session/archive/session" + body.tid + body.uid + aux.time("forfile") + ".ttsd";
								fs.rename(sesFile, sF2, function(err){
									if(err){
										ret.error(res, "fe", "/error/ghses.html", "ghost session: rename sesFile");
									}
									else{
										/**append report*/
										fs.readFile(sF2, "utf8", function(err, data){
											if(err){
												ret.error(res, "fe", "/error/ghses.html", "ghost session: read sf2");
												return;
											}
											fs.appendFile(sF2, aux.genReport(data), function(err){
												if(err)
													ret.error(res, "fe", "/error/ghses.html", "ghost session: append report");
												else{
													ret.redirect(res, "/session/index.html");
													aux.log_error("ghost session", "ghost session archived between "+body.tid+" and "+body.uid);
												}
											});
										});
									}
								});
							}
						});
					});
				break;
				case "/admin/index.html":
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
					switch(body.source){
						case "load_user_data":
							/*1. check admin pass 
								2. check user pass
								3. return research_state
							*/
							aux.loadAcc(body.admin_id, function(err, admin_acc){
								if(err){
									debugShout("830", 2);
									ret.error(res, err, "/admin/index.html");
									return;
								}
								if(body.admin_pw != admin_acc[1]){
									ret.error(res, "pce", "/admin/index.html");
									return;
								}
								aux.loadAcc(body.id, function(err, acc){
									if(err){
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("error="+err, function(err){res.end();});
										return;
									}
									if(body.pw != acc[1]){
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("error=pce", function(err){res.end();});
										return;
									}
									res.writeHead(200, {"Content-Type": "text/plain"});
									res.write("research_state="+acc[7], function(err){res.end();});
									
								});
							});
						break;
						case "save_RS":
							aux.loadAcc(body.admin_id, function(err, admin_acc){
								if(err){
									ret.error(res, err, "/admin/index.html");
									return;
								}
								if(body.admin_pw != admin_acc[1]){
									ret.error(res, "pce", "/admin/index.html");
									return;
								}
								aux.editAcc(body.id, 7, function(uData){
									if(body.pw != uData[1]){
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("error=pce", function(err){res.end();});
										return "<cancel>";
									}
									return body.RS;
								}, function(err, uData){
									if(err){
										if(err !== "canceled"){
											if(uData)
												aux.debugShout("876 "+uData);
											ret.error(res, err, "/admin/index.html");
										}
										return;//already sent res
									}
									res.writeHead(200, {"Content-Type": "text/plain"});
									res.write("good", function(err){res.end();});
								});
							});
						break;
					}
				break;
				case "/admin/viewLogs.dynh":
					switch(body.source){
						case "reqlist":
							/*Authenticate
								Return list
							*/
							aux.loadAcc(body.admin_id, function(err, admin_acc){
								if(err){
									aux.debugShout("896", 2);
									ret.error(res, err, "/admin/index.html");
									return;
								}
								if(body.admin_pw != admin_acc[1]){
									ret.error(res, "pce", "/admin/index.html");
									return;
								}
								fs.readdir("./session/archive", function(err,items){
									if(err){
										ret.error(res, "fe", "/admin/index.html", "admin/viewLogs - reqlist");
										return;
									}
									var loglist = [];
									for(var i=0; i<items.length; i++){
										var item = items[i];
										if(item[0] != ".")
											loglist.push(item);
									}
									res.writeHead(200, {"Content-Type": "text/plain"});
									res.write(JSON.stringify(loglist), function(err){res.end();});
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
									ret.error(res, err, "/admin/index.html");
									return;
								}
								if(body.admin_pw != admin_acc[1]){
									ret.error(res, "pce", "/admin/index.html");
									return;
								}
								var ext = body.file.substring(body.file.lastIndexOf("."));
								if([".ttd", ".ttsd", ".txt"].indexOf(ext) < 0){
									//Requested the wrong type of file somehow
									aux.debugShout("938", 2);
									res.writeHead(403, {"Content-Type": "text/html; charset=UTF-8"});
									res.end();
								}
								fs.readFile(body.file, "utf8", function(err, data){
									if(err){
										ret.error("fe", "/admin/index.html", "admin/viewLogs - reqlog");
										return;
									}
									res.writeHead(200, {"Content-Type": "text/plain"});
									if(data.length > 0)
										res.write(data, function(err){res.end();});
									else
										res.end();
								});
							});
						break;
					}
				break;
				case "/account/store/index.html":
					switch(body.source){
						case "enterStore":
							//verify form
							body.id = aux.isID(body.id);
							if(body.id === false || body.id[0] !== "u"){
								ret.error(res, "ide", "/session/index.html");
								break;
							}
							aux.loadAcc(body.id, function(err,user){
								if(err){
									ret.error(res, err);//anfe
									return;
								}
								if(body.pw != user[1]){
									ret.error(res, "pce", "/account/store/index.html");
									return;
								}
								body.coins = user[5].split(",")[2];
								body.heap = user[6];
								aux.debugShout("1162 "+JSON.stringify(body), 3);
								ret.store(res, body);
							});
						break;
						case "buy":
							body.id = aux.isID(body.id);
							if(body.id === false || body.id[0] !== "u"){
								ret.error(res, "ide");
								break;
							}
							if(isNaN(inventory[body.item])){//is not in inventory(may give a false positive)
								ret.error(res, "ife");//I'm ok with this because it would only be triggered by hackers, who I feel no need to be courteous to
								break;
							}
							//Subtract the needed coins
							aux.editAcc(body.id, 5, function(uData){
								//Again, these really should have been caught client-side
								if(uData[1] !== body.pw){
									ret.error(res, "pce");
									return "<cancel>";
								}
								var lpc = uData[5].split(",");
								if(lpc[2] < inventory[body.item]){
									ret.error(res, "ife");
									return "<cancel>";
								}
								var newlpc = lpc[0]+ "," +lpc[1]+ "," +(lpc[2]-inventory[body.item]);
								return newlpc;
							}, function(err, uData){
								if(err){
									if(err !== "canceled"){
										if(uData)
											aux.debugShout("1217 "+uData);
										ret.error(res, err);
									}
									return;//already returned - ret.error
								}
								//add the item to their loot pile
								newHeap = body.item + uData[6];
								aux.editAcc(body.id, 6, newHeap, function(err, uData){
									if(err){
										if(uData)
											aux.debugShout("1204 "+uData);
										ret.error(res, err);
										return;//already returned - ret.error
									}
									//Fix the body object to send back to the store page
									var lpc = uData[5].split(",");
									body.coins = lpc[2];
									body.heap = uData[6];
									aux.debugShout("1212 "+JSON.stringify(body), 3);
									ret.store(res, body);
								});
							});
						break;
					}
				break;//store
			}
		});
	}//POST
	else{
		ret.requested_file(res, pathname);
	}
}

/* NOTE!!!
	THE FOLLOWING HAS BEEN MODIFIED TO REVERT TO HTTP ON PORT 8888 FOR TESTING.
	CHANGE IT BACK BEFORE MERGING BACK TO MASTER
*/

//Set up redirect server to run on port 80
var http = require("http");

/*
var server_80 = http.createServer(function(req, res){
	ret.redirect(res, "https://tictrainer.com:443");
})//.listen(80);


const options = {
	key: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/privkey.pem"),
	cert: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/fullchain.pem")
};

//Create server using handleRequest
var server = https.createServer(options, handleRequest);

//Start server
server.listen(PORT, function(){
	//Callback triggered when server is successfully listening.
	console.log("Started at "+aux.time());
	console.log("Server listening on: https://localhost:" + PORT);
});
*/

//Create server using handleRequest
var server = http.createServer(handleRequest);

//Start server
server.listen(8888, function(){
	//Callback triggered when server is successfully listening.
	console.log("Started at "+aux.time());
	console.log("Server listening on: http://localhost:" + 8888);
});
