var a = "abcowdefg";
var fs = require("fs");
var stream = require("stream");
var aux = require("../root/scripts/auxiliary.js");

var file = "test.txt";
var file2 = "test2.txt";
var file3 = "test2.data";

//(file, entryID, fldInd, newVal, callback)
/*aux.editData(file3, "d", 1, "[Why was there an 'e' here?!]", function(err, data){
	console.log(err, data);
});*/


aux.editData1(file3, "d", 1, "[Why was there an 'e' here?!]", function(err, data){
	console.log(err, data);
})
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

