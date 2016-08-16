var http = require("http");
var fs = require('fs');
var url = require('url');
var aux = require("./scripts/auxiliary.js");

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
	aux.debugShout(req.method + " request for " + pathname + " received.", 1);
	/**
	* Functions which return dynamic web pages
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
	a message can be passed and logged in ./error/log.data
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
		if(data.indexOf("<") != -1)
			data = data.slice(data.indexOf("<")+1, data.indexOf(">"));
		var splitd = data.split(";");//id,pass,bd,links, sex, l/p
		var ID = splitd[0];
		var birthText = "";
		if(ID[0] == "u"){
			var birthD = new Date(parseInt(splitd[2]));
			birthText += "<br><br>"+
				"FYI, the fake birthdate we will use for you is "+birthD.toLocaleDateString()+". \n"+
				"There's a small chance (less than 3%) that this is your real birthday, but if so, \n"+
				"that's just a lucky guess. All we know on our end is that it's within a couple \n"+
				"of months of your real birthday.";
		}
		var dynd = {
			"id": ID,
			"pw": splitd[1],
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
	var data is a single account entry in a .data file (an array)
	*/
	function ret_manage_account(data){
		if(data[0][0] == "t"){
			var lnacc = "";
			if(data[3] == ""){
				lnacc = "No Linked Accounts";
			}
			else{//Data Format is: id;pw;DoB;[link1][,link2][,...]
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
			else{//Data Format is: id;pw;DoB;[link1][,link2][,...],m/f,l/p
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
				"coins": coins //from data[5]
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
			"sesL": data.sesL
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
		}
		if(ext == ".data"){
			// Don't serve sensitive data
			res.writeHead(403, {"Content-Type": "text/html"});
			res.end();
		}
		else if(ext == ".gj"){
			switch(pathN){
				case "./account/leaderboard/leaderboard.gj":
					aux.debugShout("275");
					fs.readFile("./account/user.data", 'utf8', function(err, data){
						if(err){
							ret_error("fe");
							return;
						}
						var people = aux.dataToEntries(data);
						aux.debugShout("people: "+people, 3);
						var res_table = [];
						/*["id", "level", "points"]
						  [u0  , 1      , 100]
							...  , ...    , ...
						*/
						var len = people.length;
						if(len > 100)
							len = 100;
						for(var i = 0; i < len; i++){
							var id = people[i][0];
							var lp = people[i][5].split(",");
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
					//Make sure these don't include ; or \n - VITAL
					if(pass.indexOf(";") != -1 || pass.indexOf("<") != -1 || pass.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");//Invalid Character Error
						break;
					}
					if(bD.indexOf(";") != -1 || bD.indexOf("<") != -1 || bD.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");
						break;
					}
					
					//Get the next available iD number
					var iD = "t0";
					fs.readFile("./account/trainer.data", "utf8", function(err, data){
						if(err){
							ret_error("fe", "/register/trainer.html", "register-trainer: reading trainer.data");
							return;
						}
						var last = data.slice(data.lastIndexOf("<")+1, data.lastIndexOf(">"));
						var lastID = last.split(";")[0];
						var nID = aux.parse36ToDec(lastID.slice(1))+1;
						iD = "t"+aux.decTo36(nID);
						if(iD == "tError")
							ret_error("fe", "/register/trainer.html", "register-trainer: decTo36");
						else{
							var tData = "\n<"+iD+";"+pass+";"+bD+";>";//the empty section is for lnacc
							fs.appendFile("./account/trainer.data", tData, function(err){
								if(err)
									ret_error("fe", "/register/trainer.html", "register-trainer: reading trainer.data");
								else{
									ret_created(tData);
								}
							});
						}
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
					//Make sure these don't include ; or \n - VITAL
					if(pass.indexOf(";") != -1 || pass.indexOf("<") != -1 || pass.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");//Invalid Character Error
						break;
					}
					if(bD.indexOf(";") != -1 || bD.indexOf("<") != -1 || bD.indexOf(">") != -1){
						ret_error("ice", "/register/trainer.html");
						break;
					}
					
					//Get the next available iD number
					var iD = "u0";
					fs.readFile("./account/user.data", "utf8", function(err, data){
						if(err){
							ret_error("fe", "/register/user.html", "register-user: reading user.data");
							return;
						}
						var last = data.slice(data.lastIndexOf("<")+1, data.lastIndexOf(">"));
						var lastID = last.split(";")[0];
						var nID = aux.parse36ToDec(lastID.slice(1))+1;
						iD = "u"+aux.decTo36(nID);
						if(iD == "uError")
							ret_error("fe", "/register/user.html", "register-user: decTo36");
						else{
							var uData = "\n<"+iD+";"+pass+";"+bD+";;"+sex+";0,0,0>";//;links; level,points,coins
							fs.appendFile("./account/user.data", uData, function(err){
								if(err)
									ret_error("fe", "/register/user.html", "register-user: reading user.data");
								else
									ret_created(uData);
							});
						}
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
						var pass = body.pWord;
						var iD = body.id;
						var file = "./account/";
						
						iD = aux.isID(iD);
						if(iD === false){
							acc_ret("ide");
							break;
						}
						if(iD[0] == "t")
							file += "trainer.data";
						else if(iD[0] == "u")
							file += "user.data";
						
						fs.readFile(file, "utf8", function(err, data){
							if(err)
								acc_ret("fe");
							else{
								var people = aux.dataToEntries(data);
								aux.debugShout("449 "+people, 3);
								var found = false;
								for(i=0; i < people.length; i++){
									if(people[i][0] == iD){
										found = true;
										if(people[i][1] == pass)
											acc_ret(people[i]);//Success
										else
											acc_ret("pce");//Password Confirmation Error
										break;//Exit for
									}
								}
								if(!found)
									acc_ret("anfe");//Account not found error
							}
						});
						break;
						case "editP"://Source: editP, id, oldPass, pass
							var iD = body.id;
							var opw = body.oldPass;
							var pw = body.pass;
							var file = "./account/";
							iD = aux.isID(iD);
							if(iD === false){
								acc_ret("ide");
								break;
							}
							if(iD[0] == "t")
								file += "trainer.data";
							else if(iD[0] == "u")
								file += "user.data";
							
							aux.debugShout("Editing "+iD, 1);
							aux.editData(file, iD, 1, function(dEntry){//return new PW
								if(dEntry[1] !== opw){
									aux.debugShout("484|" + dEntry[1] + "|" + opw + "|" + pw);
									acc_ret("pce");
									return "<cancel>";
								}
								return pw;
							}, function(err, dEntry){//callback
								if(err){
									if(err !== "canceled"){
										if(dEntry)
											aux.debugShout(dEntry);
										acc_ret(err);
									}
									return;
								}
								acc_ret(dEntry.split(";"));
							});
						break;
						case "addL"://Add Account Link
							var iD = body.id;// body = {source, id, lid, pWord}
							var lID = body.lid;
							var file = "./account/";
							var lFile = file;
							
							iD = aux.isID(iD);
							lID = aux.isID(lID);
							if(iD === false || lID === false){
								acc_ret("ide");
								break;
							}
							if(iD[0] == "t"){
								file += "trainer.data";
								lFile += "user.data";
							}
							else if(iD[0] == "u"){
								file += "user.data";
								lFile += "trainer.data";
							}
							
							aux.debugShout("Linking " + lID + " to " + iD, 1);
							
							//Check that the user exists -- this can stay as "readFile" because I'm not editing it
							fs.readFile(lFile, "utf8", function(err, data){
								if(err){
									acc_ret("fe");
									return;
								}
								var lIndex = data.indexOf("<"+lID);
								if(lIndex == -1){
									acc_ret("anfe");
									return;
								}
								//addL
								aux.editData(file, iD, 3, function(dEntry){
									if(dEntry[1] !== body.pWord){
										acc_ret("pce");
										return "<cancel>";
									}
									var dLinks = dEntry[3];
									var newLData = lID;//e.g. "t2"
									if(dLinks != ""){
										//verify that the account is not already linked
										var linkedAs = dLinks.split(",");//split
										for(var i=0; i < linkedAs.length; i++){
											if(linkedAs[i] == lID){
												acc_ret(dEntry);
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
										return;//canceled - do nothing
									}
									acc_ret(dEntry.split(";"));
								});
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
							(if user) add id to lnusers.data,
								[loading page]set timer to look for session file every 2s for 1m -->
								[link successful page]set timer to look for "session started" every 2s for 1m -->
									[counter page]start local reward timer

							(if trainer) [loading page]set timer to look for other account (in lnusers) every 2s for 1m --> 
								[start page]create session data file, show Start button --> 
									[session control page]Append "session started at"+, show Tic Detected, Stop Session butttons
							 */
							 
							var pass = body.pWord;
							var file = "./account/";
							
							body.id = aux.isID(body.id);
							body.lid = aux.isID(body.lid);
							if(body.id === false || body.lid === false){
								ret_error("ide", "/session/index.html");
								break;
							}
							if(body.id[0] == "t"){
								file += "trainer.data";
							}
							else if(body.id[0] == "u"){
								file += "user.data";
							}
							//Check linked, pw
							fs.readFile(file, "utf8", function(err, data){
								if(err){
									ret_error("fe", "/session/index.html", "new-session: reading "+file);
									return;
								}
								var people = aux.dataToEntries(data);
								var found = false;
								for(i=0; i < people.length; i++){
									aux.debugShout("looking at "+people[i][0]);
									if(people[i][0] == body.id){
										if(people[i][1] == pass){
											var linkedAccounts = people[i][3].split(",");
											for(i2=0; i2<linkedAccounts.length; i2++){
												if(linkedAccounts[i2] == body.lid){
													found = true;
												}
											}
											if(!found){
												ret_error("anle", "/session/index.html");//Account not linked error
											}
											else{
												allConfirmed();
											}
										}
										else
											ret_error("pce", "/session/index.html");//Password Confirmation Error						
										found = true;
										break;//Exit for
									}
								}
								if(!found)
									ret_error("anfe", "/session/index.html");//Account not found error
							});
							//Continue with the next step
							//	see if a session file already exists between those users
							function allConfirmed(){
								if(body.id[0] == "t"){
									//This section should hopefully never need to be used, but it handles ghost sessions. Logs a ghost session error.
									var oldSFile = "./session/temp/session"+ body.id + body.lid + ".data";
									fs.stat(oldSFile, function(err){
										if(err){
											if(err.code == "ENOENT"){//Good.
												//Go to trainer loading page
												success();
											}
											else
												ret_error("fe", "/session/index.html", "new-session: checking if oldSFile exists");
										}
										else{//Bad, it's an old ghost session. Or it's concurrent.
											ret_error("conses", "/session/index.html");
										}
									});
								}
								else{
									//This section should never need to be used, but it handles ghost sessions. Logs a ghost session error.
									var oldSFile = "./session/temp/session"+ body.lid + body.id + ".data";
									fs.stat(oldSFile, function(err){
										if(err){
											if(err.code == "ENOENT"){//Good.
												var linkData = "<" +body.id+ "," +body.lid+ ">";//Data entry for the waiting link
												fs.readFile("./session/lnusers.data", "utf8", function(err,data){
													if(err){
														ret_error("fe", "/session/index.html", "new-session: reading lnusers.data");
														return;
													}
													if(data.indexOf(linkData) == -1)
														fs.appendFile("./session/lnusers.data", linkData, function(err){
															if(err){
																ret_error("fe", "/session/index.html", "new-session: appending to lnusers.data");
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
								fs.readFile("./session/lnusers.data", "utf8", function(err, data){
									if(err){
										ret_error("fe", "/session/index.html", "linkloading-trainer: reading lnusers.data");
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
											fs.writeFileSync("./session/lnusers.data", newData, "utf8");
											//make a session file - this should only exist for the duration of the session.
											//when the session ends, rename and copy the file to an archive: ./session/archive
											var sesFileName = "./session/temp/session"+ body.id + body.lid + ".data";
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
								fs.readFile("./session/lnusers.data", "utf8", function(err, data){
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
											fs.writeFileSync("./session/lnusers.data", newData, "utf8");//Cut out entry
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
								var searchFile = "./session/temp/session"+ body.lid + body.id + ".data";
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
								var sesFile = "./session/temp/session" + body.id + body.lid + ".data";
								aux.debugShout("791", 3);
								fs.unlink(sesFile, function(err){
									if(err)
										ret_error("fe", "/session/index.html", "start_session-trainer: leave");
								});
							}
							else{ //START pressed
								var sesFile = "./session/temp/session"+ body.id + body.lid + ".data";
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
								var sesFile = "./session/temp/session" + body.lid + body.id + ".data";
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
								var searchFile = "./session/temp/session"+ body.lid + body.id + ".data";
								fs.readFile(searchFile, "utf8", function(err, data){
									if(err){
										if(err.code == "ENOENT")//trainer left
											ret_redirect("/session/session-ended.html");
										else
											ret_error("fe", "/session/index.html", "start_session-user: read sesFile");
										return;
									}
									if(data.indexOf("session started|") == -1){
										//return 'wait'
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("wait", function(err){res.end();});
										return;
									}
									//load level and points from user.data and start session
									fs.readFile("./account/user.data", "utf8", function(err, data2){
										if(err){
											ret_error("fe", "/session/index.html", "start_session-user: read user.data");
											return;
										}
										var people = aux.dataToEntries(data2);
										var found = false;
										for(i=0; i < people.length; i++){
											if(people[i][0] == body.id){
												found = true;
												if(people[i][1] == body.pWord){
													var lpData = people[i][5].split(",");
													body.level = lpData[0];
													body.points = lpData[1];
													body.coins = lpData[2];
													var startLPEntry = "\nstarting user l,p,c|"+ lpData[0]+","+lpData[1]+","+lpData[2];
													fs.appendFile(searchFile, startLPEntry, function(err){
														if(err){
															ret_error("fe", "/session/index.html", "start_session-user: append to sesFile");
															return;
														}
														body.sesL = data.length + startLPEntry.length;//current session file length (just three lines)
														ret_session_user(body);
													});
												}
												else
													ret_error("pce", "/session/index.html");//Password Confirmation Error
												break;//Exit for
											}
										}
										if(!found){
											aux.debugShout("anfe 969");
											ret_error("anfe");//Account not found error
										}
									});
								});
							}
						break;
						case "session-trainer"://Tic. body= source:session-trainer, id:t0000, pWord: , lid:u0000
							var sesFile = "./session/temp/session"+ body.id + body.lid + ".data";
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
							var sesFile = "./session/temp/session"+ body.lid + body.id + ".data";
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
							var sesFile = "./session/temp/session"+ body.lid + body.id + ".data";
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
							var uFile = "./account/user.data";
							var newlpc = body.level +","+ body.points +","+ body.coins;
							aux.editData(uFile, body.id, 5, function(dEntry){
								if(body.pWord !== dEntry[1]){
									ret_error("pce");
									return "<cancel>";
								}
								return newlpc;
							}, function(err, data){
								if(err){
									if(err !== "canceled"){
										ret_error(err, "/session/index.html", data);
									}
									return;//res.end happened already (ret_error("pce"))
								}
								res.writeHead(200);
								res.end();
							});
						break;// savelpc
						case "session_end-trainer":
							aux.debugShout("997", 3);
							var sesFile = "./session/temp/session" + body.id + body.lid + ".data";
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
							var sesFile = "./session/temp/session" + body.lid + body.id + ".data";
							var sF2 = "./session/archive/session" + body.lid + body.id + aux.time("forfile") + ".data";
							var uFile = "./account/user.data";
							var newlpc = body.level +","+ body.points +","+ body.coins;
							//save user l & p
							aux.editData(uFile, body.id, 5, function(dEntry){
								if(body.pWord != dEntry[1]){
									aux.debugShout("body.pword= "+body.pWord+"; pass= "+dEntry[1]);
									ret_error("pce");
									return "cancel";
								}
								return newlpc;
							}, function(err, data){
								if(err){
									if(err !== "canceled"){
										ret_error(err, "/session/index.html", data);
									}
									return;
								}
								//End and archive session
								fs.readFile(sesFile, "utf8", function(err, data){
									if(err){
										ret_error("fe", "/session/index.html", "session_end-user: read sesFile");
										return;
									}
									if(data.indexOf("session ended") == -1){
										var eEntry = "\nsession ended|"+aux.time();
										fs.appendFile(sesFile, eEntry, function(err){
											if(err){
												ret_error("fe", "/session/index.html", "session_end-user: append to sesFile");
												return;
											}
											//Archive the session file under a new name
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
										});
									}
									else{
										//Archive the session file under a new name
										fs.rename(sesFile, sF2, function(err){
											if(err){
												ret_error("fe", "/session/index.html", "session_end-user: rename sesFile (1)");
											}
											else{
												/**append report*/
												fs.readFile(sF2, "utf8", function(err, data){
													if(err){
														ret_error("fe", "/session/index.html", "session_end-user: read sF2 (1)");
														return;
													}
													fs.appendFile(sF2, aux.genReport(data), function(err){
														if(err)
															ret_error("fe", "/session/index.html", "session_end-user: append report (1)");
														else
															ret_redirect("/session/session-ended.html");
													});
												});
											}
										});
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
					var tFile = "./account/trainer.data";
					fs.readFile(tFile, "utf8", function(err, data){
						if(err){
							ret_error("fe", "/error/ghses.html", "ghost session: reading trainer.data");
							return;
						}
						var people = aux.dataToEntries(data);
						var found = false;
						for(i=0; i<people.length; i++){
							if(people[i][0] == body.tid){
								found = true;
								if(people[i][1] == body.pWord){ //Good
									var sesFile = "./session/temp/session"+ body.tid + body.uid + ".data";
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
											var sF2 = "./session/archive/session" + body.tid + body.uid + aux.time("forfile") + ".data";
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
								}
								else
									ret_error("pce", "/error/ghses.html");
							}
						}
						if(!found){
							ret_error("anfe", "/error/ghses.html");
						}
					});
				break;
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