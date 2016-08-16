var a = "abcowdefg";
var fs = require("fs");
var stream = require("stream");
var aux = require("../root/scripts/auxiliary.js");

var file = "test.txt";
var file2 = "test.txt";
var file3 = "test.data";

console.log("A");

var t1 = 
	[["a", 10, 1],
	["b", 20, 1],
	["c", 20, 2],
	["d", 5, 1]]

var t2 = [];
t2[0] = ["A", "B"];
t2[1] = ["A", "B"];	

var testData = "<a,b,c><d,e,f><g,h,i>";
	
console.log(60 == "<");
	
console.log("Z");







/*
function fun(f){
	console.log("B");
	//should change <a2;b;c;d> to <a2;b;woohoo!;d>
	aux.editData0(f, "a0", 4, "woohoo again!", (err, message) => {
		if(err)
			console.log(err + " | " + message);
		else
			console.log("C")
	});
}

fun(file3);
*/
	
	/*
		if(!(coin % 2)){
			console.log("C");
			ws.write(chunk);
			coin++
		}
	*/
	/*
	var curChar = "";
	var stream = require('stream');
	var util = require('util');
	var Transform = stream.Transform;
	
	//	Define class Noa
	//	It inherits Transform
	
	function Noa(options) {
		// init Transform
		Transform.call(this, options);
	}
	util.inherits(Noa, Transform);
	Noa.prototype._transform = function (chunk, enc, cb) {//enc: encoding
		if(chunk != "a")
			this.push(chunk);
		cb();
	};
	
	
	var rs = fs.createReadStream(f, {encoding: "utf8"});
	var ws = fs.createWriteStream(f2);
	
	console.log("B");
	

	var noa = new Noa();
	noa.pipe(ws); // output to ws
		
	
	rs.on('readable', () => {
		console.log("C");
		while ((curChar = rs.read(1)) !== null) {
			console.log("D");
			console.log(curChar);
			noa.write(curChar);
		}
	});
	
	//rs.pipe(noa);
	
	rs.on('data', () => {} );
	*/




