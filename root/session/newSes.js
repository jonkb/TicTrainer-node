var fs = require("fs");

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
			if(err)
				retCB("fe");
			else{
				var people = data.split("\n");
				var found = false;
				for(i=0; i < people.length; i++){
					personFields = people[i].split(";");
					if(personFields[0] == iD){
						if(personFields[3] == pass){
							var linkedAccounts = personFields[4].split(",");
							for(i=0; i<linkedAccounts.length; i++){
								if(linkedAccounts[i] == lID){
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
			}
		});
	}
	//Continue with the next step
	function allConfirmed(){
		if(iD.substr(0,1) == "t"){
			//Go to trainer loading page
			retCB("success");
		}
		else{
			var linkData = "\n" +iD+ "," +lID;//Data entry for the waiting link
			fs.appendFile("./session/lnusers.data", linkData, function(err){
				if(err){
					retCB("fe");
				}
				else{
					//Go to user loading page
					retCB("success");
				}
			});
		}
	}
}
module.exports.new_session = newS;
