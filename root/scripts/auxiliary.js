var fs = require("fs");

const debugging = 2;//depth of debugging: 0,1,2,3

/**Exported Functions
*/
module.exports.dynamic = dynamic;
module.exports.editData = editData0;//stable version, could be updated later
module.exports.indexNOf = indexNOf;
module.exports.isID = isID;
//module.exports.fixD = fixD;
//module.exports.fourZ = fourZ;
module.exports.parse36ToDec = parse36ToDec;
module.exports.decTo36 = decTo36;
module.exports.dataToEntries = dataToEntries;
module.exports.sort2d = sort2d;
module.exports.genReport = genReport;
module.exports.toData = toData;
module.exports.time = time;
module.exports.debugShout = debugShout;
module.exports.log_error = log_error;

//Conversions
const c_36d = "0123456789abcdefghijklmnopqrstuvwxyz";

/*
	load and edit a dynamic html file (.dynh is my extension for it)
	data is an object with all the needed fields
	callback is the callback function. returned with edited_page
	throws "se", "fe" to callback
*/
function dynamic(template_path, data, callback){
	if(template_path.slice(0,2) != "./"){
		if(template_path.slice(0,1) != "/")// "abc/def.ghi"
			template_path = "./"+ template_path;
		else// "/abc/def.ghi"
			template_path = "."+ template_path;
	}
	var edited_page = "";
	var extension = template_path.slice(template_path.lastIndexOf("."));
	if(extension != ".dynh"){
		//not actually a dynamic file
		debugShout("hey, that's not dynamic", 1);
		callback(file_text);//return file as is
		return;
	}
	fs.readFile(template_path, "utf8", function(err, file_text){
		if(err){
			callback("fe");
			return;
		}
		var next_index = file_text.indexOf("**[");//non_absolute
		if(next_index == -1){
			//not actually a dynamic file
			debugShout("hey, that's not dynamic", 1);
			callback(file_text);
			return;
		}
		var file_left = file_text;
		//replace every instance of "**[x]**" with data.x
		while(next_index != -1){
			edited_page += file_left.slice(0, next_index);
			var dyn_field = file_left.slice(next_index+3, file_left.indexOf("]**"));
			if(data[dyn_field] != undefined){
				edited_page += data[dyn_field];
				file_left = file_left.slice(file_left.indexOf("]**")+3);
				next_index = file_left.indexOf("**[");
			}
			else{
				debugShout("Server error, not enough data supplied. It wanted '"+dyn_field+"'", 1);
				callback("se");
				return;
			}
		}
		edited_page += file_left;//after the last dynamic field
		callback(edited_page);
	});
}
/*
	editData0 is almost ready {-works right now.-}
	editData is hopeful.

	edit the given data file
	data files are of the format 
		<asdf;asdf;adsf;asdf;asdf>\n
		<asdf;asdf;asdf>\n
		<asdf;asdf;asdf>
	The first value is generally an identifier (e.g. "t0")
	args:
		file - data file to edit - "file.data"
		entryID - the value which describes the entry to be edited (the first value)
		fldInd - which value index to edit <0,1,2,3>
		newVal - new value or 
			a function which is passed the whole old entry and returns the new value
		callback - callback function. Returns entryData.
*/
function editData0(file, entryID, fldInd, newVal, callback){
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
		var iF = indexNOf(entryData, ";", fldInd) + 1;
		var iFE = indexNOf(entryData, ";", fldInd+1);
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
		fs.writeFileSync(file, newData);
		
		callback(null, entryData);
	});
}
function editData(file, entryID, fldInd, newVal, callback){
	if(file.slice(file.lastIndexOf(".")) != ".data"){
		callback("se", "not a data file");
		return;
	}//implied else
	var rs = fs.createReadStream(file, { encoding: "utf8" });
	rs.on('readable', () => {
		//Already processed characters, to be returned to the file
		var readChars = new LList();
		var curChar;
		var found = false;
		/*	curFldInd:
			-1:	no data
			0:	in id
			1:	in field #1
			n:	in field #n
		*/
		var curFldInd = -1;//current field index
		//var curEntryID = "";
		var curVal = "";
		while ( (curChar = rs.read(1)) !== null ) {
			if(!found){
				switch(curChar){
					case "<":
						curFldInd = 0;
						curVal = "";
						readChars.add(curChar);
					break;
					case ";":
						if(curFldInd === 0){//curVal has a complete id
							if(curVal === entryID)
								found = true;
						}
						curFldInd++;
						readChars.add(curChar);
					break;
					default:
						if(curFldInd === 0){
							curVal += curChar;
						}
					break;
				}
			}
			
			
			
			
			
			
			
			
			
			
			switch(curChar){
				case "<":
					curEntryID = "";
					curFldInd = 0;//I'm looking at the current entry id now
					readChars.add(curChar);
				break;
				case ";":
					if(curFldInd === 0){// I now have a whole id in curVal
						if(curVal === entryID){//FOUND!
							found = true;
						}
					}
					if(found){
						if(curFldInd === fldInd){// I now have the target field in curVal
							if(typeof(newVal) === "function"){
								readChars.addStringAsChars(newVal(curVal));
							}
							else{
								readChars.addStringAsChars(newVal);
							}
						}
					}
					curFldInd++;
					readChars.add(curChar);
				break;
				case ">":
					curFldInd = -1;
				break;
				default:
					switch(curFldInd){//decide what to do with curChar
						case -1:
						break;
						case 0:
							curEntryID += curChar;
						break;
						default:
						break;
					}
				break;
			}
		}
  });
	/*
	
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
							});
						break;
	*/
}

//Find the nth occurence of a substring (1 index)
function indexNOf(string, search, nth){//t0000;Jonathan;05/20/1999;h;u0000;
	var i1 = string.indexOf(search);
	if(nth == 1){
		return i1;
	}//Implied else
	var cutS = string.slice(i1+1);//Don't include first "search"
	var lenBefore = i1+1;
	for(i = 2; i < nth; i++){//if i > 2
		var iN = cutS.indexOf(search);
		if(iN == -1){
			return -1;
		}
		lenBefore += iN+1;
		cutS = cutS.slice(iN+1);
	}
	return lenBefore + cutS.indexOf(search);
}
function isID(testID){
	if(testID === undefined)
		return false;
	if(testID.length < 2)
		return false;
	
	testID = testID.toLowerCase();//make non case sensitive
	
	var p1 = testID[0];
	if(p1 != "t" && p1 != "u")
		return false;
	var p2 = testID.slice(1);
	for(var i = 0; i < p2.length; i++){
		if(c_36d.indexOf(p2[i]) < 0)
			return false;
	}
	return testID;
}
//take a string, parse it to base 36, convert it to a dec int
function parse36ToDec(str36){
	var n=0;
	var power=0;
	for(var i = str36.length-1; i>= 0; i--){
		n+= c_36d.indexOf(str36[i]) * Math.pow(36, power);
		power++;
	}
	return n;
}
function decTo36(dec){
	var rem = 0;
	var b36 = "";
	while(dec > 0){
		rem = dec % 36;
		b36 = c_36d[rem] + b36;
		dec = Math.floor(dec/36);
	}
	return b36;
}
//Takes the string of a data file and returns an array of entry arrays
function dataToEntries(data){
	var entries = [];
	var current = "";
	var entryN = 0;
	var lookingAtData = false;
	debugShout("converting "+data+ "to entries", 3);
	for(var i = 0; i< data.length; i++){
		debugShout(" "+data[i], 3);
		switch(data[i]){
			case "<":
				lookingAtData = true;
			break;
			case ">":
				entries[entryN] = current.split(";");
				current = "";
				lookingAtData = false;
				entryN++;
			break;
			default:
				if(lookingAtData)
					current+= data[i];
			break;
		}
	}
	return entries;
}

//returns a sorted copy of the given 2d array. Sorted by the goven column
//data in sortColumn should be numerical
function sort2d(inArray, sortColumn){
	var aCopy = inArray.slice();
	var res_table = [];
	while(aCopy.length > 0){
		var biggest = [0,0];//index,sortVal
		for(var i = 0; i < aCopy.length; i++){
			var valHere = parseInt(aCopy[i][sortColumn]);
			if(valHere === NaN)
				return "ice";
			debugShout("valHere is: "+valHere, 3);
			debugShout("current overlord is: "+biggest, 3);
			if(valHere > biggest[1]){
				biggest = [i, valHere];
				debugShout("new tallest crowned: "+biggest, 3);
			}
		}
		debugShout("biggest is: "+biggest,3);
		res_table.push(aCopy[biggest[0]]);
		aCopy.splice(biggest[0], 1);//cut out the biggest
	}
	return res_table;
}

//Generates a report for the end of a session
function genReport(data){
	var tics = 0, tenSIntervals = 0, longestInterval = 0;
	var initL = 0, initP = 0, initT;
	var endL, endP, endT;
	var lastTic;
	var entries = data.split("\n");
	for(var i = 0; i<entries.length; i++){
		var entryParts = entries[i].split("|");
		switch(entryParts[0]){
			case "session started":
				initT = new Date(entryParts[1]);
				lastTic = initT;
			break;
			case "starting user l,p,c":
				initL = entryParts[1].split(",")[0];
				initP = entryParts[1].split(",")[1];
			break;
			case "tic detected":
				tics++;
				var ticTime = new Date(entryParts[1]);
				var ticFree = ticTime - lastTic;
				lastTic = ticTime;
				if(ticFree > longestInterval)
					longestInterval = ticFree;
				tenSIntervals += Math.floor(ticFree / 1e4);
			break;
			case "session ended":
				endT = new Date(entryParts[1]);
			break;
			case "user l,p,c":
				endL = entryParts[1].split(",")[0];
				endP = entryParts[1].split(",")[1];
			break;
			default:
				return "Error: unknown entry: "+entries[i];
			break;
		}
	}
	if(endL > initL){//add the subtracted points to the point total
		for(var i = initL; i<endL; i++){
			endP += 1000*i*i;//1000L^2 = nextLevel
		}
	}
	if(tics == 0){
		longestInterval = endT - initT;
	}
	debugShout("start: "+initT+". end: "+endT);
	var report = "\n****************\nReport:";
	report += "\nsession length|"+ (endT - initT);
	report += "\nlevels gained|"+ (endL - initL);
	report += "\npoints earned|"+ (endP - initP);
	report += "\nnumber of tics|"+ tics;
	report += "\nlongest tic free interval|"+ longestInterval;
	report += "\nnumber of 10s tic free intervals|"+ tenSIntervals;
	return report;
}
/*return a data entry for the given account data object (up until the links)
*/
function toData(body){//id, (fName/sex), birth, pWord
	var data = "<";
	data += body.id+ ";";
	if(body.fName)
		data += body.fName+ ";";
	else if(body.sex)
		data += body.sex+ ";";
	else
		return "fe";//should be something else. Incomplete form submission?
	//if(fixD(body.birth) == "Error")
	//	return "dfe";
	
	//data += fixD(body.birth)+ ";";
	data += body.birth+ ";";
	data += body.pWord;
	return data;
}
function time(type){
	var d = new Date();
	switch(type){
		case "forfile"://YYYY-MM-DD-hh-mm-ss
			return d.getFullYear()+"."+(d.getMonth()+1)+"."+d.getDate()+
				"-"+d.getHours()+"."+d.getMinutes()+"."+d.getSeconds();
		break;
		case "millis":
			return d.now();
		case "ISO":
		default:
			return d.toISOString();
		break;
	}
}
function debugShout(message, depth){//d0 always show, d1 first level debugging, d2 deep debugging (default)
	if(depth){
		if(debugging >= depth)
			console.log(message);
	}
	else{
		if(debugging > 1)
			console.log(message);
	}
}
function log_error(error_type, message){
	message = message || "-";
	var eEntry = "\n<"+error_type+";"+time()+";"+message+">";
	fs.appendFile("./error/log.data", eEntry, function(err){});
}
/*
Define a linked list class
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


/**

OLD:

*/


//Fix a date string to 11/11/2011 format. May return "Error"
function fixD(d){
	var date;
	var e = "Error";
	var parts = d.split("/");
	if(parts.length != 3){
		parts = d.split("-");
		if(parts.length != 3){
			parts = d.split(".");
			if(parts.length != 3)
				return e;//You can't split it by "-" or "/" to get 3 parts
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


							/*
							
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