var http = require("http");
var fs = require('fs');
var url = require('url');
var aux = require("./auxiliary.js");

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
		pce - Password Confirmation, 
		anfe - Account not found, 
		anle - Account not linked,
		toe - Timeout
	retry is the url the Try Again button links to
		generally the page the error came from.
		Defaults to /index.html
	*/
	function ret_error(error_type, retry){
		if(retry == null)
			retry = "/index.html";
		var dynd = {"retry": retry};
		switch(error_type){
			case "fe":
				res.writeHead(500, {"Content-Type": "text/html"});
				res.end();
			break;
			case "se":
				res.writeHead(500, {"Content-Type": "text/html"});
				res.end();
			break;
			default:
				res.writeHead(400, {"Content-Type": "text/html"});
				aux.dynamic("./error/"+error_type+".dynh", dynd, finish_up);
			break;
		}
		function finish_up(page){
			res.write(page, function(err){res.end();});
		}
	}
	/* Returns a message that the account has been successfully created (/register/)
	*/
	function ret_created(data){
		if(data.indexOf("<") != -1)
		data = data.slice(data.indexOf("<")+1, data.indexOf(">"));
		var splitd = data.split(";");
		var dynd = {
			"id": splitd[0],
			"pw": splitd[3]
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
		if(data[0].substr(0,1) == "t"){
			var lnacc = "";
			if(data[4] == ""){
				lnacc = "No Linked Accounts";
			}
			else{//Data Format is: id;m/f;DoB;Pw;[link1][,link2][,...];level,points
				lnacc = data[4].replace(new RegExp('[,]', 'g'), ", ");
			}
			var dynd = {//dynamic data
				"id": data[0],
				"fn": data[1],
				"birth": data[2],
				"pw": data[3],
				"linked_accounts": lnacc
			};
			aux.dynamic("./account/manageT.dynh", dynd, function(page){
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write(page, function(err){res.end();});
			});
		}
		else if(data[0].substr(0,1) == "u"){
			var level = data[5].split(",")[0];
			var points = data[5].split(",")[1];
			var lnacc = "";
			if(data[4] == ""){
				lnacc = "No Linked Accounts";
			}
			else{//Data Format is: id;m/f;DoB;Pw;[link1][,link2][,...];level,points
				lnacc = data[4].replace(new RegExp('[,]', 'g'), ", ");
			}
			var dynd = {//dynamic data
				"id": data[0],
				"sex": data[1],
				"birth": data[2],
				"pw": data[3],
				"linked_accounts": lnacc,
				"level": level,
				"points": points
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
			"sesL": data.sesL
		};
		aux.dynamic("./session/session-user.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write(page, function(err){res.end();});
		});
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
		var cType = "text/plain";
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
		else{
			// Read the requested file content and send it
			fs.readFile(pathN, function (err, data) {
				if (err) {
					// HTTP Status: 404 : NOT FOUND
					res.writeHead(404, {"Content-Type": 'text/html'});
					// Send the response
					res.end();
				}else{
					aux.debugShout("returning "+pathN+" which is of type "+cType, 3);
					// HTTP Status: 200 : OK
					res.writeHead(200, {"Content-Type": cType});	
					// Write the content of the file to response body
					res.write(data, function(err){res.end();});
				}
			});
		}
	}
	
	//Handle POST requests
	if(req.method == "POST"){
		//console.log(req);
		var body = [];
		req.on('data', function(chunk) {
			body.push(chunk);
		}).on('end', function(){
			var qs = require("querystring");
			body = qs.parse(Buffer.concat(body).toString());
			aux.debugShout("request body:"+ body);
			//Decide what to do with the request based on its source
			switch(pathname){
				case "/register/trainer.html":
					var fN = body.fName;
					var bD = body.birth;
					var pass = body.pWord;
					var passC = body.pWordConf;
					fN = fN.slice(0,1).toUpperCase() + fN.slice(1);//Capitalize First Letter
					
					//Make sure these don't include ; or \n
					if(fN.indexOf(";") != -1 || bD.indexOf(";") != -1 || pass.indexOf(";") != -1)
						ret_error("ice", "/register/trainer.html");//Invalid Character Error
					else if(fN.indexOf("<") != -1 || bD.indexOf("<") != -1 || pass.indexOf("<") != -1)
						ret_error("ice", "/register/trainer.html");
					else if(fN.indexOf(">") != -1 || bD.indexOf(">") != -1 || pass.indexOf(">") != -1)
						ret_error("ice", "/register/trainer.html");
					else{
						if(pass == passC){
							var bD = aux.fixD(bD);
							if(bD == "Error"){
								ret_error("dfe", "register/trainer.html");
								return;
							}
							//Get the next available iD number
							var iD = "t0000";
							fs.readFile("./trainer.data", "utf8", function(err, data){
								if(err){
									ret_error("fe", "/register/trainer.html");
									return;
								}
								var last = data.slice(data.lastIndexOf("<")+1, data.lastIndexOf(">"));
								var lastID = last.split(";")[0];
								var nID = parseInt(lastID.slice(1))+1;
								iD = "t"+aux.fourZ(nID);
								if(iD == "tError")
									ret_error("fe", "/register/trainer.html");
								else{
									var tData = "\n<"+iD+";"+fN+";"+bD+";"+pass+";>";//the empty section is for lnacc
									fs.appendFile("./trainer.data", tData, function(err){
										if(err)
											ret_error("fe", "/register/trainer.html");
										else{
											//console.log("Data: "+tData);
											ret_created(tData);
										}
									});
								}
							});
						}
						else{
							ret_error("pce", "/register/trainer.html");
						}
					}
				break;
				case "/register/user.html":
					var sex = body.sex;
					var bD = body.birth;
					var pass = body.pWord;
					var passC = body.pWordConf;
					//Make sure these don't include ; or \n
					if(bD.indexOf(";") != -1 || pass.indexOf(";") != -1)
						ret_error("ice", "/register/user.html");
					else if(bD.indexOf("<") != -1 || pass.indexOf("<") != -1)
						ret_error("ice", "/register/user.html");
					else if(bD.indexOf(">") != -1 || pass.indexOf(">") != -1)
						ret_error("ice", "/register/user.html");
					else{
						if(pass == passC){
							var bD2 = aux.fixD(bD);
							if(bD2 == "Error"){
								ret_error("dfe", "/register/user.html");
								return;
							}
							//Get the next available iD number
							var iD = "u0000";
							fs.readFile("./user.data", "utf8", function(err, data){
								if(err){
									ret_error("fe", "/register/user.html");
									return;
								}
								var last = data.slice(data.lastIndexOf("<")+1, data.lastIndexOf(">"));
								var lastID = last.split(";")[0];
								var nID = parseInt(lastID.slice(1))+1;
								iD = "u"+aux.fourZ(nID);
								if(iD == "uError")
									ret_error("fe", "/register/user.html");
								else{
									var uData = "\n<"+iD+";"+sex+";"+bD2+";"+pass+";;0,0>";//;links;level,points
									fs.appendFile("./user.data", uData, function(err){
										if(err)
											ret_error("fe", "/register/user.html");
										else
											ret_created(uData);
									});
								}
							});
						}
						else{
							ret_error("pce", "/register/user.html");
						}
					}
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
						case "manageAccount":
						var iD = body.id;
						var pass = body.pWord;
						//This is called by fs.readFile with the loaded account data as an argument (or an error)
						var file = "./";
						if(iD.substr(0,1) == "t")
							file += "trainer.data";
						else if(iD.substr(0,1) == "u")
							file += "user.data";
						else{
							acc_ret("ide");
							aux.debugShout("ID="+iD+" and substr="+iD.substr(0,1)+"\n");
							break;//Exit body.source switch
						}
						if(isNaN(iD.substr(1))){
							acc_ret("ide");
						}
						fs.readFile(file, "utf8", function(err, data){
							if(err)
								acc_ret("fe");
							else{
								var people = aux.dataToEntries(data);
								aux.debugShout("562 "+people, 3);
								var found = false;
								for(i=0; i < people.length; i++){
									if(people[i][0] == iD){
										found = true;
										if(people[i][3] == pass)
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
						case "editA"://Source: Edit {id, (fName/sex), birth, pWord}
							var newAData = aux.toData(body);
							var iD = body.id;
							var file = "./";
							aux.debugShout("Editing "+iD, 1);
							if(iD.substr(0,1) == "t")
								file += "trainer.data";
							else if(iD.substr(0,1) == "u")
								file += "user.data";
							else{
								acc_ret("ide");
								aux.debugShout("ID="+iD+" and letter="+iD.substr(0,1)+"\n");
								break;//Exit body.source switch
							}
							if(isNaN(iD.substr(1))){
								acc_ret("ide");
								break;
							}
							fs.stat(file, function(err, stats){
								if(err){
									acc_ret("fe");
									return;
								}
								fs.open(file, "r+", function(err, fd){
									var buffer = new Buffer(stats.size);
									fs.read(fd, buffer, 0, buffer.length, 0, function(err, bytes, buffer){
										if(err){
											acc_ret("fe");
											fs.close(fd);
											return;
										}
										var data = buffer.toString("utf8", 0, buffer.length);
										var accIndex = data.indexOf("<"+iD);
										var dBefore = data.substring(0, accIndex);
										var dAfter = data.substring(accIndex);
										var endIndex = aux.indexNOf(dAfter, ";", 4);
										dAfter = dAfter.substring(endIndex);//Should include any linked accounts as well (as points for users)
										var newData =  dBefore+ newAData+ dAfter;
										var buffer = new Buffer(newData);
										fs.write(fd, buffer, 0, buffer.length, 0, function(err, bytes){
											if(err){
												acc_ret("fe");
												fs.close(fd);
												return;
											}
											buffer = new Buffer(newData.length);
											fs.read(fd, buffer, 0, buffer.length, 0, function(err, bytes, buffer){
												if(err){
													acc_ret("fe");
													fs.close(fd);
													return;
												}
												var data2 = buffer.toString("utf8", 0, buffer.length);
												var people = aux.dataToEntries(data2);
												var found = false;
												for(i=0; i < people.length; i++){
													if(people[i][0] == iD){
														found = true;
														if(people[i][3] == body.pWord)
															acc_ret(people[i]);//Success - Return manage_account(data)
														else
															acc_ret("pce");//Password Confirmation Error
														break;//Exit for
													}
												}
												if(!found)
													acc_ret("anfe");//Account not found error
												fs.close(fd);
											});
										});;
									});
								});
							});
						break;
						case "addL"://Add Account Link
							var iD = body.id;// body = {source, id, lid, pWord}
							var lID = body.lid;
							var file = "./";
							var lFile = "./";
							aux.debugShout("Editing "+iD, 1);
							if(iD.substr(0,1) == "t"){
								file += "trainer.data";
								lFile += "user.data";
							}
							else if(iD.substr(0,1) == "u"){
								file += "user.data";
								lFile += "trainer.data";
							}
							else{
								acc_ret("ide");//Id format error
								aux.debugShout("ID="+iD+" and substr="+iD.substr(0,1)+"\n");
								break;//Exit body.source switch
							}
							if(lID.substr(0,1) != "t" && lID.substr(0,1) != "u"){
								acc_ret("ide");
								aux.debugShout("lID="+lID+" and substr="+lID.substr(0,1)+"\n");
								break;//Exit body.source switch
							}
							if(isNaN(iD.substr(1)) || isNaN(lID.substr(1))){
								acc_ret("ide");
								break;//Exit body.source switch
							}
							//Check that the user exists
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
								fs.readFile(file, "utf8", function(err, data2){
									if(err){
										acc_ret("fe");
										return;
									}
									//e.g. data2 = "-----<u0000;male;1/1/1;pass;t0001,t0000;0,0>-----"
									var accIndex = data2.indexOf("<"+iD)+1;
									var dAcc = data2.slice(accIndex);
										dAcc = dAcc.slice(0, dAcc.indexOf(">"));
									//Absolute index of the section with the links (+1 for ";")
									var lIndex = 1+accIndex+aux.indexNOf(dAcc, ";", 4);//After the fourth ";"
									var dBefore = data2.slice(0, lIndex);//e.g. "-----<u0000;male;1/1/1;pass;"
									//Later, this will become the data after the links
									var dAfter = data2.slice(lIndex); //e.g. "t0001,t0000;0,0>-----"
									var endIndex = Math.min(dAfter.indexOf(">"), dAfter.indexOf(";"));//End of the link section 
									var dLinks = dAfter.slice(0, endIndex);//e.g. t0000,t0001
										dAfter = dAfter.slice(endIndex);//Includes ";" //e.g. ";0,0>-----"
									
									var newLData = lID;//e.g. "t0002"
									if(dLinks != ""){
										//verify that the account is not already linked
										var linkedAs = dLinks.split(",");//split
											aux.debugShout(linkedAs);
										for(i=0; i<linkedAs.length; i++){
											if(linkedAs[i] == lID){
												var oldAccData = dAcc.split(";");
												acc_ret(oldAccData);
												newLData = "already";
											}
										}
										newLData += ",";
									}
									if(newLData != "already,"){
										newLData += dLinks;//append existing links //e.g. "t0002,t0001,t0000"
										var newData =  dBefore+ newLData+ dAfter;
										//Save the changes. Do it sync so the file doesn't get edited inbetween
										fs.writeFileSync(file, newData, "utf8");
										fs.readFile(file, "utf8", function(err, data3){
											if(err){
												acc_ret("fe");
												return;
											}
											var people = aux.dataToEntries(data3);
											var found = false;
											for(i=0; i < people.length; i++){
												if(people[i][0] == iD){
													found = true;
													if(people[i][3] == body.pWord)
														acc_ret(people[i]);//Success - Return manage_account(data)
													else
														acc_ret("pce");//Password Confirmation Error
													break;//Exit for
												}
											}
											if(!found)
												acc_ret("anfe");//Account not found error
										});
									}//No need for an acc_ret() statement here, it happened earlier
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
							var newSes = require("./session/newSes.js");				
							newSes.new_session(body, function(result){
								switch(result){
									case "ide":
									case "fe":
									case "anle":
									case "pce":
									case "anfe":
										aux.debugShout("error within session.js");
										ret_error(result, "/session/index.html");
									break;
									case "success":
										body.tryN = 0;
										//Go to Link Loading Page
										if(body.id.substring(0,1)=="t")
											ret_link_loading_trainer(body);
										else //b.i.sub() is definitely "u" because the error would have already been caught otherwise
											ret_link_loading_user(body);
									break;
								}
							});
						break;
						case "linkloading-trainer"://source, id, pWord, lid, tryN  tryN is the try number
							if(body.tryN < 30){
								//All the errors for id format have been caught already
								fs.readFile("./session/lnusers.data", "utf8", function(err, data){
									if(err){
										ret_error("fe");
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
													ret_error("fe", "/session/index.html");
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
									if(err){
										ret_error("fe");
									}
									else{
										var searchEntry = "<" +body.id+ "," +body.lid+ ">";
										aux.debugShout("attempting to delete entry: "+searchEntry)
										var iSE = data.indexOf(searchEntry);
										if(iSE == -1){
											ret_error("fe", "/session/index.html");
										}
										else{
											var iSEEnd = iSE + searchEntry.length;
											var newData = data.substring(0, iSE) + data.substring(iSEEnd, data.length);
											fs.writeFileSync("./session/lnusers.data", newData, "utf8");//Cut out entry
											if(body.reqType == 'timeout')
												ret_error("toe", "/session/index.html");
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
										ret_error("fe", "/session/index.html");
								});
							}
						break;
						case "start_session-trainer"://source, id, pWord, lid
							//If aborting, delete the session file - don't bother with archive because it hasn't even started yet
							if(body.reqType == 'leave'){
								var sesFile = "./session/temp/session" + body.id + body.lid + ".data";
								aux.debugShout("1216", 3);
								fs.unlink(sesFile, function(err){
									if(err)
										ret_error("fe");
								});
							}
							else{ //START pressed
								var sesFile = "./session/temp/session"+ body.id + body.lid + ".data";
								//If file does not exist, the user must have left early
								fs.stat(sesFile, function(err){
									if(err){
										if(err.code == "ENOENT"){//user left (or magic ghosts deleted the file){
											ret_requested_file("/session/session-ended.html");
											aux.debugShout("836", 3);
										}
										else
											ret_error("fe","/session/index.html");
									}
									else{//file exists
										//Append "session started at"+time, show Tic Detected, Stop Session butttons
										var sEntry = "session started|" + aux.time();
										fs.appendFile(sesFile, sEntry, function(err){
											if(err)
												ret_error("fe", "/session/index.html");
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
										ret_error("fe");
									}
									else{
										ret_requested_file("/session/session-ended.html");
									}
								});
							}
							else if(body.reqType == 'started'){
								//has the session started
								var searchFile = "./session/temp/session"+ body.lid + body.id + ".data";
								fs.readFile(searchFile, "utf8", function(err, data){
									if(err){
										if(err.code == "ENOENT")//trainer left
											ret_requested_file("/session/session-ended.html");
										else
											ret_error("fe");
										return;
									}
									if(data.indexOf("session started|") == -1){
										//return 'wait'
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("wait", function(err){res.end();});
										return;
									}
									//load level and points from user.data and start session
									fs.readFile("./user.data", "utf8", function(err, data2){
										if(err){
											ret_error("fe");
											return;
										}
										var people = aux.dataToEntries(data2);
										var found = false;
										for(i=0; i < people.length; i++){
											if(people[i][0] == body.id){
												found = true;
												if(people[i][3] == body.pWord){
													var lpData = people[i][5].split(",");
													body.level = lpData[0];
													body.points = lpData[1];
													var startLPEntry = "\nstarting user level,points|"+ lpData[0]+","+lpData[1];
													fs.appendFile(searchFile, startLPEntry, function(err){
														if(err){
															ret_error("fe");
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
											aux.debugShout("anfe 1496");
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
											ret_error("fe");
										else{
											res.writeHead(200, {"Content-Type": "text/plain"});
											res.write("good", function(err){res.end();});
										}
									});
								}
								//File does not exist. 
								//This happens when the user has ended the session already
								else if(err.code == "ENOENT"){
									ret_requested_file("/session/session-ended.html");
								}
								else//Some other error
									ret_error("fe", "/session/index.html");
							});
							
						break;
						case "session-user"://body: source, id, pWord, lid
							//Requests made from the ongoing user session
							/*Check the session file here for tic detected or session ended*/
							var lpEntry = "\nuser level,points|" +body.level+ "," +body.points + "|" +aux.time();
							var oldL = body.sesL;
							var sesFile = "./session/temp/session"+ body.lid + body.id + ".data";
							fs.appendFile(sesFile, lpEntry, function(err){
								if(err){
									ret_error("fe");
									return;
								}
								fs.readFile(sesFile, "utf8", function(err, data){
									if(err){
										ret_error("fe");
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
											case "user level,points":
											break;
											default:
												retMessage += "&?";
											break;
										}
									}
									res.writeHead(200, {"Content-Type": "text/plain"});
									res.write(retMessage, function(err){res.end();});
								});
							});
						break;
						case "session_end-trainer":
							aux.debugShout("1393", 3);
							var sesFile = "./session/temp/session" + body.id + body.lid + ".data";
							var eEntry = "\nsession ended|"+aux.time();
							fs.stat(sesFile, function(err, stats){
								if(err == null){//File exists
									aux.debugShout("1398", 3);
									fs.appendFile(sesFile, eEntry, function(err){//should I also archive it? No, the user needs to save their new points and level
										if(err)
											ret_error("fe");
										else{
											ret_requested_file("/session/session-ended.html");
										}
									});
								}
								//File does not exist. 
								//This happens when the user has ended the session already
								else if(err.code == "ENOENT"){
									ret_requested_file("/session/session-ended.html");
								}
								else//Some other error
									ret_error("fe", "/session/index.html");
							});
						break;
						case "session_end-user":
							var sesFile = "./session/temp/session" + body.lid + body.id + ".data";
							var sF2 = "./session/archive/session" + body.lid + body.id + aux.time("forfile") + ".data";
							var uFile = "./user.data";
							//save user l & p
							fs.readFile(uFile, "utf8", function(err, data){
								if(err){
									ret_error("fe");
									return;
								}
								var accIndex = data.indexOf("<"+body.id)+1;
								var aData = data.slice(accIndex);
									aData = aData.slice(0, aData.indexOf(">"));
								var pass = aData.split(";")[3];
								if(body.pWord != pass){
									aux.debugShout("body.pword= "+body.pWord+"; pass= "+pass);
									ret_error("pce");
									return;
								}
								var lpIndex = 1+accIndex + aux.indexNOf(data.slice(accIndex), ";", 5);//Index of the level and points info
								var afterlp = accIndex + Math.min(aux.indexNOf(data.slice(accIndex), ";", 6), data.slice(accIndex).indexOf(">"));
								var dBefore = data.slice(0, lpIndex);
								var dAfter = data.slice(afterlp);
								var newLp = body.level + "," + body.points;
								var newData = dBefore + newLp + dAfter;
								fs.writeFileSync(uFile, newData, "utf8");//If you let the edit be postponed, it could be edited inbetween. 
								//End and archive session
								fs.readFile(sesFile, "utf8", function(err, data){
									if(err){
										ret_error("fe");
										return;
									}
									if(data.indexOf("session ended") == -1){
										var eEntry = "\nsession ended|"+aux.time();
										fs.appendFile(sesFile, eEntry, function(err){
											if(err){
												ret_error("fe");
												return;
											}
											//Archive the session file under a new name
											fs.rename(sesFile, sF2, function(err){
												if(err){
													ret_error("fe");
												}
												else{
													/**append report*/
													fs.readFile(sF2, "utf8", function(err, data){
														if(err){
															ret_error("fe");
															return;
														}
														fs.appendFile(sF2, aux.genReport(data), function(err){
															if(err)
																ret_error("fe");
															else
																ret_requested_file("/session/session-ended.html");
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
												ret_error("fe");
											}
											else{
												/**append report*/
												fs.readFile(sF2, "utf8", function(err, data){
													if(err){
														ret_error("fe");
														return;
													}
													fs.appendFile(sF2, aux.genReport(data), function(err){
														if(err)
															ret_error("fe");
														else
															ret_requested_file("/session/session-ended.html");
													});
												});
											}
										});
									}
								});
							});
						break;
					}
				break;
			}
		});
	}
	else{
		ret_requested_file(pathname);
	}
}

//Create server using handleRequest
var server = http.createServer(handleRequest);

//Start server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening.
    console.log("Server listening on: http://localhost:" + PORT);
});