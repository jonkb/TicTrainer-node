var a = "abcowdefg";
var fs = require("fs");
var stream = require("stream");
var aux = require("../root/scripts/auxiliary.js");

var file = "test.txt";
var file2 = "test.txt";
var file3 = "test.data";

console.log("A");

var t1 = 
	[["a", 1, 500],
	["b", 2, 1],
	["c", 2, 200],
	["d", 3, 1],
	["e", 2, 20],
	["f", 1, 1000],
	["g", 2, 2000],
	["h", 1, 200]]

var t2 = [];
t2[0] = ["A", "B"];
t2[1] = ["A", "B"];	

var testData = "<a,b,c><d,e,f><g,h,i>";

var t11 = t1;
var t12 = t1;
var t13 = t12;


console.log("B");

t3 = [["u0","9","2988"],["u1","2","585"],["u2","1","69"],["u3","1","915"],["u4","0","0"],["u5","0","0"],["u6","0","0"],["u7","0","0"],["u8","0","0"],["u9","0","0"],["ua","1","485"],["ub","0","0"],["uc","0","0"],["ud","0","0"],["ue","0","0"]]
console.log(t3);

console.log(aux.sort2d(t3, 2));
console.log(aux.sort2d(t3, 1));
console.log(aux.sort2d(aux.sort2d(t3, 2), 1));

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




