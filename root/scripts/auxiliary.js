var fs = require("fs");

//depth of debugging: 0(none), 1, 2, 3
const debugging = 2;

/**Exported Functions
*/
module.exports.dynamic = dynamic;
module.exports.indexNOf = indexNOf;
module.exports.isID = isID;
module.exports.parse36ToDec = parse36ToDec;
module.exports.decTo36 = decTo36;
module.exports.dataToEntries = dataToEntries;
module.exports.editAcc = editAcc;
module.exports.loadAcc = loadAcc;
module.exports.loadAllUsers = loadAllUsers;
module.exports.getNextID = getNextID;
module.exports.newU = newU;
module.exports.newT = newT;
module.exports.sort2d = sort2d;
module.exports.genReport = genReport;
module.exports.time = time;
module.exports.debugShout = debugShout;
module.exports.log_error = log_error;

//Used to convert between b36 (a-z) and decimal
const c_36d = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
	load and fill in a dynamic html file (.dynh is my extension for it)
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
				debugShout("Not enough data supplied. It wanted '"+dyn_field+"'", 1);
				callback("ife");
				return;
			}
		}
		edited_page += file_left;//after the last dynamic field
		callback(edited_page);
	});
}

/**Find the nth occurence of a substring
	Like indexOf, but broader
	The argument "nth" is 1-indexed (1,2,3,...), not 0-indexed (0,1,2,...)
	This makes it more like english.
		"Find the second comma" translates to nth=2 search=","
*/
function indexNOf(string, search, nth){//t0000;Jonathan;05/20/1999;h;u0000;
	if(nth == 0){
		return 0;
	}
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
/**Checks if an ID string looks like an ID
	Returns false or testID.toLowerCase()
	Requirements for an ID string:
	1. longer than 1 char (t0 is the shortest)
	2. Starts with "t" or "u"
	3. Each character after the first is one of the 36 used by c_36d
*/
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
/**Take a string, parse it to base 36, convert it to a decimal int
	This is used for creating the user and trainer IDs
*/
function parse36ToDec(str36){
	var n=0;
	var power=0;
	for(var i = str36.length-1; i>= 0; i--){
		n+= c_36d.indexOf(str36[i]) * Math.pow(36, power);
		power++;
	}
	return n;
}
/**Take a base 10 number and convert it to a base 36 (0-z) string
	Used for creating the user and trainer IDs
*/
function decTo36(dec){
	var rem = 0;//remainder
	var b36 = "";
	while(dec > 0){
		rem = dec % 36;
		b36 = c_36d[rem] + b36;
		dec = Math.floor(dec/36);
	}
	return b36;
}
/**Takes the string text of a data file and returns an array of entries
	"<0> blah <1> <2> blah blah <3> blah" --> [0,1,2,3]
*/
function dataToEntries(data){
	var entries = [];
	var current = "";
	var entryN = 0;
	//Current character is part of real data <like this>
	var lookingAtData = false; 
	debugShout("converting "+data+ "to entries", 3);
	for(var i = 0; i< data.length; i++){
		debugShout(" "+data[i], 3);
		switch(data[i]){
			case "<":
				lookingAtData = true;
			break;
			case ">":
				entries[entryN] = current;
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
/**Loads the specified account's data into an array
	id - user or trainer id
	fldInd - which field index to edit <0>~<1>~<2>~<3>~
	newVal - either the new value which will replace the indicated field 
		or a function which is passed the old values and returns the new value (or "<cancel>")
	callback = function(err, [accData]).
}
*/
function editAcc(id, fldInd, newVal, callback){
	//Check that it's a proper id
	iD = isID(id);
	if(iD === false){
		callback("ide");
		return;
	}
	var file = "./account/";
	if(iD[0] == "t")
		file += "trainer_data/"+iD+".ttad";
	else if(iD[0] == "u")
		file += "user_data/"+iD+".ttad";
	
	fs.readFile(file, "utf8", function(err,data){
		if(err){
			callback("anfe");//assuming it's file not found
			return;
		}
		accData = dataToEntries(data);
		var nv = null;
		if(typeof(newVal) === "function"){
			nv = newVal(accData);
			if(nv == "<cancel>"){
				callback("canceled");
				return;
			}
		}
		else{
			nv = newVal;
		}
		//write nv in the appropriate field
		insertIndex = indexNOf(data, "<", fldInd+1) + 1;
		before = data.slice(0,insertIndex);
		after = data.slice(insertIndex);
			after = after.slice(after.indexOf(">"));
		fs.writeFile(file, before+nv+after, function(err){
			if(err){
				callback("fe");
				return;
			}
			accData[fldInd] = nv;//return the new value
			callback(null, accData);
		});
	});
}
/**Loads the specified account's data into an array
	callback = function(err,user)
	user: [id,pw,bd,"links",sex,"lpc",heap]
}
*/
function loadAcc(id, callback){
	var iD = isID(id);
	if(iD === false){
		callback("ide");
		return;
	}
	var file = "./account/";
	if(iD[0] == "t")
		file += "trainer_data/"+iD+".ttad";
	else if(iD[0] == "u")
		file += "user_data/"+iD+".ttad";
	fs.readFile(file, "utf8", function(err,data){
		if(err){
			//assuming it's file not found
			//I should actually check that
			callback("anfe");
			return;
		}
		callback(null, dataToEntries(data));
	});
}
/**Loads all users from /account/user_data
	callback = function(err,users)
*/
function loadAllUsers(callback){
	var dirstem = "./account/user_data/";
	fs.readdir(dirstem, function(err, files){
		if(err){
			callback(err, null);
			return;
		}
		var users = [];
		var done = 0;
		//Files is an array of the filenames in the user_data directory
		for(i=0; i< files.length; i++){
			var fName = files[i];
			if(fName.slice(fName.lastIndexOf(".")) == ".ttad"){
				fs.readFile(dirstem+fName, 'utf8', function(err,data){
					if(err){
						callback(err, null);
						return;
					}
					users.push(dataToEntries(data));
					done++;
					if(done == files.length){
						callback(null, users);
					}
				});
			}
			else{
				done++;
				if(done == files.length){
					callback(null, users);
				}
			}
		}
	});
}
/**Gets the next available ID
	type: "u" or "t"
	function callback(err, ID)
*/
function getNextID(type, callback){
	var file = "./account/last_IDs.ttd";
	fs.readFile(file, "utf8", function(err,data){
		if(err){
			callback("fe");
			return;
		}
		var ids = dataToEntries(data);
		var last = "";
		if(ids[0][0] == type){
			last = ids[0];
		}
		else if(ids[1][0] == type){
			last = ids[1];
		}
		else{
			callback("ide");
			return;
		}
		var nextN = parse36ToDec(last.slice(1))+1;
		var nextID = type + decTo36(nextN);
		//update lastID before returning nextID
		var cutIndex = data.indexOf(type)
		var after = data.slice(cutIndex);
			after = after.slice(after.indexOf(">"))
		var newText = data.slice(0, cutIndex) + nextID + after;
		fs.writeFile(file, newText, function(err){
			if(err){
				callback("fe");
				return;
			}
			callback(null, nextID);
		});
	});
}
/**Generates the content for a new user file
*/
function newU(id, pass, bd, sex){
	var open_char = "<";
	var close_char = ">";
	var s = open_char +	id		+ close_char + "\n";
		s += 	open_char +	pass	+ close_char + "\n";
		s += 	open_char +	bd		+ close_char + "\n";
		s += 	open_char			+			close_char + "\n";//links
		s += 	open_char +	sex		+ close_char + "\n";
		s += 	open_char +"0,0,0"+ close_char + "\n";//level,points,coins
		s += 	open_char 		+			close_char + "\n";//store-bought items
	return s;
}
/**Generates the content for a new trainer file
*/
function newT(id, pass, bd){
	var open_char = "<";
	var close_char = ">";
	var s = open_char +	id		+ close_char + "\n";
		s += 	open_char +	pass	+ close_char + "\n";
		s += 	open_char +	bd		+ close_char + "\n";
		s += 	open_char			+			close_char + "\n";//links
	return s;
}
/**Returns a sorted copy of the given 2d array. 
	The column it's sorted by is given by the integer value in sortColumn.
	Used by the leaderboard. (/leaderboard/index.html)
*/
function sort2d(inArray, sortColumn){
	var aCopy = inArray.slice();
	var res_table = [];
	while(aCopy.length > 0){
		var biggest = [0,0];//[index,sortVal]
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

/**Generates a report for the end of a session
	Takes the text of the session file (data)
*/
function genReport(data){
	var tics = 0, tenSIntervals = 0, longestInterval = 0;
	var initL = 0, initP = 0, initT;
	var endL, endP, endT;
	var lastTic;
	var entries = data.split("\n");
	for(var i = 0; i<entries.length; i++){
		if(entries[i].trim() == ""){
			//Ignore blank lines
			continue;
		}
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
				/*Convert ticFree time to seconds. 
					Divide that by 10s and add that many to the 10s Interval count.
				*/
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
	if(endL > initL){
		/*At each levelUp(), points are subtracted
			and converted to coins.
			Add those subtracted points to the point total.
		*/
		for(var i = initL; i<endL; i++){
			endP += 1000*i*i;//1000L^2 = nextLevel
		}
	}
	if(tics == 0){
		//If there were no tics, just use the session length
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
/**Returns the current time in the requested format type
	type:
		"forfile": YYYY-MM-DD-hh-mm-ss (Local time)
		"millis": (e.g.)1494298134109
		"ISO": YYYY-MM-DDThh:mm:ss.sssZ (GMT)
*/
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
/**A simple wrapper for console.log()
	By setting the value of the debugging constant, the person running the server
	can decide how many messages to see.
	depth 0: always show the message, even with debugging 0
	depth 1: print if debugging depth >= 1
	depth 2(default): print if debugging depth >= 2
	depth N: print if debugging depth >= N
*/
function debugShout(message, depth){
	if(depth){
		if(debugging >= depth)
			console.log(message);
	}
	else{
		if(debugging >= 2)
			console.log(message);
	}
}
/**Writes an error to the error log (/error/log.ttd)
*/
function log_error(error_type, message){
	message = message || "-";
	var eEntry = "<"+error_type+";"+time()+";"+message+">\n";
	fs.appendFile("./error/log.ttd", eEntry, function(err){});
}
