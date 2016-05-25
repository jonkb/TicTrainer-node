var fs = require("fs");

/**handle form submission for register-trainer
 * returns an error or the data
 */
var addT = function add_trainer(newTData, retCB) {
	var fN = newTData.fName;
	var bD = newTData.birth;
	var pass = newTData.pWord;
	var passC = newTData.pWordConf;
	//Make sure these don't include ; or \n
	if(fN.indexOf(";") != -1 || bD.indexOf(";") != -1 || pass.indexOf(";") != -1)
		retCB("ice");//Invalid Character Error
	else if(fN.indexOf("\n") != -1 || bD.indexOf("\n") != -1 || pass.indexOf("\n") != -1)
		retCB("ice");
	else{
		if(pass == passC){
			var bD2 = fixD(bD);
			if(bD2 != "Error"){
				//Get the next available iD number
				var iD = "t0000";
				fs.readFile("./trainer.data", "utf8", function(err, data){
					if(err)
						retCB("fe");
					else{
						var people = data.split("\n");
						var last = people[people.length-1];
						var lastID = last.split(";")[0];
						var IDN = parseInt(lastID.slice(1))+1;
						iD = "t"+fourZ(IDN);
						var tData = "\n"+iD+";"+fN+";"+bD2+";"+pass+";;";
						fs.appendFile("./trainer.data", tData, function(err){
							if(err)
								retCB("fe");
							else{
								//console.log("Data: "+tData);
								retCB(tData);
							}
						});
					}
				});
			}
			else
				retCB("dfe");
		}
		else{
			retCB("pce");
		}
	}
}

/**handle form submission for register-user
 * returns an error or the data
 */
var addU = function add_user(newUData, retCB) {
	var sex = newUData.sex;
	var bD = newUData.birth;
	var pass = newUData.pWord;
	var passC = newUData.pWordConf;
	//Make sure these don't include ; or \n
	if(bD.indexOf(";") != -1 || pass.indexOf(";") != -1)
		retCB("ice");
	else if(bD.indexOf("\n") != -1 || pass.indexOf("\n") != -1)
		retCB("ice");
	else{
		if(pass == passC){
			var bD2 = fixD(bD);
			if(bD2 != "Error"){
				//Get the next available iD number
				var iD = "u0000";
				fs.readFile("./user.data", "utf8", function(err, data){
					if(err)
						retCB("fe");
					else{
						var people = data.split("\n");
						var last = people[people.length-1];
						var lastID = last.split(";")[0];
						var IDN = parseInt(lastID.slice(1))+1;
						iD = "u"+fourZ(IDN);
						var uData = "\n"+iD+";"+sex+";"+bD2+";"+pass+";;0,0;";//;links;level,points;
						fs.appendFile("./user.data", uData, function(err){
							if(err)
								retCB("fe");
							else
								retCB(uData);
						});
					}
				});
			}
			else
				retCB("dfe");
		}
		else{
			retCB("pce");
		}
	}
}

var test = function test(){
	var testText = "Hopefully, this is saved to test.data somewhere in the universe"
	return "Test";
	/*fs.appendFile("/test.data", testText, function(err){
		if(err){
			console.log(err);
		}
		else{console.log("data saved");}
	});*/
}

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

function fourZ(n){
	if(isNaN(n))
		return "Error";
	var r = n.toString();
	if(r.length == 1)
		return "000"+r;
	if(r.length == 2)
		return "00"+r;
	if(r.length == 3)
		return "0"+r;
	if(r.length == 4)
		return r;
	else
		return "Error";
}

module.exports.add_trainer = addT;
module.exports.add_user = addU;
module.exports.test = test;
