var fs = require("fs");

const debugging = 2;//depth of debugging: 0,1,2

/**Exported Functions
*/
module.exports.dynamic = dynamic;
module.exports.indexNOf = indexNOf;
module.exports.isID = isID;
//module.exports.fixD = fixD;
//module.exports.fourZ = fourZ;
module.exports.parse36ToDec = parse36ToDec;
module.exports.decTo36 = decTo36;
module.exports.dataToEntries = dataToEntries;
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
		cutS = cutS.substr(iN+1);
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
	for(var i = 0; i< data.length; i++){
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
			case "starting user level,points":
				initL = entryParts[1].split(",")[0];
				initP = entryParts[1].split(",")[1];
			break;
			case "tic detected":
				tics++;
				var ticTime = new Date(entryParts[1]);
				if(ticTime - lastTic > 10e3)//10s
					tenSIntervals++;
				if(ticTime - lastTic > longestInterval)
					longestInterval = ticTime - lastTic;
				lastTic = ticTime;
			break;
			case "session ended":
				endT = new Date(entryParts[1]);
			break;
			case "user level,points":
				endL = entryParts[1].split(",")[0];
				endP = entryParts[1].split(",")[1];
			break;
			default:
				return "Error: unknown entry: "+entries[i];
			break;
		}
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
			return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()+
				"-"+d.getHours()+"-"+d.getMinutes()+"-"+d.getSeconds();
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


/**
OLD:
*/

//Fix a date string to 11/11/2011. May return "Error"
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