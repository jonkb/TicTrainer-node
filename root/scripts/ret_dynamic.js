/**Functions which return dynamic web pages
	All of these need to be passed res (response) so they can send off the response.
*/
var aux = require("./auxiliary.js");
var fs = require("fs");

module.exports.error = ret_error;
module.exports.created = ret_created;
module.exports.manage_account = ret_manage_account;
module.exports.link_loading_trainer = ret_link_loading_trainer;
module.exports.link_loading_user = ret_link_loading_user;
module.exports.start_session_trainer = ret_start_session_trainer;
module.exports.start_session_user = ret_start_session_user;
module.exports.session_trainer = ret_session_trainer;
module.exports.session_user = ret_session_user;
module.exports.report_sent = ret_report_sent;
module.exports.admin = ret_admin;
module.exports.manageRU = ret_manageRU;
module.exports.viewLogs = ret_viewLogs;
module.exports.store = ret_store;
module.exports.redirect = ret_redirect;
module.exports.requested_file = ret_requested_file;


/* Returns an error message
Error Types: 
	fe - File,
	se - Server, 
	dfe - Date Format,
	ide - ID, 
	ice - Invalid Character, 
	ife - Incomplete Form,
	conses - Concurrent Session,
	pce - Password Confirmation, 
	anfe - Account not found, 
	anle - Account not linked,
	toe - Timeout
retry is the url the Try Again button links to
	generally the page the error came from.
	Defaults to /index.html
a message can be passed and logged in ./error/log.ttd
*/
function ret_error(res, error_type, retry, message){
	retry = retry || "/index.html";
	var dynd = {"retry": retry};
	switch(error_type){
		case "fe":
		case "se":
			res.writeHead(500, {"Content-Type": "text/html; charset=UTF-8"});
		break;
		default:
			res.writeHead(400, {"Content-Type": "text/html; charset=UTF-8"});
		break;
	}
	aux.dynamic("./error/"+error_type+".dynh", dynd, finish_up);
	function finish_up(page){
		res.write(page, function(err){res.end();});
		if(message)
			aux.log_error(error_type, message);
	}
}
/* Returns the page for managing research users
*/
function ret_manageRU(res, data){
	var dynd = {
		"admin_id": data.id,
		"admin_pw": data.pw
	}
	aux.dynamic("./admin/manageRU.dynh", dynd, function(page){
		if(page == "fe" || page == "se")
			ret_error(res, page);
		else{
			res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
			res.write(page, function(err){res.end();});
		}
	});
}
/* Returns the page for viewing logs
*/
function ret_viewLogs(res, data){
	var dynd = {
		"admin_id": data.id,
		"admin_pw": data.pw
	}
	aux.dynamic("./admin/viewLogs.dynh", dynd, function(page){
		if(page == "fe" || page == "se")
			ret_error(res, page);
		else{
			res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
			res.write(page, function(err){res.end();});
		}
	});
}
/* Returns a message that the account has been successfully created (/register/)
*/
function ret_created(res, data){
	//[id,pass,bd,links,sex,l/p/c,inventory]
	var dataEntries = aux.dataToEntries(data);
	var ID = dataEntries[0];
	var birthText = "";
	if(ID[0] == "u"){
		var birthD = new Date(parseInt(dataEntries[2]));
		birthText += "<br><br>"+
			"FYI, the fake birthdate we will use for you is "+birthD.toLocaleDateString()+". \n"+
			"There's a small chance (less than 3%) that this is your real birthday, but if so, \n"+
			"that's just a lucky guess. All we know on our end is that it's within a couple \n"+
			"of months of your real birthday.";
	}
	var dynd = {
		"id": ID,
		"pw": dataEntries[1],
		"bd": birthText
	};
	aux.dynamic("./register/created.dynh", dynd, function(page){
		if(page == "fe" || page == "se")
			ret_error(res, page);
		else{
			res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
			res.write(page, function(err){res.end();});
		}
	});
}
/*Return the manage account web page
	data is an array with account data
*/
function ret_manage_account(res, data){
	if(data[0][0] == "t"){
		var lnacc = "";
		if(data[3] == ""){
			lnacc = "No Linked Accounts";
		}
		else{//Data Format is: [id,pass,bd,"link1,link2"]
			lnacc = data[3].replace(new RegExp('[,]', 'g'), ", ");
		}
		var dynd = {//dynamic data
			"id": data[0],
			"pw": data[1],
			"birth": data[2],
			"linked_accounts": lnacc
		};
		aux.dynamic("./account/manageT.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
			res.write(page, function(err){res.end();});
		});
	}
	else if(data[0][0] == "u"){
		var level = data[5].split(",")[0];
		var points = data[5].split(",")[1];
		var coins = data[5].split(",")[2];
		var lnacc = "";
		if(data[3] == ""){
			lnacc = "No Linked Accounts";
		}
		else{//Data Format is: [id,pass,bd,links("link1,link2,link3"),sex,l/p/c,inventory]
			lnacc = data[3].replace(new RegExp('[,]', 'g'), ", ");
		}
		var dynd = {//dynamic data
			"id": data[0],
			"pw": data[1],
			"birth": data[2],
			"linked_accounts": lnacc, //from data[3]
			"sex": data[4],
			"level": level, //from data[5]
			"points": points, //from data[5]
			"coins": coins, //from data[5]
			"heap": data[6]
		};
		aux.dynamic("./account/manageU.dynh", dynd, function(page){
			res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
			res.write(page, function(err){res.end();});
		});
	}
}
// Returns a loading page while awaiting link
function ret_link_loading_trainer(res, data){
	var dynd = {
		"id": data.id,
		"lid": data.lid,
		"pw": data.pw,
		"tryN": parseInt(data.tryN)+1
	};
	aux.dynamic("./session/linkloading-trainer.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}
function ret_link_loading_user(res, data){
	var dynd = {
		"id": data.id,
		"pw": data.pw,
		"lid": data.lid
	};
	aux.dynamic("./session/linkloading-user.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}
//Returns the page with the start button
function ret_start_session_trainer(res, data){
	var dynd = {
		"id": data.id,
		"pw": data.pw,
		"lid": data.lid
	};
	aux.dynamic("./session/startsession-trainer.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}
function ret_start_session_user(res, data){
	var dynd = {
		"id": data.id,
		"pw": data.pw,
		"lid": data.lid
	};
	aux.dynamic("./session/startsession-user.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}
function ret_session_trainer(res, data){
	//[session control page] show Tic Detected, Stop Session butttons
	var dynd = {
		"id": data.id,
		"pw": data.pw,
		"lid": data.lid
	};
	aux.dynamic("./session/session-trainer.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}
function ret_session_user(res, data){
	//[session page] show counter, start local reward timer
	var dynd = {
		"id": data.id,
		"pw": data.pw,
		"lid": data.lid,
		"level": data.level,
		"points": data.points,
		"coins": data.coins,
		"sesL": data.sesL,
		"heap": data.heap
	};
	aux.dynamic("./session/session-user.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}
// After error/report
function ret_report_sent(res, data){
	if(!data.fName)
		data.fName = "Y";//No name supplied
	else
		data.fName = data.fName + ", y";
	var dynd = {
		"fn": data.fName
	};
	aux.dynamic("./error/report-sent.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}
//Admin interface
function ret_admin(res, data){
	var dynd = {
		"id": data.id,
		"pw": data.pw,
	}
	aux.dynamic("./admin/interface.dynh", dynd, function(page){
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(page, function(err){res.end();});
	});
}
//Return the TT Store. Requires id, pw, coins
function ret_store(res, data){
	aux.dynamic("./account/store/store.dynh", data, function(page){
		res.writeHead(200, {"Content-Type": "text/html; charset=UTF-8"});
		res.write(page, function(err){res.end();});
	});
}

// Redirect to the specified URL
function ret_redirect(res, pathN){
	res.writeHead(303, {"Location": pathN});
	res.end();
}
// Returns the requested file.
function ret_requested_file(res, pathN){
	if(pathN.slice(0,2) != "./"){
		if(pathN.slice(0,1) != "/")// "abc/def.ghi"
			pathN = "./"+ pathN;
		else// "/abc/def.ghi"
			pathN = "."+ pathN;
	}
	//Choose the appropriate content type based on the file extension
	var ext = pathN.slice(pathN.lastIndexOf("."));
	var cType = "text/plain";//MIME type
	switch(ext){
		case ".html":
			cType = "text/html";
		break;
		case ".js":
			cType = "text/javascript";
		break;
		case ".css":
			cType = "text/css";
		break;
		case ".gj"://personal extension for getting json data (GetJson)
			cType = "application/json";
		break;
		case ".ico":
			cType = "image/x-icon";
		break;
		case ".png":
			cType = "image/png";
		break;
		case ".gif":
			cType = "image/gif";
		break;
		case ".svg":
			cType = "image/svg+xml";
		break;
		/*.ttad - Tt account data
			.ttsd - Tt session data (uses "|" & "\n" not <~><~>)
			.ttd - other Tt data (lnusers, err/log) (still uses <~><~>)
			Maybe ttsd and ttd could be available through the admin interface.
		*/
		case ".ttad":
		case ".ttsd":
		case ".ttd":
			// Don't serve sensitive data
			res.writeHead(403, {"Content-Type": "text/html; charset=UTF-8"});
			res.end();
		return;
	}
	cType += "; charset=UTF-8";
	if(ext == ".gj"){
		switch(pathN){
			case "./account/leaderboard/leaderboard.gj":
				aux.debugShout("288");
				aux.loadAllUsers(function(err,users){
					aux.debugShout("people: "+users, 3);
					var res_table = [];
					/*["id", "level", "points"]
						[u0  , 1      , 100]
						...  , ...    , ...
					*/
					var len = Math.min(users.length, 100);
					for(var i = 0; i < len; i++){
						var id = users[i][0];
						var lp = users[i][5].split(",");
						res_table[i] = [id, lp[0], lp[1]];
					}
					aux.debugShout("res_table: "+res_table, 3);
					var resFinal = JSON.stringify(res_table);
					aux.debugShout("resFinal: "+resFinal, 3);
					res.writeHead(200, {"Content-Type": cType});
					res.write(resFinal, function(err){res.end();});
				});
			break;
			//Add a spot here for the error log for admin
		}
	}
	else{
		// Read the requested file content and send it
		fs.readFile(pathN, function (err, data) {
			if (err) {
				// HTTP Status: 404 : NOT FOUND
				res.writeHead(404, {"Content-Type": 'text/html; charset=UTF-8'});
				fs.readFile("./error/404.html", function(err, data2){
					if(err){
						res.end();
						return;
					}
					res.write(data2, function(err){res.end();});
				});
				return;
			}
			aux.debugShout("returning "+pathN+" which is of type "+cType, 3);
			// HTTP Status: 200 : OK
			res.writeHead(200, {"Content-Type": cType});	
			// Write the content of the file to response body
			res.write(data, function(err){res.end();});
		});
	}
}
