var a = "abcowdefg";
var fs = require("fs");
var stream = require("stream");
var aux = require("../../root/scripts/auxiliary.js");

var file = "test.txt";
var file2 = "test2.txt";
var file3 = "test2.data";

var dirstem = "../../root/account/user_data/";

/*
fs.readFile(dirstem+"u0.ttad", 'utf8', function(err,data){
	console.log(data);
	console.log(ttad_to_arr(data));
});
*/
/*
fs.readdir(dirstem, function(err,files){
	if(err){
		console.log(err);
		return;
	}
	console.log(files);
	users = [];
	done = 0;
	for(i=0; i< files.length; i++){
		fName = files[i];
		console.log("A: "+fName);
		if(fName.slice(fName.lastIndexOf(".")) == ".ttad"){
			console.log("B");
			fs.readFile(dirstem+fName, 'utf8', function(err,data){
				if(err){
					console.log(err);
					return;
				}
				users.push(ttad_to_arr(data));
				done++;
				if(done == files.length){
					console.log("Now from here: ");
					console.log(users);
				}
			});
		}
		else{
			done++;
			if(done == files.length){
				console.log("Now from here': ");
				console.log(users);
			}
		}
	}
});*/

/*
aux.loadAllUsers(function(err, users){
	if(err){
		console.log(err);
		return;
	}
	console.log("Now from aux: ");
	console.log(users);
});*/


//same now as dataToEntries
function ttad_to_arr(data){
	var entries = [];
	var current = "";
	var entryN = 0;
	//Current character is part of real data <like this>
	var lookingAtData = false; 
	for(var i = 0; i< data.length; i++){
		switch(data[i]){
			case "<":
				lookingAtData = true;
			break;
			case ">":
				entries[entryN] = current;
				entryN++;
				current = "";
				lookingAtData = false;
			break;
			default:
				if(lookingAtData)
					current+= data[i];
			break;
		}
	}
	return entries;
}


//(file, entryID, fldInd, newVal, callback)
/*aux.editData(file3, "d", 1, "[Why was there an 'e' here?!]", function(err, data){
	console.log(err, data);
});*/

/*

aux.editData1(file3, "d", 1, "[Why was there an 'e' here?!]", function(err, data){
	console.log(err, data);
})*/
/*
fs.open(file2, "r+", function(err,fd){
	var curChar = new Buffer(1);
	while ( ... ) {
		fs.readSync(fd,curChar,)
	}
});*/


// Stream test
/*
var rs = fs.createReadStream(file2, { encoding: "utf8" });
var ws = fs.createWriteStream(file2, { flags: "r+" });

rs.on('readable', () => {
	var curChar = '';
	while ( (curChar = rs.read(1)) !== null ) {
		if(curChar == 'e')
			ws.write("[e]")
		else
			ws.write(curChar);
	}
	ws.end();
});*/

