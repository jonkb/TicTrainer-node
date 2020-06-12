var fs = require("fs");
const settings = JSON.parse(fs.readFileSync("./settings.json"));

/**Exported Functions
*/
module.exports.settings = settings;
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
module.exports.newA = newA;
module.exports.sort2d = sort2d;
//module.exports.genReport = genReport;
module.exports.archiveSession = archiveSession;
module.exports.time = time;
module.exports.debugShout = debugShout;
module.exports.log_error = log_error;

//Used to convert between b36 (a-z) and decimal
const c_36d = "0123456789abcdefghijklmnopqrstuvwxyz";
/*Delimeters for ttad & ttd files
	The descriptions are used to replace the illegal characters
*/
const open_char = "<";
const open_char_description = "[L.T. chevron]";
const close_char = ">";
const close_char_description = "[G.T. chevron]";
const division_char = ";"; // For .ttd
const division_char_description = "[semicolon]";
const subdirs = ["account", "leaderboard", "store", "admin", "nt", "register", "session"];

module.exports.open_char = open_char;
module.exports.open_char_description = open_char_description;
module.exports.close_char = close_char;
module.exports.close_char_description = close_char_description;
module.exports.division_char = division_char;
module.exports.division_char_description = division_char_description;
module.exports.subdirs = subdirs;

/**
	load and fill in a dynamic html file (.dynh is my extension for it)
	data is an object with all the needed fields.
		data.del is reserved for a "delete codes" object (container for booleans)
		if data.del.abc is true, the text inside of a 
		**[del:abc]**  ~~~  **[end_del:abc]*** tag set will be deleted
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
		debugShout("not a dynamic file", 1);
		callback(null);
		return;
	}
	fs.readFile(template_path, "utf8", function(err, file_text){
		if(err){
			callback("fe");
			return;
		}
		var next_index = file_text.indexOf("**[");//non-absolute index
		if(next_index == -1){
			//not actually a dynamic file
			debugShout("not a dynamic file", 1);
			callback(file_text);
			return;
		}
		var file_left = file_text;
		/*replace every instance of "**[x]**" with data.x
			NEW: delete text enclosed by the tags:
			**[del:abc]**  ~~~~~~~~~~  **[end_del:abc]**
			If data.del.abc == true
		*/
		while(next_index != -1){
			//Add the regular content outside of the tags
			edited_page += file_left.slice(0, next_index);
			var dyn_field = file_left.slice(next_index+3, file_left.indexOf("]**"));
			
			//if this field is a **[del:~~~]** tag
			if(dyn_field.slice(0,4) == "del:"){
				del_tag = dyn_field.slice(dyn_field.indexOf("del:")+4);
				var end_tag_search = "**[end_del:" + del_tag + "]**";
				var end_tag_index = file_left.indexOf(end_tag_search);
				if(end_tag_index < 0){
					debugShout("Improper del tag", 1);
					callback("se");
					return;
				}
				var remove_bool = false;
				if(data.del[del_tag])
					remove_bool = true;
				if(del_tag[0] == "!" && data.del[del_tag.slice(1)] === false)
					remove_bool = true;
				//if you're supposed to remove this tag, 
				//don't add any of it to the edited_page
				if(remove_bool){
					file_left = file_left.slice(end_tag_index + end_tag_search.length);
				}
				//Otherwise, get rid of the tag markers, but keep the content.
				else{
					var cut_start_index = file_left.indexOf("]**")+3;
					//cut out the del tag markers
					file_left = file_left.slice(cut_start_index, end_tag_index)+
						file_left.slice(end_tag_index + end_tag_search.length);
					//Don't add anything to edited_page yet, because the 
					//internal content still needs to be parsed through
				}
			}
			else if(data[dyn_field] != undefined){
				edited_page += data[dyn_field];
				file_left = file_left.slice(file_left.indexOf("]**")+3);
			}
			else{
				debugShout("Not enough data supplied. It wanted '"+dyn_field+"'", 1);
				callback("ife");//maybe not the right error code
				return;
			}
			next_index = file_left.indexOf("**[");
		}
		edited_page += file_left;//for after the last dynamic field
		callback(edited_page);
	});
}

/**Find the nth occurence of a substring
	Like indexOf, but broader
	The argument "nth" is 1-indexed (1,2,3,...), not 0-indexed (0,1,2,...)
	This makes it more like english.
		"Find the second comma" translates to nth=2 search=","
*/
function indexNOf(string, search, nth){
	if(nth == 0){
		return 0;
	}
	var L= string.length, i= -1;
	while(nth-- && i++<L){
		i= string.indexOf(search, i);
		if (i < 0) break;
	}
	return i;
	
	/* OLD VERSION
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
	*/
}
/**Checks if an ID string looks like an ID
	Returns false or testID.toLowerCase()
	Requirements for an ID string:
	1. longer than 1 char (t0 is the shortest)
	2. Starts with "t" or "u" (or "a")
	3. Each character after the first is one of the 36 used by c_36d
*/
function isID(testID){
	if(testID === undefined)
		return false;
	if(testID.length < 2)
		return false;
	
	testID = testID.toLowerCase();//make non case sensitive
	
	var p1 = testID[0];
	if(p1 != "t" && p1 != "u" && p1 != "a")
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
	Now deals with negatives
*/
function parse36ToDec(str36){
	var neg = false;
	if(str36[0] == "-"){
		neg = true;
		str36 = str36.slice(1);
	}
	var n=0;
	var power=0;
	for(var i = str36.length-1; i>= 0; i--){
		n+= c_36d.indexOf(str36[i]) * Math.pow(36, power);
		power++;
	}
	if(neg)
		return -n;
	else
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
			case open_char:
				lookingAtData = true;
			break;
			case close_char:
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
	else if(iD[0] == "a")
		file += "admin_data/"+iD+".ttad";
	
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
		insertIndex = indexNOf(data, open_char, fldInd+1) + 1;
		//debugShout("289: "+insertIndex);
		if(insertIndex == 0){
			/*The user's file doesn't have enough fields. 
				For example, trying to set the NTID of an older user.
				Or a request was passed to edit a field that doesn't exist.
				Add blank fields until you get there.
			*/
			var fldrx = new RegExp(open_char+'[^'+close_char+']*'+close_char, 'g')
			var num_flds = data.match(fldrx).length;
			debugShout("297: "+num_flds);
			while(fldInd+1 > num_flds){
				data += open_char+close_char+"\n";
				num_flds++;
			}
			insertIndex = indexNOf(data, open_char, fldInd+1) + 1;
		}
		before = data.slice(0,insertIndex);
		after = data.slice(insertIndex);
			after = after.slice(after.indexOf(close_char));
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
	user: [id,pw,bd,"links",sex,"lpc",heap,research_state,aiti]
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
	else if(iD[0] == "a")
		file += "admin_data/"+iD+".ttad";
	fs.readFile(file, "utf8", function(err, data){
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
	type: "u" or "t" or "a"
	function callback(err, ID)
*/
function getNextID(type, callback){
	var dirstem = "./account/";
	if(type == "u")
		dirstem += "user_data/";
	else if(type == "t")
		dirstem += "trainer_data/";
	else if(type == "a")
		dirstem += "admin_data/";
	else{
		callback("se");
		return;
	}
	
	fs.readdir(dirstem, function(err, files){
		if(err){
			callback(err);
			return;
		}
		var idNums = files.map(function(e){
			var idot = e.lastIndexOf(".");
			if(e.slice(idot) == ".ttad"){
				return parse36ToDec(e.slice(1, idot));
			}
			else{
				return -1;
			}
		});
		/*
		//This part looks for the lowest unused id.
		//Alternatively, just take max. But this method fills in any gaps.
		//Hm, but there shouldn't be gaps in normal practice.
		idNums.sort(function(a,b){ return a-b; });
		var lowest_unused = 0;
		for(n of idNums){
			if(n == lowest_unused){
				lowest_unused++;
			}
			else if(n > lowest_unused){
				break;
			}
		}
		var nextID = type + decTo36(lowest_unused);
		*/
		var maxID = 0;
		for(n of idNums){
			if(n > maxID)
				maxID = n;
		}
		var nextID = type + decTo36(maxID+1);
		callback(null, nextID);
	});
}
/**Generates the content for a new user file
*/
function newU(id, pass, bd, sex){
	var s = "ID:" + 								open_char +	id		+ close_char + "\n";
		s += 	"PASSWORD:" + 					open_char +	pass	+ close_char + "\n";
		s += 	"BIRTH DATE:" +					open_char +	bd		+ close_char + "\n";
		s += 	"LINKED TRAINERS:" + 		open_char			+			close_char + "\n";
		s += 	"SEX:" + 								open_char +	sex		+ close_char + "\n";
		s += 	"LEVEL,POINTS,COINS:" +	open_char +"0,0,0"+ close_char + "\n";
		s += 	"BOUGHT ITEMS:" +				open_char 		+			close_char + "\n";
		s +=	"RESEARCH SETTINGS (RS,AITI,SMPR,PTIR,FLASH):" + open_char + "REG,10,3000,5,NO" + close_char + "\n";
		s += 	"NEWTICS ID:" +					open_char + "-"		+	close_char + "\n";
		
	return s;
}
/**Generates the content for a new trainer file
*/
function newT(id, pass, bd){
	var s = "ID:" + 					open_char +	id		+ close_char + "\n";
		s += 	"PASSWORD:" + 		open_char +	pass	+ close_char + "\n";
		s += 	"BIRTH DATE:" + 	open_char +	bd		+ close_char + "\n";
		s += 	"LINKED USERS:" + open_char			+			close_char + "\n";//links
	return s;
}
/**Generates the content for a new admin file
*/
function newA(id, pass){
	if(id[0] != "a")
		return "ide";
	var s = "ID:" + 			open_char +	id		+ close_char + "\n";
		s += 	"PASSWORD:" + open_char +	pass	+ close_char + "\n";
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
	TO DO: switch to async? Does it take long enough to justify it?
*/
function genReport(data){
	var tics = 0, tenSIntervals = 0, longestInterval = 0;
	var initL = 0, initP = 0, initT;
	var endL = 0, endP = 0, endT;
	var lastTic, ticFree;
	var is_nt = false;
	var rewards = 0;
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
				endL = initL;
				initP = entryParts[1].split(",")[1];
				endP = initP;
			break;
			case "tic detected":
				tics++;
				var ticTime = new Date(entryParts[1]);
				ticFree = ticTime - lastTic;
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
				ticFree = endT - lastTic;
				if(ticFree > longestInterval)
					longestInterval = ticFree;
				tenSIntervals += Math.floor(ticFree / 1e4);
			break;
			case "user l,p,c":
				endL = entryParts[1].split(",")[0];
				endP = entryParts[1].split(",")[1];
			break;
			case "NewTics subject":
				is_nt = true;
			break;
			case "reward dispensed":
				rewards++;
			break;
			case "ncr reward times":
			break;
			default:
				return "\nError: unknown entry: "+entries[i];
			break;
		}
	}
	if(endL > initL){
		/*At each levelUp(), points are subtracted
			and converted to coins.
			Add those subtracted points to the point total.
		*/
		for(var i = initL; i<endL; i++){
			endP += settings.points_to_first_level*i*i;//300L^2 = nextLevel
		}
	}
	debugShout("start: "+initT+". end: "+endT);
	var report = "\n****************\nReport:";
	report += "\nsession length|"+ (endT - initT)/1000;
	if(!is_nt){
		report += "\nlevels gained|"+ (endL - initL);
		report += "\npoints earned|"+ (endP - initP);
	}
	report += "\nnumber of tics|"+ tics;
	report += "\nlongest tic free interval|"+ longestInterval/1000;
	report += "\nnumber of 10s tic free intervals|"+ tenSIntervals;
	if(is_nt)
		report += "\nnumber of rewards dispensed|"+ rewards;
	report += "\nreport generated with TicTrainer version|"+settings.tt_version+"\n";
	return report;
}

/**Archives the given session file
	If it was an NT session, include the stype in the filename
	callback(err)
*/
function archiveSession(sesFile, callback){
	fs.readFile(sesFile, "utf8", function(err, data){
		if(err){
			callback("fe");
			return;
		}
		var sesFile2 = sesFile.slice(sesFile.lastIndexOf("/")+1);
		sesFile2 = sesFile2.slice(0, sesFile2.indexOf(".ttsd"));
		sesFile2 += "_" + time("forfile");
		var ntsi = data.indexOf("NewTics subject|");
		if(ntsi != -1){
			var stype = data.slice(ntsi);
			stype = stype.slice(indexNOf(stype, "|", 2)+1, stype.indexOf("\n"));
			sesFile2 += "_"+stype;
		}
		sesFile2 += ".ttsd";
		sesFile2 = "./session/archive/" + sesFile2;
		fs.rename(sesFile, sesFile2, function(err){
			if(err){
				callback("fe");
				return;
			}
			fs.appendFile(sesFile2, genReport(data), function(err){
				if(err){
					callback("fe");
					return;
				}
				callback();
			});
		});
	});
}

function pad2(num){
	if(num < 10){
		return "0" + num.toString();
	}
	return num
}

/**Returns the current time in the requested format type
	type:
		"forfile": YYYYMMDD-hhmmss (Local time)
		"millis": (e.g.)1494298134109
		"ISO": YYYY-MM-DDThh:mm:ss.sssZ (GMT)
*/
function time(type){
	var d = new Date();
	switch(type){
		case "forfile"://YYYYMMDD-hhmmss
			return d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+
				"-"+pad2(d.getHours())+pad2(d.getMinutes())+pad2(d.getSeconds());
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
	if(!depth)
		depth = 2;
	if(settings.debugging >= depth)
		console.log(message);
}
/**Writes an error to the error log (/error/log.ttd)
*/
function log_error(error_type, message){
	message = message || "-";
	message = message.replace(open_char, open_char_description);
	message = message.replace(close_char, close_char_description);
	message = message.replace(division_char, division_char_description);
	var eEntry = open_char+error_type+division_char+time()+
		division_char+message+close_char+"\n";
	fs.appendFile("./error/log.ttd", eEntry, function(err){});
}
