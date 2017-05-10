
						case "addL"://Add Account Link
							var iD = body.id;// body = {source, id, lid, pWord}
							var lID = body.lid;
							var file = "./";
							var lFile = "./";
							aux.debugShout("Editing " + iD, 1);
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
								aux.debugShout("531");
								break;//Exit body.source switch
							}
							if(lID.substr(0,1) != "t" && lID.substr(0,1) != "u"){
								acc_ret("ide");
								aux.debugShout("lID="+lID+" and substr="+lID.substr(0,1)+"\n");
								break;
							}
							if(isNaN(iD.substr(1)) || isNaN(lID.substr(1))){
								acc_ret("ide");
								break;
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
									//e.g. data2 = "-----<t0;h;1999;u0,u1[;M;0,0]>-----"
									var accIndex = data2.indexOf("<"+iD)+1;
									var dAcc = data2.slice(accIndex);
										dAcc = dAcc.slice(0, dAcc.indexOf(">"));
									//Absolute index of the section with the links (+1 for ";")
									var lIndex = 1 + accIndex+aux.indexNOf(dAcc, ";", 3);//After the third ";"
									var dBefore = data2.slice(0, lIndex);//e.g. "-----<t0;h;1999;"
									//Later, this will become the data after the links
									var dAfter = data2.slice(lIndex); //e.g. "u0,u1[;M;0,0]>-----"
									var endIndex = Math.min(dAfter.indexOf(">"), dAfter.indexOf(";"));//End of the link section 
									var dLinks = dAfter.slice(0, endIndex);//e.g. t0000,t0001
										dAfter = dAfter.slice(endIndex);//Includes ";" //e.g. "[;M;0,0]>-----"
									
									var newLData = lID;//e.g. "t2"
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
						
						
						
						
						
						