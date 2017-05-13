var http = require("http");
var fs = require('fs');
var url = require('url');
var aux = require("./scripts/auxiliary.js");
var inventory = require("./scripts/store.js").inv;
const PORT = 8888;

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
	/**Functions which return dynamic web pages
	*/
	/* Returns an error message
	Error Types: 
		fe - File,
		se - Server, 
		dfe - Date Format,
		ide - ID, 
		ice - Invalid Character, 
		ife - Incomplete Form,
		conses - Concurrent Session,
		pce - Password Confirmation, 
		anfe - Account not found, 
		anle - Account not linked,
		toe - Timeout
	retry is the url the Try Again button links to
		generally the page the error came from.
		Defaults to /index.html
	a message can be passed and logged in ./error/log.ttd
	*/
	function ret_error(error_type, retry, message){
		retry = retry || "/index.html";
		var dynd = {"retry": retry};
		switch(error_type){
			case "fe":
			case "se":
				res.writeHead(500, {"Content-Type": "text/html"});
			break;
			default:
				res.writeHead(400, {"Content-Type": "text/html"});
			break;
		}
		aux.dynamic("./error/"+error_type+".dynh", dynd, finish_up);
		function finish_up(page){
			res.write(page, function(err){res.end();});
			if(message)
				aux.log_error(error_type, message);
		}
	}
	/* Returns a message that the account has been successfully created (/register/)
	*/
	function ret_created(data){
		//[id,pass,bd,links,sex,l/p/c,inventory]
		var dataEntries = aux.dataToEntries(data);
		var ID = dataEntries[0];
		var birthText = "";
		if(ID[0] == "u"){
			var birthD = new Date(parseInt(dataEntries[2]));
			birthText += "<br><br>"+
				"FYI, the fake birthdate we will use for you is "+birthD.toLocaleDateString()+". \n"+
				"There's a small chance (less than 3%) that this is your real birthday, but if so, \n"+
				"that's just a lucky guess. All we know on our end is that it's within a couple \n"+
				"of months of your real birthday.";
		}
		var dynd = {
			"id": ID,
			"pw": dataEntries[1],
			"bd": birthText
		};
		aux.dynamic("./register/created.dynh", dynd, function(page){
			if(page == "fe" || page == "se")
				ret_error(page);
			else{
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write(page, function(err){res.end();});
			}
		});
	}
	/*Return the manage account web page
		data is an array with account data
	*/
	function ret_manage_account(data){
		if(data[0][0] == "t"){
			var lnacc = "";
			if(data[3] == ""){
				lnacc = "No Linked Accounts";
			}
			else{//Data Format is: [id,pass,bd,"link1,link2"]
				lnacc = data[3].replace(new RegExp('[,]', 'g'), ", ");
			}
			var dynd = {//dynamic data
				"id": data[0],
				"pw": data[1],
				"birth": data[2],
				"linked_accounts": lnacc
			};
			aux.dynamic("./account/manageT.dynh", dynd, function(page){
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write(page, function(err){res.end();});
			});
		}
		else if(data[0][0] == "u"){
			var level = data[5].split(",")[0];
			var points = data[5].split(",")[1];
			var coins = data[5].split(",")[2];
			var lnacc = "";
			if(data[3] == ""){
				lnacc = "No Linked Accounts";
			}
			else{//Data Format is: [id,pass,bd,links("link1,link2,link3"),sex,l/p/c,inventory]
				lnacc = data[3].replace(new RegExp('[,]', 'g'), ", ");
			}
			var dynd = {//dynamic data
				"id": data[0],
				"pw": data[1],
				"birth": data[2],
				"linked_accounts": lnacc, //from data[3]
				"sex": data[4],
				"level": level, //from data[5]
				"points": points, //from data[5]
				"coins": coins, //from data[5]
				"heap": data[6]
			};
			aux.dynamic("./account/manageU.dynh", dynd, function(page){
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write(page, function(err){res.end();});
			});
		}
	}
	// Returns a loading page while awaiting link
	function ret_link_loading_trainer(data){
		var dynd = {
			"id": data.id,
			"lid": data.lid,
			"pw": data.pWord,
			"tryN": parseInt(data.tryN)+1
		};
		aux.dynamic("./session/linkloading-trainer.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	function ret_link_loading_user(data){
		var dynd = {
			"id": data.id,
			"pw": data.pWord,
			"lid": data.lid
		};
		aux.dynamic("./session/linkloading-user.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	//Returns the page with the start button
	function ret_start_session_trainer(data){
		var dynd = {
			"id": data.id,
			"pw": data.pWord,
			"lid": data.lid
		};
		aux.dynamic("./session/startsession-trainer.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	function ret_start_session_user(data){
		var dynd = {
			"id": data.id,
			"pw": data.pWord,
			"lid": data.lid
		};
		aux.dynamic("./session/startsession-user.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	function ret_session_trainer(data){
		//[session control page] show Tic Detected, Stop Session butttons
		var dynd = {
			"id": data.id,
			"pw": data.pWord,
			"lid": data.lid
		};
		aux.dynamic("./session/session-trainer.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	function ret_session_user(data){
		//[session page] show counter, start local reward timer
		var dynd = {
			"id": data.id,
			"pw": data.pWord,
			"lid": data.lid,
			"level": data.level,
			"points": data.points,
			"coins": data.coins,
			"sesL": data.sesL,
			"heap": data.heap
		};
		aux.dynamic("./session/session-user.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	// After error/report
	function ret_report_sent(data){
		if(!data.fName)
			data.fName = "Y";//No name supplied
		else
			data.fName = data.fName + ", y";
		var dynd = {
			"fn": data.fName
		};
		aux.dynamic("./error/report-sent.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	//Return the TT Store. Requires id, pw, coins
	function ret_store(data){
		aux.dynamic("./account/store/store.dynh", data, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
	}
	
	// Redirect to the specified URL
	function ret_redirect(pathN){
		res.writeHead(303, {"Location": pathN});
		res.end();
	}
	// Returns the requested file.
	function ret_requested_file(pathN){
		if(pathN.slice(0,2) != "./"){
			if(pathN.slice(0,1) != "/")// "abc/def.ghi"
				pathN = "./"+ pathN;
			else// "/abc/def.ghi"
				pathN = "."+ pathN;
		}
		//Choose the appropriate content type based on the file extension
		var ext = pathN.slice(pathN.lastIndexOf("."));
		var cType = "text/plain";//MIME type
		switch(ext){
			case ".html":
				cType = "text/html";
			break;
			case ".js":
				cType = "text/javascript";
			break;
			case ".css":
				cType = "text/css";
			break;
			case ".gj"://personal extension for getting json data (GetJson)
				cType = "application/json";
			break;
			case ".ico":
				cType = "image/x-icon";
			break;
			case ".png":
				cType = "image/png";
			break;
			case ".gif":
				cType = "image/gif";
			break;
			case ".svg":
				cType = "image/svg+xml";
			break;
			/*.ttad - Tt account data
				.ttsd - Tt session data (uses "|" & "\n" not <~><~>)
				.ttd - other Tt data (lnusers, err/log) (still uses <~><~>)
				Maybe ttsd and ttd could be available through the admin interface one day.
			*/
			case ".ttad":
			case ".ttsd":
			case ".ttd":
				// Don't serve sensitive data
				res.writeHead(403, {"Content-Type": "text/html"});
				res.end();
			return;
		}
		if(ext == ".gj"){
			switch(pathN){
				case "./account/leaderboard/leaderboard.gj":
					aux.debugShout("288");
					aux.loadAllUsers(function(err,users){
						aux.debugShout("people: "+users, 3);
						var res_table = [];
						/*["id", "level", "points"]
						  [u0  , 1      , 100]
							...  , ...    , ...
						*/
						var len = users.length;
						if(len > 100)
							len = 100;
						for(var i = 0; i < len; i++){
							var id = users[i][0];
							var lp = users[i][5].split(",");
							res_table[i] = [id, lp[0], lp[1]];
						}
						aux.debugShout("res_table: "+res_table, 3);
						var resFinal = JSON.stringify(res_table);
						aux.debugShout("resFinal: "+resFinal, 3);
						res.writeHead(200, {"Content-Type": cType});
						res.write(resFinal, function(err){res.end();});
					});
				break;
			}
		}
		else{
			// Read the requested file content and send it
			fs.readFile(pathN, function (err, data) {
				if (err) {
					// HTTP Status: 404 : NOT FOUND
					res.writeHead(404, {"Content-Type": 'text/html'});
					fs.readFile("./error/404.html", function(err, data2){
						if(err){
							res.end();
							return;
						}
						res.write(data2, function(err){res.end();});
					});
					return;
				}
				aux.debugShout("returning "+pathN+" which is of type "+cType, 3);
				// HTTP Status: 200 : OK
				res.writeHead(200, {"Content-Type": cType});	
				// Write the content of the file to response body
				res.write(data, function(err){res.end();});
			});
		}
	}
	
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
					var pass = body.pWord;
					var passC = body.pWordConf;
					
					//Double check validation
					if(!bD || !pass || !passC){
						ret_error("ife", "/register/trainer.html");
						break;
					}
					if(isNaN(bD) || bD.length != 4){
						ret_error("dfe", "/register/trainer.html")
						break;
					}
					if(pass != passC){
						ret_error("pce", "/register/trainer.html");
						break;
					}
					//Make sure these don't include ; or < or > - VITAL
					//Could allow semicolon now
					if(pass.indexOf(";") != -1 || pass.indexOf("<") != -1 || pass.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");//Invalid Character Error
						break;
					}
					if(bD.indexOf(";") != -1 || bD.indexOf("<") != -1 || bD.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");
						break;
					}
					//Get the next available iD number
					aux.getNextID("t", function(err, ID){
						if(err){
							ret_error(err);
							return;
						}
						var newTFile = "./account/trainer_data/"+ID+".ttad";
						var tData = aux.newT(ID,pass,bD);
						fs.writeFile(newTFile, tData, function(err){
							if(err)
								ret_error("fe", "/register/user.html", "register-user: write newUFile");
							else
								ret_created(tData);
						});
					});
				break;
				case "/register/user.html":
					var sex = body.sex;
					var bD = body.birth;
					var pass = body.pWord;
					var passC = body.pWordConf;
					
					//Double check validation
					if(sex != "M" && sex != "F"){
						ret_error("ife", "/register/user.html");
						break;
					}
					if(isNaN(bD)){//catches undefined 
						ret_error("dfe", "/register/user.html");
						//I could check and do it anyway if they submitted month and year, but why be that courteous
						break;
					}
					if(pass != passC){
						ret_error("pce", "/register/user.html");
						break;
					}
					//Make sure these don't include ; or < or > - VITAL
					//Could allow semicolon now
					if(pass.indexOf(";") != -1 || pass.indexOf("<") != -1 || pass.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");//Invalid Character Error
						break;
					}
					if(bD.indexOf(";") != -1 || bD.indexOf("<") != -1 || bD.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");
						break;
					}
					
					aux.getNextID("u", function(err, ID){
						if(err){
							ret_error("fe", "/register/user.html", "register-user: getNextID");
							return;
						}
						var newUFile = "./account/user_data/"+ID+".ttad";
						var uData = aux.newU(ID,pass,bD,sex);
						fs.writeFile(newUFile, uData, function(err){
							if(err)
								ret_error("fe", "/register/user.html", "register-user: write newUFile");
							else
								ret_created(uData);
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
								ret_error(data, "/account/index.html");
							break;
							
							default:
								ret_manage_account(data);
							break;
						}
					}
					switch(body.source){
						case "manageAccount"://Log on page
						aux.loadAcc(body.id, function(err,user){
							if(err){
								acc_ret(err);
								return;
							}
							if(user[1] == body.pWord)
								acc_ret(user);
							else
								acc_ret("pce");
						});
						break;
						
						case "editP"://Source: editP, id, oldPass, pass
							var iD = body.id;
							var opw = body.oldPass;
							var pw = body.pass;
							aux.debugShout("Editing "+iD, 1);
							aux.editAcc(iD, 1, function(dEntry){//return new PW
								if(dEntry[1] !== opw){
									aux.debugShout("489|" + dEntry[1] + "|" + opw + "|" + pw);
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
							var iD = body.id;// body = {source, id, lid, pWord}
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
										if(dEntry[1] !== body.pWord){
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
						case "newSession"://source, id, pWord, lid
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
							 
							var pass = body.pWord;
							var file = "./account/";
							
							body.id = aux.isID(body.id);
							body.lid = aux.isID(body.lid);
							if(body.id === false || body.lid === false){
								ret_error("ide", "/session/index.html");
								break;
							}
							/*Check that the accounts are linked and confirm pw.
								Note that this code is reused for users and trainers.
							*/
							aux.loadAcc(body.id, function(err, aData){
								if(err){
									ret_error(err);
									return;
								}
								if(aData[1] != pass){
									//Password Confirmation Error
									ret_error("pce", "/session/index.html");
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
									ret_error("anle", "/session/index.html");
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
													ret_error("fe", "/session/index.html", "new-session: checking if oldSFile exists"); //Some other bizarre error
											}
											else{//Bad, it's an old ghost session. Or it's concurrent.
												ret_error("conses", "/session/index.html");
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
													var linkData = "<" +body.id+ "," +body.lid+ ">";
													fs.readFile("./session/lnusers.ttd", "utf8", function(err,data){
														if(err){
															ret_error("fe", "/session/index.html", "new-session: reading lnusers.ttd");
															return;
														}
														if(data.indexOf(linkData) == -1)
															fs.appendFile("./session/lnusers.ttd", linkData, function(err){
																if(err){
																	ret_error("fe", "/session/index.html", "new-session: appending to lnusers.ttd");
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
													ret_error("fe", "/session/index.html", "new-session: checking if oldSFile exists");
											}
											else{//Bad, it's an old ghost session. Or it's concurrent.
												ret_error("conses", "/session/index.html", "new-session: concurrent/ghost session");
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
									ret_link_loading_trainer(body);
								else{ //b.i[0] is definitely "u" because the error would have already been caught otherwise
									ret_link_loading_user(body);
								}
							}
						break;
						case "linkloading-trainer"://source, id, pWord, lid, tryN  tryN is the try number
							if(body.tryN < 30){
								//All the errors for id format have been caught already
								fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
									if(err){
										ret_error("fe", "/session/index.html", "linkloading-trainer: reading lnusers.ttd");
									}
									else{
										//look for other account
										var searchEntry = "<" +body.lid+ "," +body.id + ">";
										var iSE = data.indexOf(searchEntry);
										if(iSE == -1){
											//Wait two seconds and try again
											ret_link_loading_trainer(body);
										}
										else{
											var iSEEnd = iSE + searchEntry.length;
											var newData = data.substring(0, iSE) + data.substring(iSEEnd, data.length);
											//Cut out entry
											fs.writeFileSync("./session/lnusers.ttd", newData, "utf8");
											/*make a session file - this should only exist for the duration of the session.
												when the session ends, rename and copy the file to an archive: ./session/archive
											*/
											var sesFileName = "./session/temp/session"+ body.id + body.lid + ".ttsd";
											fs.writeFile(sesFileName, "", function(err){
												if(err)
													ret_error("fe", "/session/index.html", "linkloading-trainer: making session file");
												else
													ret_start_session_trainer(body);//source, id, pWord, lid, tryN 
											});
										}
									}
								});
							}
							else{//Timeout
								ret_error("toe", "/session/index.html");
							}
						break;
						case "linkloading-user"://source, id, pWord, lid, tryN 
							/*(if user) [loading page]set timer to look for session file every 2s for 1m -->
							*/
							if(body.reqType == 'leave' || body.reqType == 'timeout'){
								//remove entry in lnusers
								fs.readFile("./session/lnusers.ttd", "utf8", function(err, data){
									if(err){//lnusers got destroyed?
										ret_error("fe", "/", "linkloading-user: leave/timeout - read lnusers");//lnusers got destroyed?
									}
									else{
										var searchEntry = "<" +body.id+ "," +body.lid+ ">";
										aux.debugShout("attempting to delete entry: "+searchEntry);
										var iSE = data.indexOf(searchEntry);
										if(iSE != -1){
											var iSEEnd = iSE + searchEntry.length;
											var newData = data.slice(0, iSE) + data.slice(iSEEnd);
											fs.writeFileSync("./session/lnusers.ttd", newData, "utf8");//Cut out entry
											if(body.reqType == 'timeout')
												ret_error("toe", "/session/index.html");
										}
										else{
											ret_error("fe", "/session/index.html", "linkloading-user: where did the lnusers entry go?");
										}
									}
								});
							}
							else if(body.reqType == 'exists'){
								var searchFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
								fs.stat(searchFile, function(err, stats){
									if(err == null){//File exists
										body.tryN = 0;
										ret_start_session_user(body);
									}
									else if(err.code == "ENOENT"){//File does not exist
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("wait", function(err){res.end();});
									}
									else//Some other error
										ret_error("fe", "/session/index.html", "linkloading-user: stat session file");
								});
							}
						break;
						case "start_session-trainer"://source, id, pWord, lid
							//If aborting, delete the session file - don't bother with archive because it hasn't even started yet
							if(body.reqType == 'leave'){
								var sesFile = "./session/temp/session" + body.id + body.lid + ".ttsd";
								aux.debugShout("791", 3);
								fs.unlink(sesFile, function(err){
									if(err)
										ret_error("fe", "/session/index.html", "start_session-trainer: leave");
								});
							}
							else{ //START pressed
								var sesFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
								//If file does not exist, the user must have left early
								fs.stat(sesFile, function(err){
									if(err){
										if(err.code == "ENOENT"){//user left (or magic ghosts deleted the file){
											ret_redirect("/session/session-ended.html");
											aux.debugShout("836", 3);
										}
										else
											ret_error("fe","/session/index.html", "start_session-trainer: stat session file");
									}
									else{//file exists
										//Append "session started at"+time, show Tic Detected, Stop Session butttons
										var sEntry = "session started|" + aux.time();
										fs.appendFile(sesFile, sEntry, function(err){
											if(err)
												ret_error("fe", "/session/index.html", "start_session-trainer: append to sesFile");
											else{
												ret_session_trainer(body);
											}
										});
										
									}
								});
							}
						break;
						//See if the session has started
						case "start_session-user"://source, id, pWord, lid, tryN 
							if(body.reqType == 'leave' || body.reqType == 'timeout'){
								//end session - it has not started yet, so just delete it
								var sesFile = "./session/temp/session" + body.lid + body.id + ".ttsd";
								fs.unlink(sesFile, function(err){
									if(err){
										ret_error("fe", "/session/index.html", "start_session-user: unlink");
									}
									else{
										ret_redirect("/session/session-ended.html");
									}
								});
							}
							else if(body.reqType == 'started'){
								//has the session started
								var searchFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
								fs.readFile(searchFile, "utf8", function(err, sfdata){
									if(err){
										if(err.code == "ENOENT")//trainer left
											ret_redirect("/session/session-ended.html");
										else
											ret_error("fe", "/session/index.html", "start_session-user: read sesFile");
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
											ret_error(err);//anfe or ide
											return;
										}
										if(body.pWord != uData[1]){
											ret_error("pce");
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
												ret_error("fe", "/session/index.html", "start_session-user: append to sesFile");
												return;
											}
											body.sesL = sfdata.length + startLPEntry.length;//current session file length (just three lines)
											ret_session_user(body);
										});
									});
								});
							}
						break;
						case "session-trainer"://Tic. body= source:session-trainer, id:t0000, pWord: , lid:u0000
							var sesFile = "./session/temp/session"+ body.id + body.lid + ".ttsd";
							var tEntry = "\ntic detected|" +aux.time();
							fs.stat(sesFile, function(err, stats){
								if(err == null){//File exists
									fs.appendFile(sesFile, tEntry, function(err){
										if(err)//Why would this happen? 
											ret_error("fe", "/session/index.html", "session-trainer: append to sesFile");
										else{
											res.writeHead(200, {"Content-Type": "text/plain"});
											res.write("good", function(err){res.end();});
										}
									});
								}
								//File does not exist. 
								//This happens when the user has ended the session already
								else if(err.code == "ENOENT"){
									ret_redirect("/session/session-ended.html");
								}
								else//Some other error
									ret_error("fe", "/session/index.html", "session-trainer: stat sesFile");
							});
						break;
						case "session-user"://body: source, id, pWord, lid
							//Requests made from the ongoing user session
							/*Check the session file here for tic detected or session ended*/
							var oldL = body.sesL;
							var sesFile = "./session/temp/session"+ body.lid + body.id + ".ttsd";
							fs.readFile(sesFile, "utf8", function(err, data){
								if(err){
									ret_error("fe", "/session/index.html", "session-user: read sesFile");
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
									ret_error("fe", "/session/index.html", "session-user: append to sesFile");
									return;
								}
								res.writeHead(200);
								res.end();
							});
						break;//loglpc
						case "savelpc"://id, pass, l,p,c
							var newlpc = body.level +","+ body.points +","+ body.coins;
							aux.editAcc(body.id, 5, function(userData){
								if(body.pWord != userData[1]){
									ret_error("pce");
									return "<cancel>";
								}
								return newlpc;
							}, function(err, userData){
								if(err){
									if(err !== "canceled"){
										ret_error(err, "/session/index.html", userData);
									}
									return;//res.end happened already (ret_error("pce"))
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
											ret_error("fe", "/session/index.html", "session_end-trainer: append to sesFile");
										else{
											ret_redirect("/session/session-ended.html");
										}
									});
								}
								//File does not exist. 
								//This happens if the user has ended the session already
								else if(err.code == "ENOENT"){
									ret_redirect("/session/session-ended.html");
								}
								else//Some other error
									ret_error("fe", "/session/index.html", "session_end-trainer: stat sesFile");
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
										ret_error("fe", "/session/index.html", "session_end-user: rename sesFile");
									}
									else{
										/**append report*/
										fs.readFile(sF2, "utf8", function(err, data){
											if(err){
												ret_error("fe", "/session/index.html", "session_end-user: read sf2");
												return;
											}
											fs.appendFile(sF2, aux.genReport(data), function(err){
												if(err)
													ret_error("fe", "/session/index.html", "session_end-user: append report");
												else
													ret_redirect("/session/session-ended.html");
											});
										});
									}
								});
							}
							//save user l & p
							aux.editAcc(body.id, 5, function(uData){
								if(body.pWord != uData[1]){
									aux.debugShout("body.pword= "+body.pWord+"; pass= "+uData[1]);
									ret_error("pce");
									return "<cancel>";
								}
								return newlpc;
							}, function(err, uData){
								if(err){
									if(err !== "canceled"){
										ret_error(err, "/session/index.html", uData);
									}
									return;
								}
								//End and archive session
								fs.readFile(sesFile, "utf8", function(err, sData){
									if(err){
										ret_error("fe", "/session/index.html", "session_end-user: read sesFile");
										return;
									}
									if(sData.indexOf("session ended") == -1){
										//The session still needs to be ended
										var eEntry = "\nsession ended|"+aux.time();
										fs.appendFile(sesFile, eEntry, function(err){
											if(err){
												ret_error("fe", "/session/index.html", "session_end-user: append to sesFile");
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
					ret_report_sent(body);
				break;
				case "/error/ghses.html":
					body.tid = aux.isID(body.tid);
					body.uid = aux.isID(body.uid);
					if(body.tid === false || body.uid === false){
						ret_error("ide", "/error/ghses.html");
						break;
					}
					
					//verify password
					aux.loadAcc(body.tid, function(err, tData){
						if(err){
							ret_error(err);
							return;
						}
						if(tData[1] != body.pWord){
							ret_error("pce");
							return;
						}
						var sesFile = "./session/temp/session"+ body.tid + body.uid + ".ttsd";
						fs.stat(sesFile, function(err){
							if(err){
								if(err.code == "ENOENT"){//already deleted
									ret_redirect("/session/index.html");
								}
								else{
									ret_error("fe", "/error/ghses.html", "ghost session: looking at ghost session file");
								}
							}
							else{//legit ghost file
								//Archive the session file under a new name
								var sF2 = "./session/archive/session" + body.tid + body.uid + aux.time("forfile") + ".ttsd";
								fs.rename(sesFile, sF2, function(err){
									if(err){
										ret_error("fe", "/error/ghses.html", "ghost session: rename sesFile");
									}
									else{
										/**append report*/
										fs.readFile(sF2, "utf8", function(err, data){
											if(err){
												ret_error("fe", "/error/ghses.html", "ghost session: read sf2");
												return;
											}
											fs.appendFile(sF2, aux.genReport(data), function(err){
												if(err)
													ret_error("fe", "/error/ghses.html", "ghost session: append report");
												else{
													ret_redirect("/session/index.html");
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
				case "/account/store/index.html":
					switch(body.source){
						case "enterStore":
							//verify form
							body.id = aux.isID(body.id);
							if(body.id === false || body.id[0] !== "u"){
								ret_error("ide", "/session/index.html");
								break;
							}
							aux.loadAcc(body.id, function(err,user){
								if(err){
									ret_error(err);//anfe
									return;
								}
								if(body.pw != user[1]){
									ret_error("pce", "/account/store/index.html");
									return;
								}
								body.coins = user[5].split(",")[2];
								body.heap = user[6];
								aux.debugShout("1162 "+JSON.stringify(body), 3);
								ret_store(body);
							});
						break;
						case "buy":
							body.id = aux.isID(body.id);
							if(body.id === false || body.id[0] !== "u"){
								ret_error("ide");
								break;
							}
							if(isNaN(inventory[body.item])){//is not in inventory(may give a false positive)
								ret_error("ife");//I'm ok with this because it would only be triggered by hackers, who I feel no need to be courteous to
								break;
							}
							//Subtract the needed coins
							aux.editAcc(body.id, 5, function(uData){
								//Again, these really should have been caught client-side
								if(uData[1] !== body.pw){
									ret_error("pce");
									return "<cancel>";
								}
								var lpc = uData[5].split(",");
								if(lpc[2] < inventory[body.item]){
									ret_error("ife");
									return "<cancel>";
								}
								var newlpc = lpc[0]+ "," +lpc[1]+ "," +(lpc[2]-inventory[body.item]);
								return newlpc;
							}, function(err, uData){
								if(err){
									if(err !== "canceled"){
										if(uData)
											aux.debugShout("1217 "+uData);
										ret_error(err);
									}
									return;//already returned - ret_error
								}
								//add the item to their loot pile
								newHeap = body.item + uData[6];
								aux.editAcc(body.id, 6, newHeap, function(err, uData){
									if(err){
										if(uData)
											aux.debugShout("1204 "+uData);
										ret_error(err);
										return;//already returned - ret_error
									}
									//Fix the body object to send back to the store page
									var lpc = uData[5].split(",");
									body.coins = lpc[2];
									body.heap = uData[6];
									aux.debugShout("1212 "+JSON.stringify(body), 3);
									ret_store(body);
								});
							});
						break;
					}
				break;//store
			}
		});
	}//POST
	else{
		ret_requested_file(pathname);
	}
}

//Create server using handleRequest
var server = http.createServer(handleRequest);

//Start server
server.listen(PORT, function(){
	//Callback triggered when server is successfully listening.
	console.log("Started at "+aux.time());
	console.log("Server listening on: http://localhost:" + PORT);
});
