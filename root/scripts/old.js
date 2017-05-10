
/** 
Used to be at the bottom of auxiliary.js
OLD:
*/

/**
	edit the given *.data file
	data files are of the format 
		<asdf;asdf;adsf;asdf;asdf>\n
		<asdf;asdf;asdf>\n
		<asdf;asdf;asdf>
	The first value is generally an identifier (e.g. "t0")
	args:
		file - data file to edit - "file.data"
		entryID - the value which identifies the entry to be edited (index 0)
		fldInd - which field index to edit <0,1,2,3>
		newVal - either the new value which will replace the indicated field 
			or a function which is passed the whole old entry and returns the new value (or "<cancel>")
		callback - callback function. Called with (err, entryData).
*/
function editData(file, entryID, fldInd, newVal, callback){
	if(file.slice(file.lastIndexOf(".")) != ".data"){
		callback("se", "not a data file");
		return;
	}//implied else
	fs.readFile(file, "utf8", function(err, data){
		if(err){
			callback("fe");
			return;
		}
		var entryIndex = data.indexOf("<"+entryID) + 1;
		var entryData = data.slice(entryIndex);
			entryData = entryData.slice(0, entryData.indexOf(">"));
		//field index
		var iF = indexNOf(entryData, ";", fldInd) + 1;//Start after semicolon
		var iFE = indexNOf(entryData, ";", fldInd+1);//End before next ";"
		debugShout("ife"+iFE+"|if"+iF);
		if(iFE < iF){//last field
			iFE = entryData.length;
		}
		if(typeof(newVal) === "function"){
			var nv = newVal(entryData.split(";"));
			if(nv === "<cancel>"){
				callback("canceled");
				return;
			}
			else{
				entryData = entryData.slice(0,iF) + 
					nv + 
					entryData.slice(iFE);
			}
		}
		else{
			entryData = entryData.slice(0,iF) + 
				newVal + 
				entryData.slice(iFE);
		}
		var dBefore = data.slice(0, entryIndex);
		var dAfter = data.slice(entryIndex);
			dAfter = dAfter.slice(dAfter.indexOf(">"));
		var newData = dBefore + entryData + dAfter;
		/*Sync is used here because we're editing.
			We don't want someone else editing it inbetween.
			Maybe if I used fs.open and fd it would work non-sync as well.
		*/
		fs.writeFileSync(file, newData); 
		callback(null, entryData);
	});
}
/**New, unfinished version of editData
	The goal here was to use less RAM by using streams
	Parsing through the file one character at a time 
		is precisely what I'm trying to do anyway.
	I was also imagining that it would allow the file to be edited by	
		multiple people at the same time, but that's not true. Once you open 
		the file it blocks out anyone else until you're done.
	The thing is, it's causing me lots of trouble. 
	Reading and writing to the same file at the same time is causing some issues,
		and I'll need to truncate at the end.
	Speed-wise, I'd guess that the old way is faster too.
	Moving forwards: 
	There's got to be a way to do it though. Make an edit scheduler that keeps track 
		of the changes that need to be made, then makes them. I'm worried two people 
		will finish a session at the same time and one will lose data and get an error.
	Maybe just write to a new file, then delete the old and rename the new.
		I'd worry again about losing someone's data.
	Maybe I should switch over to some sort of mySQL database.
		Or (idea): make a folder with one file for each user. "t0.data" etc.
*/
function editData_unfinished(file, entryID, fldInd, newVal, callback){
	if(file.slice(file.lastIndexOf(".")) != ".data"){
		callback("se", "not a data file");
		return;
	}//implied else
	var rs = fs.createReadStream(file, { encoding: "utf8" });
	var ws = fs.createWriteStream(file, { flags: "r+" });
	rs.on('readable', () => {
		//Already processed characters, to be returned to the file
		//var readChars = new LList();
		var curChar;
		var found = false;
		var inTargetEntry = false;
		/*curFldInd: Current Field Index 
			Describes the type of content the current character is holding
			File: <0,1,2,...> -1 <0,1,...> -1 <0,...
			-1:	no data
			0:	in id
			1:	in field #1
			n:	in field #n
		*/
		var curFldInd = -1;
		//var curEntryID = "";
		var curVal = "";
		while ( (curChar = rs.read(1)) !== null ) {
			/* Version 1 
		//Already processed characters, to be returned to the file
		//var readChars = new LList();
			if(!inTargetEntry){
				switch(curChar){
					case "<":
						curFldInd = 0;
						curVal = "";
						readChars.add(curChar);
					break;
					case ";":
						if(curFldInd === 0){//curVal has a complete id
							if(curVal === entryID){
								inTargetEntry = true;
								if(fldInd === 0){//Replace the id
									readChars.addStringAsChars( ... newVal thing ... )//!!!CUIDADO!!!
								}
							}
						}
						curFldInd++;
						readChars.add(curChar);
					break;
					default:
						if(curFldInd === 0){
							curVal += curChar;
							//Here, it's not immediately returned to readChars
							//because we might be looking at data in the target entry,
							//so it might be the thing we want to replace.
							
						}
						else{
							readChars.add(curChar);
						}
					break;
				}
			}
			else{//Within the target entry now. Read more carefully.
				
			}*/
			
			/* (Better, I think) Version 2 */
			
			switch(curChar){
				case "<":
					curVal = "";
					curFldInd = 0;//I'm looking at the current entry's id now
					ws.write("<");
				break;
				case ";":
					/*If you're inTargetEntry or you just read an id (curFldInd == 0)
						Then curVal holds something meaningful 
							that hasn't been added to readChars yet
						Besides those two cases, 
						curVal isn't even used; characters are just added one at a time.
					*/
					if(curFldInd == 0){// I now have a whole id in curVal
						if(curVal == entryID){
							//FOUND! This is the entry to be edited
							found = true;
							inTargetEntry = true;
						}
						else{
							ws.write(curVal);
						}
					}
					//This should NOT be an 'else if', and the order is important
					if(inTargetEntry){
						if(curFldInd == fldInd){
							/*I now have the target field in curVal.
								Insert the newVal here
							*/
							//I think I'm okay with this, though it's atypical to edit a parameter
							if(typeof(newVal) == "function")
								newVal = newVal(curVal); 
							ws.write(newVal);
						}
						else{
							ws.write(curVal);
						}
					}
					curVal = "";
					curFldInd++;
					ws.write(";");
				break;
				case ">":
					curFldInd = -1;
					inTargetEntry = false;
					/*'>' should always be followed by '\n' 
						By doing this, I can toss out anything outside of <~>
					*/
					ws.write(">\n");
				break;
				//If it's not one of these special characters (< ; >), then...
				default:
					switch(curFldInd){//decide what to do with curChar
						case -1: 
							/*curChar is garbage or '\n'
								The newLine is covered by the ">\n" above
							*/
						break;
						case 0:
							//IDs need to be stored in the curVal buffer, not written immediately
							curVal += curChar;
						break;
						default:
							if(inTargetEntry)
								curVal += curChar;
							else
								ws.write(curChar);
						break;
					}
				break;
			}
		}
		callback(null, "");
  });
}

/**Define a linked list class.
	I was going to use this in editData, but I don't think I'm using it.
*/
function Node(data) {
	this.data = data;
	this.next = null;
}
function LList() {//Should this actually be called a Queue technically?
	this.length = 0;
	this.head = null;
	this.tail = null;
}
LList.prototype.add = function(value){
	var node = new Node(value);
	if(!this.tail || !this.head){
		this.head = node;
		this.tail = node;
	}
	else{
		this.tail.next = node;
		this.tail = node;
	}
	this.length++;
	return node;
};
LList.prototype.addStringAsChars = function(str){
	var charArray = str.split("");
	for(var i = 0; i< charArray.length; i++){
		this.add(charArray[i]);
	}
	return charArray;
};

/**Fix a date string to "MM/DD/YYYY" format. May return "Error"
	Handels date strings split by ".", "-", or "/"
*/
function fixD(d){
	var date;
	var e = "Error";
	var parts = d.split("/");
	if(parts.length != 3){
		parts = d.split("-");
		if(parts.length != 3){
			parts = d.split(".");
			if(parts.length != 3)
				return e;//You can't split it by ".", "-", or "/" to get 3 parts
		}
	}//At this point, parts.length = 3
	
	//Month
	var mo = parts[0];
	if(isNaN(mo))
		return e;
	var moN = parseInt(mo);
	if(moN<1 || moN>12)
		return e;
	if(mo.length == 1)//Turn 5/20/99 into 05/20/1999
		date = "0"+mo;
	else if(mo.length == 2)
		date = mo;
	else
		return e;
	
	date+= "/";
	//Day
	var day = parts[1];
	if(isNaN(day))
		return e;
	var daN = parseInt(day);
	if(daN<1 || daN>31)
		return e;
	if(day.length == 1)
		date+= "0"+day;
	else if(day.length == 2)
		date+= day;
	else
		return e;
	
	date+= "/";
	//Year
	var now = new Date();
	var year = parts[2];
	if(isNaN(year))
		return e;
	if(year.length == 2){
		if(parseInt(year)+2000 < now.getFullYear())
			date += "20"+year;
		else
			date += "19"+year;
	}
	else if(year.length == 4){
		if(parseInt(year) > now.getFullYear())
			return e;
		date += year;
	}
	else//length != 2 || 4
		return e;
	//Everything went well
	return date;
}

/*Takes two objects:
head={title[, sub][, bodytag]}
main={[content]} (All strings)
*/
function genPage(head, main){
	var page = 
	"<html id='entire-page'>"+
	"<head>"+
		"<title>"+head.title+"</title>"+
		"<meta name='viewport' content='width=device-width, initial-scale=1'>"+
		"<link rel='stylesheet' type='text/css' href='/stylesheets/bgStyle.css'>"+
	"</head>";
	if(head.bodytag)
		page+= "<body "+head.bodytag+">";
	else
		page+= "<body>";
	
	page+= 
	"<section class='page-header'>"+
		"<div class='header-navbar'>"+
			"<a href='/' class='logo'></a>"+
			"<h1>"+head.title+"</h1>";
	if(head.sub)
		page += "<h2>"+head.sub+"</h2>";
	
	page+=	
		"<div style='clear: both;'></div>\n"+
		"</div>"+
	"</section>";
	if(main.content){
		page+= 
	"<section class='main-content' id='mainC'>"+
		main.content+
	"</section>";
	}
	page+="</body>"+
	"</html>";
	return page;
}

//["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
/*
const c_36d = {
	"0": 0,
	"1": 1,
	"2": 2,
	"3": 3,
	"4": 4,
	"5": 5,
	"6": 6,
	"7": 7,
	"8": 8,
	"9": 9,
	"a": 10,
	"b": 11,
	"c": 12,
	"d": 13,
	"e": 14,
	"f": 15,
	"g": 16,
	"h": 17,
	"i": 18,
	"j": 19,
	"k": 20,
	"l": 21,
	"m": 22,
	"n": 23,
	"o": 24,
	"p": 25,
	"q": 26,
	"r": 27,
	"s": 28,
	"t": 29,
	"u": 30,
	"v": 31,
	"w": 32,
	"x": 33,
	"y": 34,
	"z": 35
};*/


							/* Trying to use "r+"
							
								pathname: "/account/index.html"
								source: "editP"
								
		
							fs.stat(file, function(err, stats){//In order to get stats.size. Also to check it exists.
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
										var accIndex = data.indexOf("<"+iD) + 1;
										var accData = data.slice(accIndex);
											accData = accData.slice(0, accData.indexOf(">"));
										//index of pw and pw end
										var iPW = accData.indexOf(";")+1;
										var iPWE = aux.indexNOf(accData, ";", 2);
											
										if(accData.slice(iPW, iPWE) != opw){
											acc_ret("pce");
											fs.close(fd);
											return;
										}
										accData =  accData.slice(0, iPW)+ pw +accData.slice(iPWE);
										var dBefore = data.substring(0, accIndex);
										var dAfter = data.substring(accIndex);
											dAfter = dAfter.slice(dAfter.indexOf(">"));
										var newData =  dBefore+ accData+ dAfter;
										
										var buffer = new Buffer(newData);
										fs.write(fd, buffer, 0, buffer.length, 0, function(err, bytes){
											if(err){
												acc_ret("fe");
												fs.close(fd);
												return;
											}
											var people = aux.dataToEntries(newData);
											var found = false;
											for(i=0; i < people.length; i++){
												if(people[i][0] == iD){
													found = true;
													if(people[i][1] == pw)
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
									});
								});
							});*/
							
								/*
								pathname: "/account/index.html"
								source: "addL"
								
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
											var data2 = buffer.toString("utf8", 0, buffer.length);
											//e.g. data2 = "-----<t0;h;1999;u0,u1[;M;0,0]>-----"
											var accIndex = data2.indexOf("<"+iD)+1;
											var dAcc = data2.slice(accIndex);
												dAcc = dAcc.slice(0, dAcc.indexOf(">"));
											//Check password - this would only trigger if someone is hacking (you needed the password when you loaded this dynh)
											if(body.pWord != dAcc.split(";")[1]){
												acc_ret("pce");
												fs.close(fd);
												return;
											}
											//Absolute index of the section with the links (+1 for ";")
											var lIndex = 1 + accIndex + aux.indexNOf(dAcc, ";", 3);//After the third ";"
											var dBefore = data2.slice(0, lIndex);//e.g. "-----<t0;h;1999;"
											//Later, this will become the data after the links
											var dAfter = data2.slice(lIndex); //e.g. "u0,u1[;M;0,0]>-----"
											var endIndex = Math.min(dAfter.indexOf(">"), dAfter.indexOf(";"));//End of the link section 
											if(endIndex == -1)
												endIndex = dAfter.indexOf(">");
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
												//Save the changes.
												var buffer = new Buffer(newData);
												fs.write(fd, buffer, 0, buffer.length, 0, function(err, bytes){
													if(err){
														acc_ret("fe");
														fs.close(fd);
														return;
													}
													var people = aux.dataToEntries(newData);
													var found = false;
													for(i=0; i < people.length; i++){//Some of this is probably redundant
														if(people[i][0] == iD){
															found = true;
															if(people[i][1] == body.pWord)
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
											}//No need for an acc_ret() statement here, it happened earlier
											
										});
									});
									
								});*/
								
								/*
								
								"session_end-user"
								
							
							fs.readFile(uFile, "utf8", function(err, data){
								if(err){
									ret_error("fe", "/session/index.html", "session_end-user: read uFile");
									return;
								}
								var accIndex = data.indexOf("<"+body.id)+1;
								var aData = data.slice(accIndex);
									aData = aData.slice(0, aData.indexOf(">"));
								var pass = aData.split(";")[1];
								if(body.pWord != pass){
									aux.debugShout("body.pword= "+body.pWord+"; pass= "+pass);
									ret_error("pce");
									return;
								}
								var lpIndex = 1+accIndex + aux.indexNOf(data.slice(accIndex), ";", 5);//Index of the level and points info
								var afterlp = lpIndex + Math.min(data.slice(lpIndex).indexOf(";"), data.slice(lpIndex).indexOf(">"));
								if(afterlp < lpIndex)//last user, no ";" found (-1)
									afterlp = lpIndex + data.slice(lpIndex).indexOf(">");
								var dBefore = data.slice(0, lpIndex);
								var dAfter = data.slice(afterlp);
								var newLp = body.level + "," + body.points + "," + body.coins;
								var newData = dBefore + newLp + dAfter;
								fs.writeFileSync(uFile, newData, "utf8");//If you let the edit be postponed, it could be edited inbetween. 
								*/
								
		/*
		"savelpc"
		
		
							fs.stat(uFile, function(err, stats){
								if(err){
									ret_error("fe", "/session/index.html", "savelpc: read uFile");
									return;
								}
								fs.open(uFile, "r+", function(err, fd){
									var buffer = new Buffer(stats.size);
									fs.read(fd, buffer, 0, buffer.length, 0, function(err, bytes, buffer){
										if(err){
											ret_error("fe", "/session/index.html", "savelpc: read uFile");
											fs.close(fd);
											return;
										}
										var data = buffer.toString("utf8", 0, buffer.length);
										var accIndex = data.indexOf("<"+body.id)+1;
										var aData = data.slice(accIndex);
											aData = aData.slice(0, aData.indexOf(">"));
										var pass = aData.split(";")[1];
										if(body.pWord != pass){
											ret_error("pce", "/session/index.html", "savelpc: body.pword= "+body.pWord+"; pass= "+pass);
											fs.close(fd);
											return;
										}
										var lpIndex = 1+accIndex + aux.indexNOf(data.slice(accIndex), ";", 5);//Index of the level and points info
										var afterlp = lpIndex + Math.min(data.slice(lpIndex).indexOf(";"), data.slice(lpIndex).indexOf(">"));
										if(afterlp < lpIndex)//last user, no ";" found (-1)
											afterlp = lpIndex + data.slice(lpIndex).indexOf(">");
										var dBefore = data.slice(0, lpIndex);
										var dAfter = data.slice(afterlp);
										var newLp = body.level + "," + body.points + "," + body.coins;
										var newData = dBefore + newLp + dAfter;
										//SAVE
										var buffer = new Buffer(newData);
										fs.write(fd, buffer, 0, buffer.length, 0, function(err, bytes){
											if(err){
												ret_error("fe", "/session/index.html", "savelpc: save uFile");
												fs.close(fd);
												return;
											}
											fs.close(fd);
										});//write
									});//read
								});//open
							});//stat
		*/
