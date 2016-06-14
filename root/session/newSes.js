var fs = require("fs");

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

var newS = function(fData, retCB){//fData: {source, id, pWord, lid}
	var returned = false;
	var iD = fData.id;
	var pass = fData.pWord;
	var lID = fData.lid;
	var file = "./";
	if(iD.substr(0,1) == "t")
		file += "trainer.data";
	else if(iD.substr(0,1) == "u")
		file += "user.data";
	else{
		retCB("ide");
		returned = true;
	}
	if(isNaN(iD.substr(1))){
		retCB("ide");
		returned = true;
	}
	if(!returned){
		fs.readFile(file, "utf-8", function(err, data){
			if(err){
				retCB("fe");
				return;
			}
			var people = dataToEntries(data);
			var found = false;
			for(i=0; i < people.length; i++){
				console.log("looking at "+people[i][0]);
				if(people[i][0] == iD){
					if(people[i][3] == pass){
						var linkedAccounts = people[i][4].split(",");
						for(i2=0; i2<linkedAccounts.length; i2++){
							if(linkedAccounts[i2] == lID){
								found = true;
							}
						}
						if(!found){
							retCB("anle");//Account not linked error
						}
						else{
							allConfirmed();
						}
					}
					else
						retCB("pce");//Password Confirmation Error						
					found = true;
					break;//Exit for
				}
			}
			if(!found)
				retCB("anfe");//Account not found error
		});
	}
	//Continue with the next step
	function allConfirmed(){
		if(iD.substr(0,1) == "t"){
			//Go to trainer loading page
			retCB("success");
		}
		else{
			var linkData = "<" +iD+ "," +lID+ ">";//Data entry for the waiting link
			fs.readFile("./session/lnusers.data", "utf8", function(err,data){
				if(err){
					retCB("fe");
					return;
				}
				if(data.indexOf(linkData) == -1)
					fs.appendFile("./session/lnusers.data", linkData, function(err){
						if(err){
							retCB("fe");
						}
						else{
							//Go to user loading page
							retCB("success");
						}
					});
				else
					retCB("success");
			});
		}
	}
}

module.exports.new_session = newS;