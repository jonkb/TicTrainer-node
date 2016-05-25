/*To Do:
- Use normalize.css ? Change M/F
- switch link and edit in manage account
- use btn in forms
- make it less natural to run away after ret_created
- Stylesheet MIME type mystery
- fix onbeforeunload on mobile

- "I'm paying attention" widget for trainer
- change b,m counter size for screen size
- use fs.open instead of writeFileSync
- add leaderboard

- make id's non-case sensitive ? what about hex? or base 36? or not 4-long
- switch the ret_* functions to reading in a file and inserting the data in the holes (like font program template)
- Maybe use json instead for linkloading?
- Think about moving the ret_* functions to an external js file
- Should I make it check password each step of the session for safety -- would that be taxing
*/

var http = require("http");
var fs = require('fs');
var url = require('url');

const debugging = 2;//depth of debugging: 0,1,2
const PORT = 8888;
//const pathzero = "C:/Users/16jonathanblack/Google Drive/12/CompSci/PROJECT/TicTrainer/Web/Node/TTweb/";

/*Takes two objects:
head={title[, sub][, bodytag]}
main={[content]} (All strings)
*/
function genPage(head, main){
	var page = 
	"<html id='entire-page'>"+
	"<head>"+
		"<link rel='stylesheet' type='text/css' href='/stylesheets/bgStyle.css'>"+
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

/*return a data entry for the given account data object
assumes the data object includes an irrelevant "source" property
*/
function toData(body){
	var data = "\n";
	var fieldNames = Object.getOwnPropertyNames(body);
	for(i=1; i<fieldNames.length; i++){//Start at one to exclude "source"
		data+= body[fieldNames[i]];
		data+= ";";
	}
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

function handleRequest(req, res){
	// Parse the request file name
	var pathname = url.parse(req.url).pathname;
	var filename = pathname.substr(pathname.lastIndexOf("/"));
	if(filename == "/"){
		pathname += "index.html";
	}
	else if(filename.indexOf(".") == -1){
		pathname += "/index.html";
	}
	/**
	* Functions which define and return dynamic web pages
	*/
	/* Returns an error message
	Error Types: 
		fe - File, 
		dfe - Date Format,
		ide - ID, 
		ice - Invalid Character, 
		pce - Password Confirmation, 
		anfe - Account not found, 
		anle - Account not linked,
		toe - Timeout
	retry is the url the Try Again button links to
		generally the page the error came from.
		Defaults to /index.html
	*/
	function ret_error(error_type, retry){
		if(retry == null)
			retry = "/index.html";
		var erPage = 0;
		switch(error_type){
			case "fe":
				res.writeHead(500, {"Content-Type": "text/html"});
			break;
			case "dfe":
				res.writeHead(400, {"Content-Type": "text/html"});
				erPage = genPage({
						"title": "Date Format Error"
					},{
						"content": "<a href='"+retry+"' class='bigBtn'>Try Again</a>"
					});
			break;
			case "ide":
				res.writeHead(400, {"Content-Type": "text/html"});
				erPage = genPage({
					"title": "Input Error: Improper ID"
					},{
						"content": "<a href='"+retry+"' class='bigBtn'>Try Again</a>"
					});
			break;
			case "ice":
				res.writeHead(400, {"Content-Type": "text/html"});
				erPage = genPage({
						"title": "Input Error: Invalid Character",
						"sub": "Do not include \";\" or \"\\n\" in your form submissions"
					},{
						"content": "<a href='"+retry+"' class='bigBtn'>Try Again</a>"
					});
			break;
			case "pce":
				res.writeHead(400, {"Content-Type": "text/html"});
				erPage = genPage({
						"title": "Password Confirmation Error"
					},{
						"content": "<a href='"+retry+"' class='bigBtn'>Try Again</a>"
					});
			break;
			case "anfe":
				res.writeHead(400, {"Content-Type": "text/html"});
				erPage = genPage({
						"title": "Error: Account Not Found"
					},{
						"content": "<a href='"+retry+"' class='bigBtn'>Try Again</a>"
					});
			break;
			case "anle":
				res.writeHead(400, {"Content-Type": "text/html"});
				erPage = genPage({
						"title": "Error: Accounts Not Linked"
					},{
						"content": "Please enter a different account<br>"+
						"<a href='"+retry+"' class='bigBtn'>Try Again</a>"+
						"<br>or link the account to yours at Account Management<br>"+
						"<a href='/account.html' class='bigBtn'>Manage Account</a>"
					});
			break;
			case "toe":
				res.writeHead(400, {"Content-Type": "text/html"});
				erPage = genPage({
						"title": "Error: Timeout"
					},{
						"content": "<a href='"+retry+"' class='bigBtn'>Try Again</a>"
					});
			break;
		}
		if(erPage)
			res.write(erPage, function(err){res.end();});
		else
			res.end();
	}
	/* Returns a message that the account has been successfully created (/register/)
	*/
	function ret_created(data){
		var sd = data.split(";");
		//assert ud.length == 4;
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
			"title": "Account Successfully Created"},{
			"content": 
				"Your account id is: "+ sd[0]+"<br>"+
				"Your password is: "+ sd[3]+"<br>"+
				"Be sure to record this information, as it is needed to log in. <br>"+
				"<a href='/' class='btn'>Return to Home</a>"}), function(err){res.end();});
	}
	/*Return the manage account web page
	var data is a single account entry in a .data file (an array)
	*/
	function ret_manage_account(data){
		//assert data.length > 3;
		var ctnt = "";
		if(data[0].substr(0,1) == "t"){
			ctnt += 
				"<form method='POST'>"+
					"<input type='hidden' name='source' value='editA'>"+
					"<input type='hidden' name='id' value='"+data[0]+"'>"+//Pass the id to the next page
					"<fieldset>"+
						"<legend>Edit Account</legend>"+
						"First Name:<br>"+
						"<input type='text' name='fName' value='"+data[1]+"' required> <br>"+
						"Birth Date:<br>"+
						"<input type='text' name='birth' value='"+data[2]+"' placeholder='mm/dd/yyyy' required> <br>"+
						"Old Password:<br>"+
						data[3]+"<br>"+
						"New Password:<br>"+
						"<input type='password' name='pWord' required> <br>"+
						"<input type='submit' value='Save Changes' style='margin-top: 0.5rem'>"+
					"</fieldset>"+
				"</form>";
			if(data[4] == ""){
			 	ctnt += "No Linked Accounts";
			}	
			else{//Data Format is: id;fn(m/f);DoB;Pw[;link1[,link2][,...]]
				var linAcc = data[4].split(",");
				ctnt += "Linked User Accounts:<br>";
				for(i=0; i<linAcc.length; i++){
					ctnt+= linAcc[i] + "<br>";
				}
			}
			ctnt+= 
				"<form method='POST'>"+
					"<input type='hidden' name='source' value='addL'>"+
					"<input type='hidden' name='id' value='"+data[0]+"'>"+//Pass the id to the next page
					"<input type='hidden' name='pWord' value='"+data[3]+"'>"+//Pass the pw to the next page
					"<fieldset>"+
						"<legend>Add User</legend>"+
						"User Account ID:<br>"+
						"<input type='text' name='lid' placeholder='u0000' required> <br>"+
						"<input type='submit' value='Link' style='margin-top: 0.5rem'>"+
					"</fieldset>"+
				"</form>";
		}
		else if(data[0].substr(0,1) == "u"){
			var uLevel = data[5].split(",")[0];
			var uPoints = data[5].split(",")[1];
			ctnt += 
				"<table>\n"+
					"<tr>"+
						"<td>ID: </td>"+
						"<td>"+data[0]+"</td>"+
					"</tr>"+
					"<tr>"+
						"<td>Level: </td>"+
						"<td>"+uLevel+"</td>"+
					"</tr>"+
					"<tr>"+
						"<td>Points: </td>"+
						"<td>"+uPoints+"</td>"+
					"</tr>"+
				"</table>\n"+
				"<form method='POST'>"+
					"<input type='hidden' name='source' value='editA'>"+
					"<input type='hidden' name='id' value='"+data[0]+"'>"+//Pass the id to the next page
					"<fieldset>"+
						"<legend>Edit Account</legend>"+
						"Sex ("+data[1]+"):<br>"+
						"<input type='radio' name='sex' value='male'> Male<br>"+
						"<input type='radio' name='sex' value='female'> Female<br>"+
						"Birth Date:<br>"+
						"<input type='text' name='birth' value='"+data[2]+"' placeholder='mm/dd/yyyy' required> <br>"+
						"Old Password:<br>"+
						data[3]+"<br>"+
						"New Password:<br>"+
						"<input type='password' name='pWord' required> <br>"+
						"<input type='submit' value='Save Changes' style='margin-top: 0.5rem'>"+
					"</fieldset>"+
				"</form>";
			if(data[4] == ""){
			 	ctnt += "No Linked Accounts";
			}	
			else{//Data Format is: id;fn(m/f);DoB;Pw;[link1[,link2][,...]]
				var linAcc = data[4].split(",");
				ctnt += "Linked Trainer Accounts:<br>";
				for(i=0; i<linAcc.length; i++){
					ctnt+= linAcc[i] + "<br>";
				}
			}
			ctnt += "<form method='POST'>"+
					"<input type='hidden' name='source' value='addL'>"+
					"<input type='hidden' name='id' value='"+data[0]+"'>"+//Pass the id to the next page
					"<input type='hidden' name='pWord' value='"+data[3]+"'>"+//Pass the pw to the next page
					"<fieldset>"+
						"<legend>Add Trainer</legend>"+
						"Trainer Account ID:<br>"+
						"<input type='text' name='lid' placeholder='t0000' required> <br>"+
						"<input type='submit' value='Link' style='margin-top: 0.5rem'>"+
					"</fieldset>"+
				"</form>";
		}
		ctnt += "<a href='/index.html' class='btn'>Return to Home</a>";
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
			"title": "Manage User Account"
		},{
			"content": ctnt
		}), function(err){res.end();});
	}
	// Returns a loading page while awaiting link
	function ret_link_loading_trainer(data){
		/*(if trainer) [loading page]set timer to look for other account (in lnusers) every 2s for 1m --> 
			[start page]create session data file, show Start button --> 
			[session control page]Append "session started at"+, show Tic Detected, Stop Session butttons
		*/
		//For Later: http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
		//Try target="_blank"
		//For Later: <body onLoad=""> "bodytag": "onLoad=''"
		var ctnt =
			"<p style='text-align:center;'><img src='/media/loading.gif' alt='Loading' width='128' height='128' align='middle'></p>"+
			"<form id='lookForm' method='POST'>"+//target='_blank'
				"<input type='hidden' name='source' value='linkloading-trainer'>"+
				"<input type='hidden' name='id' value='"+data.id+"'>"+//Pass the id to the next page
				"<input type='hidden' name='pWord' value='"+data.pWord+"'>"+//Pass the pw to the next page
				"<input type='hidden' name='lid' value='"+data.lid+"'>"+//Pass the pw to the next page
				"<input type='hidden' name='tryN' value='"+(parseInt(data.tryN)+1)+"'>"+
			"</form>"+
			"<script>"+
				"function look(){"+//send form
					"var form = document.getElementById('lookForm');"+
					"setTimeout(function(){ form.submit(); }, 2000);"+
				"}"+
			"</script>";
			
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
				"title": "Loading Link",
				"sub": data.id+" - "+data.lid,
				"bodytag": "onLoad='look()'"
			},{
				"content": ctnt
			}), function(err){res.end();});
	}
	function ret_link_loading_user(data){
		/*(if user) [loading page]set timer to look for session file every 2s for 1m -->
		[link successful page]set timer to look for "session started" every 2s for 1m -->
		[counter page]start local reward timer
		*/
		var ctnt = 
			"<p style='text-align:center;'><img src='/media/loading.gif' alt='Loading' width='128' height='128' align='middle'></p>\n"+
			"<script>\n"+
				"var tryN = 0;\n"+
				"window.onbeforeunload = leave;\n"+
				"look();\n"+
				"function look(){\n"+//send form
					//"alert('sending');\n"+
					"if(tryN < 30){\n"+
						"var xhr = new XMLHttpRequest();\n"+
						"var url = '/session/index.html';\n"+
						"var reqBody = 'source=linkloading-user"+
								"&id="+data.id+
								"&pWord="+data.pWord+
								"&lid="+data.lid+
								"&reqType=exists';\n"+
						"xhr.open('POST', url, true);\n"+
						"xhr.setRequestHeader('Content-type', 'text/plain');\n"+
						"xhr.onreadystatechange = function(){\n"+
							"if(xhr.readyState == 4){\n"+//readystate codes:http://www.w3schools.com/ajax/ajax_xmlhttprequest_onreadystatechange.asp
								//"alert(xhr.responseText)\n"+
								"if(xhr.responseText == 'wait'){\n"+//retry
									"setTimeout(look, 2000);\n"+//loop
								"}\n"+
								"else{\n"+//start session or error
									"document.open();\n"+
									"document.write(xhr.responseText);\n"+
									//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
									"document.close();\n"+
								"}\n"+
							"}\n"+
						"};\n"+
						"xhr.send(reqBody);\n"+
						"tryN++;\n"+
					"}\n"+
					"else{\n"+//Timeout
						"var xhr = new XMLHttpRequest();\n"+
						"var url = '/session/index.html';\n"+
						"var reqBody = 'source=linkloading-user"+
								"&id="+data.id+
								"&pWord="+data.pWord+
								"&lid="+data.lid+
								"&reqType=timeout';\n"+
						"xhr.open('POST', url, true);\n"+
						"xhr.setRequestHeader('Content-type', 'text/plain');\n"+
						"xhr.onreadystatechange = function(){\n"+
							"if(xhr.readyState == 4){\n"+
								"document.open();\n"+
								"document.write(xhr.responseText);\n"+
								//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
								"document.close();\n"+
							"}\n"+
						"};\n"+
						"xhr.send(reqBody);\n"+
					"}\n"+
				"}\n"+
				"function leave(){\n"+
					"var xhr = new XMLHttpRequest();\n"+
					"var url = '/session/index.html'\n"+
					"var reqBody = 'source=linkloading-user"+
								"&id="+data.id+
								"&pWord="+data.pWord+
								"&lid="+data.lid+
								"&reqType=leave';\n"+
					"xhr.open('POST', url, true);\n\n"+
					"xhr.send(reqBody);\n"+
				"}\n"+
			"</script>";
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
				"title": "Loading Link",
				"sub": data.id+" - "+data.lid
			},{
				"content": ctnt
			}), function(err){res.end();});
	}
	//Returns the page with the start button
	function ret_start_session_trainer(data){
		/*	
			[start page]show Start button --> 
			[session control page]Append "session started at"+, show Tic Detected, Stop Session butttons
		*/
		var ctnt = 
			"<form id='startButton' method='POST' style='width: 100%; text-align:center;'>\n"+//target='_blank'
				"<input type='hidden' name='source' value='start_session-trainer'>\n"+
				"<input type='hidden' name='id' value='"+data.id+"'>\n"+//Pass the id to the next page
				"<input type='hidden' name='pWord' value='"+data.pWord+"'>\n"+//Pass the pw to the next page
				"<input type='hidden' name='lid' value='"+data.lid+"'>\n"+//Pass the pw to the next page
				"<input type='submit' class='bigBtn' value='START'>\n"+
			"</form>\n"+
			"<script>\n"+
				"window.onbeforeunload = leave;\n"+
				"document.getElementById('startButton').addEventListener('click', beforeSub);"+
				"var sub = false;\n"+
				"function leave(){\n"+//delete the session file - don't bother with archive because it hasn't even started yet - tell start_user what to do when the file disappears
					"if(sub == false){\n"+//leaving by some other way than form submission
						"var xhr = new XMLHttpRequest();\n"+
						"var url = '/session/index.html';\n"+
						"var reqBody = 'source=start_session-trainer"+
							"&id="+data.id+
							"&pWord="+data.pWord+
							"&lid="+data.lid+
							"&reqType=leave';\n"+
						"xhr.open('POST', url, true);\n"+
						"xhr.send(reqBody);\n"+
					"}\n"+
				"}\n"+
				"function beforeSub(){\n"+
					//"alert('about to submit')\n"+
					"sub = true;"+
				"}\n"+
			"</script>\n";
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
				"title": "Link Successful",
				"sub": "Press Button To Start Session"
			},{
				"content": ctnt
			}), function(err){res.end();});
	}
	function ret_start_session_user(data){
		/*
			[link successful page]look for "session started" every 2s for 1m -->
			[counter page]start local reward timer
		*/
		var ctnt =
			"<p style='text-align:center;'><img src='/media/loading.gif' alt='Loading' width='128' height='128' align='middle'></p>\n"+
			"<script>\n"+
				"var tryN = 0;\n"+
				"window.onbeforeunload = leave;\n"+
				"look();\n"+
				"function look(){\n"+//send form
					//"alert('sending');\n"+
					"if(tryN < 30){\n"+
						"var xhr = new XMLHttpRequest();\n"+
						"var url = '/session/index.html';\n"+
						"var reqBody = 'source=start_session-user"+
								"&id="+data.id+
								"&pWord="+data.pWord+
								"&lid="+data.lid+
								"&reqType=started';\n"+
						"xhr.open('POST', url, true);\n"+
						"xhr.setRequestHeader('Content-type', 'text/plain');\n"+
						"xhr.onreadystatechange = function(){\n"+
							"if(xhr.readyState == 4){\n"+
								//"alert(xhr.responseText)\n"+
								"if(xhr.responseText == 'wait'){\n"+//retry
									"setTimeout(look, 2000);\n"+//loop
								"}\n"+
								"else{\n"+//session (actually) starting or error
									"document.open();\n"+
									"document.write(xhr.responseText);\n"+
									//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
									"document.close();\n"+
								"}\n"+
							"}\n"+
						"};\n"+
						"xhr.send(reqBody);\n"+
						"tryN++;\n"+
					"}\n"+
					"else{\n"+//Timeout
						"var xhr = new XMLHttpRequest();\n"+
						"var url = '/session/index.html';\n"+
						"var reqBody = 'source=start_session-user"+
								"&id="+data.id+
								"&pWord="+data.pWord+
								"&lid="+data.lid+
								"&reqType=timeout';\n"+
						"xhr.open('POST', url, true);\n"+
						"xhr.setRequestHeader('Content-type', 'text/plain');\n"+
						"xhr.onreadystatechange = function(){\n"+
							"if(xhr.readyState == 4){\n"+
								"document.open();\n"+
								"document.write(xhr.responseText);\n"+
								//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
								"document.close();\n"+
							"}\n"+
						"};\n"+
						"xhr.send(reqBody);\n"+
					"}\n"+
				"}\n"+
				"function leave(){\n"+
					"var xhr = new XMLHttpRequest();\n"+
					"var url = '/session/index.html';\n"+
					"var reqBody = 'source=start_session-user"+
								"&id="+data.id+
								"&pWord="+data.pWord+
								"&lid="+data.lid+
								"&reqType=leave';\n"+
					"xhr.open('POST', url, true);\n"+
					"xhr.send(reqBody);\n\n"+
				"}\n"+
			"</script>";
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
				"title": "Link Successful",
				"sub": "  -  waiting for session to start"
			},{
				"content": ctnt
			}), function(err){res.end();});
	}
	function ret_session_trainer(data){
		//[session control page] show Tic Detected, Stop Session butttons
		var ctnt =
		"<p style='text-align:center'>\n"+
		  "<button type='button' class='bigBtn' id='ticBtn'>Tic Detected</button><br>\n"+
		  "<button type='button' class='bigBtn' id='endBtn'>End Session</button>\n"+
		"</p>\n"+
		"<script>\n"+
			"window.onbeforeunload = endS;"+
			"document.getElementById('ticBtn').addEventListener('click', tic);\n"+
			"document.getElementById('endBtn').addEventListener('click', endS);\n"+
		  "function tic(){\n"+
		    "var xhr = new XMLHttpRequest();\n"+
				"var url = '/session/index.html';\n"+
				"var reqBody = 'source=session-trainer"+
					"&id="+data.id+
					"&pWord="+data.pWord+
					"&lid="+data.lid+"';\n"+
				"xhr.onreadystatechange = function(){\n"+
					"if(xhr.readyState == 4){\n"+//just check that everything is fine
						"if(xhr.status != 200){\n"+
							"var errP = xhr.responseText;\n"+
							"document.open();"+
							"document.write(errP);"+
							"document.close();"+
						"}\n"+
						"else{\n"+
							"if(xhr.responseText != 'good'){\n"+//end page
								"document.open();\n"+
								"document.write(xhr.responseText);\n"+
								//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
								"document.close();\n"+
							"}\n"+
						"}\n"+
					"}\n"+
				"};\n"+
				"xhr.open('POST', url, true);\n"+
				"xhr.send(reqBody);\n"+
		  "}\n"+
		  "function endS(){\n"+
				"var xhr = new XMLHttpRequest();\n"+
				"var url = '/session/index.html';\n"+
				"var reqBody = 'source=session_end-trainer"+
					"&id="+data.id+
					"&pWord="+data.pWord+
					"&lid="+data.lid+"';\n"+
				"xhr.onreadystatechange = function(){\n"+
					"if(xhr.readyState == 4){\n"+//just check that everything is fine
						"document.open();\n"+
						"document.write(xhr.responseText);\n"+
						//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
						"document.close();\n"+
					"}\n"+
				"};\n"+
				"xhr.open('POST', url, true);\n"+
				"xhr.send(reqBody);\n"+
		  "}\n"+
		"</script>";
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
				"title": "TicTrainer Session: Trainer"
			},{
				"content": ctnt
			}), function(err){res.end();});
	}
	function ret_session_user(data){
		//[session page] show counter, start local reward timer
		var ctnt = 
		"<table id='display' style='width:100%;'>"+
		"<td id='pCounter' class='bigCounter'>"+data.points+"</td>\n"+
		"<td id='rCounter' class='medCounter'>0</td></table>\n"+
		"<script>\n"+
			"window.onbeforeunload = endS;"+
			"var points = "+data.points+";\n"+//body.?????????
			"var level = "+data.level+";\n"+
			"if(level == 0){\n"+
				"level = 1;\n"+
				"alert('It appears to be your first session. Try not to tic.');\n"+//First time spiel
			"}\n"+
			"var nextLevel = 1000*level*level*level;\n"+
			"var cap = 10*level*level;\n"+
			"var rate = 0;\n"+
			"var lastL = "+data.sesL+";\n"+
			"update_display();\n"+
			"frame();\n"+
			"function frame(){\n"+
				"var xhr = new XMLHttpRequest();\n"+
				"var url = '/session/index.html';\n"+
				"var reqBody = 'source=session-user"+
					"&id="+data.id+
					"&pWord="+data.pWord+
					"&lid="+data.lid+
					"&sesL='+lastL;\n"+
				"xhr.open('POST', url, true);\n"+
				"xhr.setRequestHeader('Content-type', 'text/plain');\n"+//application/x-www-form-urlencoded
				"xhr.onreadystatechange = function(){\n"+
					"if(xhr.readyState == 4) {\n"+//4: request finished & response ready - readystate codes:http://www.w3schools.com/ajax/ajax_xmlhttprequest_onreadystatechange.asp
						"if(xhr.status == 200){\n"+
							"var tic = 0;"+
							"var end = 0;"+
							"if(xhr.responseText != 'none'){\n"+
								"var fields = xhr.responseText.split('&');\n"+
								"lastL = fields[0]\n"+
								"for(i=0; i<fields.length; i++){\n"+
									"if(fields[i] == 'tic') tic++;"+
									"if(fields[i] == 'end') end++;"+
                  "}\n"+
							"}\n"+
							"if(end == 0){\n"+
							  "if(tic == 0){\n"+
                  /* Continue with the frame*/
                  "if(rate < cap){\n"+
                  	"rate += level*level;\n"+
                  	"if(rate > cap)//Overshot\n"+
                  		"rate = cap;\n"+
                  "}\n"+
                  "points += rate;\n"+
                  "if(points > nextLevel)\n"+
                  	"levelUp();\n"+
                "}\n"+
                "else{ ticTrigger(); }\n"+
								"update_display();\n"+
								"setTimeout(function(){ frame(); }, 1000*level);\n"+
							"}\n"+
							"else{ endS(); }\n"+
						"}\n"+
						"else{\n"+
							"document.open();\n"+
							"document.write(xhr.responseText);\n"+
							//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
							"document.close();\n"+
						"}\n"+//ERROR
					"}\n"+
				"};\n"+
				"xhr.send(reqBody);\n"+
			"}\n"+
			"function ticTrigger(){\n"+//Flash red
			  "rate = 0;\n"+
			  "document.getElementById('display').setAttribute('style', 'background-color:red; width:100%;');\n"+
			  "setTimeout(function(){document.getElementById('display').setAttribute('style', 'width:100%;');}, 1000)\n"+
			"}\n"+
			"function endS(){\n"+
				"var xhr = new XMLHttpRequest();\n"+
				"var url = '/session/index.html'\n"+
				"var reqBody = 'source=session_end-user"+//source,id,pWord,lid,level,points
					"&id="+data.id+
					"&pWord="+data.pWord+
					"&lid="+data.lid+
					"&level='+level+'&points='+points;\n"+
				"xhr.open('POST', url, true);\n"+
				"xhr.onreadystatechange = function(){\n"+
					"if(xhr.readyState == 4){\n"+
						"document.open();\n"+
						"document.write(xhr.responseText);\n"+
						//"document.getElementById('entire-page').innerHTML = xhr.responseText\n"+
						"document.close();\n"+
					"}"+
				"}\n"+
				"xhr.send(reqBody);\n"+
			"}\n"+/*
			"function endSync(){\n"+
				"var xhr = new XMLHttpRequest();\n"+
				"var url = '/session/index.html'\n"+
				"var reqBody = 'source=session_end-user"+//source,id,pWord,lid,level,points
					"&id="+data.id+
					"&pWord="+data.pWord+
					"&lid="+data.lid+
					"&level='+level+'&points='+points;\n"+
				"xhr.open('POST', url, false);\n"+
				"xhr.send(reqBody);\n"+
				"return null;"+
			"}\n"+*/
			"function levelUp(){\n"+
				"level++;\n"+
				"nextLevel = 1000*level*level*level;\n"+
				"cap = 10*level*level;\n"+
				//Flash green (this green is 10% lighter than the green in the page header)
			  "document.getElementById('display').setAttribute('style', 'background-color:#1fe080; width:100%;');\n"+
			  "setTimeout(function(){document.getElementById('display').setAttribute('style', 'width:100%;');}, 1000)\n"+
			"}\n"+
			"function update_display(){\n"+
				"document.getElementById('pCounter').innerHTML = points;\n"+
				"document.getElementById('rCounter').innerHTML = '+'+rate;\n"+
			"}\n"+
		"</script>";
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
				"title": "TicTrainer Session: User",
				//"bodytag": "onbeforeunload: 'endS()'"
			},{
				"content": ctnt
			}), function(err){res.end();});
	}
	function ret_session_ended(data){
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write(genPage({
			"title": "Session Ended"
					},{
						"content": "<a href='/' class='btn'>Return to Home</a>"
					}), function(err){res.end();});
	}
	
	/* Returns the requested file
	*/
	function loadRequestedFile(URL){
		//Non-POST: serve requested file
		debugShout("Request for " + pathname + " received.", 1);
		//Choose the appropriate content type based on the file extension
		var ext = pathname.substr(pathname.lastIndexOf("."));
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
			case ".ico":
				cType = "image/x-icon";
				break;
			case ".png":
				cType = "image/png";
				break;
			default:
				cType = "text/plain"
		}
		debugShout("which is of type "+cType, 3);
		if(ext == ".data"){
			// Don't serve sensitive data
			res.writeHead(403, {"Content-Type": "text/html"});
			res.end();
		}
		else{
			// Read the requested file content and send it
			fs.readFile("./"+pathname.substr(1), function (err, data) {
				if (err) {
					// HTTP Status: 404 : NOT FOUND
					res.writeHead(404, {"Content-Type": 'text/html'});
					// Send the response
					res.end();
				}else{
					// HTTP Status: 200 : OK
					res.writeHead(200, {"Content-Type": cType});	
					// Write the content of the file to response body
					res.write(data, function(err){res.end();});
				}
			});
		}
	}
	
	//Handle POST requests
	if(req.method == "POST"){
		debugShout("Post request recieved from "+pathname, 1);
		//console.log(req);
		var body = [];
		req.on('data', function(chunk) {
			body.push(chunk);
		}).on('end', function(){
			var qs = require("querystring");
			body = qs.parse(Buffer.concat(body).toString());
			debugShout(body);
			//Decide what to do with the request based on its source
			switch(pathname){
				case "/register/trainer.html":
					var reg = require("./register/register.js");
					//trainer data (td) returned: iD;FN;bD;pass OR Error
					reg.add_trainer(body, function(td){
						//Return the appropriate message
						switch(td){
							case "fe":
							case "dfe":
							case "pce":
							case "ice":
							ret_error(td, "/register/trainer.html");
							break;
							
							default:
								ret_created(td);
							break;
						}
					});
				break;
				case "/register/user.html":
					var reg = require("./register/register.js");
					reg.add_user(body, function(ud){
						//Return the appropriate message
						switch(ud){
							case "fe":
							case "dfe":
							case "pce":
							case "ice":
							ret_error(ud, "/register/user.html");
							break;
							
							default:
								ret_created(ud);
							break;
						}
					});
				break;
				case "/account.html":
					function ret(data){
						switch(data){
							case "fe":
							case "ide":
							case "pce":
							case "anfe":
								ret_error(data, "/account.html");
							break;
							
							default:
								ret_manage_account(data);
							break;
						}
					}
					switch(body.source){
						case "manageAccount":
						var iD = body.id;
						var pass = body.pWord;
						//This is called by fs.readFile with the loaded account data as an argument (or an error)
						var file = "./";
						if(iD.substr(0,1) == "t")
							file += "trainer.data";
						else if(iD.substr(0,1) == "u")
							file += "user.data";
						else{
							ret("ide");
							debugShout("ID="+iD+" and substr="+iD.substr(0,1)+"\n");
							break;//Exit body.source switch
						}
						if(isNaN(iD.substr(1))){
							ret("ide");
						}
						fs.readFile(file, "utf8", function(err, data){
							if(err)
								ret("fe");
							else{
								var people = data.split("\n");
								var found = false;
								for(i=0; i < people.length; i++){
									personFields = people[i].split(";");
									if(personFields[0] == iD){
										found = true;
										if(personFields[3] == pass)
											ret(personFields);//Success
										else
											ret("pce");//Password Confirmation Error
										break;//Exit for
									}
								}
								if(!found)
									ret("anfe");//Account not found error
							}
						});
						break;
						case "editA"://Source: Edit {id, (fName/sex), birth, pWord}
							var iD = body.id;
							var file = "./";
							debugShout("Editing "+iD, 1);
							if(iD.substr(0,1) == "t")
								file += "trainer.data";
							else if(iD.substr(0,1) == "u")
								file += "user.data";
							else{
								ret("ide");
								debugShout("ID="+iD+" and substr="+iD.substr(0,1)+"\n");
								break;//Exit body.source switch
							}
							if(isNaN(iD.substr(1))){
								ret("ide");
							}
							fs.readFile(file, "utf8", function(err, data){
								if(err){
									ret("fe");
								}
								else{
									/*Including \n makes it safer. 
									Otherwise, if somebody makes their password "abct0011fcsda", trainer 11 is broken.
									Now, just make something prevent escape characters. In form submission.*/
									var newAData = toData(body);// \n+ {id, (fName/sex), birth, pWord}
									var accIndex = data.indexOf("\n"+iD);
									var dBefore = data.substring(0, accIndex);
									var dAfter = data.substring(accIndex);
									var endIndex = 1+indexNOf(dAfter, ";", 4);
									dAfter = dAfter.substring(endIndex);//Should include any linked accounts as well (as points for users)
									var newData =  dBefore+ newAData+ dAfter;
									//Save the changes. Do it sync, so nobody edits it in between
									fs.writeFileSync(file, newData, "utf-8");
									debugShout(file+" saved");
									fs.readFile(file, "utf8", function(err, data2){
										if(err)
											ret("fe");
										else{
											var people = data2.split("\n");
											var found = false;
											for(i=0; i < people.length; i++){
												personFields = people[i].split(";");
												if(personFields[0] == iD){
													found = true;
													if(personFields[3] == body.pWord)
														ret(personFields);//Success - Return manage_account(data)
													else
														ret("pce");//Password Confirmation Error
													break;//Exit for
												}
											}
											if(!found)
												ret("anfe");//Account not found error
										}
									});
								}
							});
						break;
						case "addL"://Add Account Link
							var iD = body.id;// body = {source, id, lid, pWord}
							var lID = body.lid;
							var file = "./";
							var lFile = "./";
							debugShout("Editing "+iD, 1);
							if(iD.substr(0,1) == "t"){
								file += "trainer.data";
								lFile += "user.data";
							}
							else if(iD.substr(0,1) == "u"){
								file += "user.data";
								lFile += "trainer.data";
							}
							else{
								ret("ide");//Id format error
								debugShout("ID="+iD+" and substr="+iD.substr(0,1)+"\n");
								break;//Exit body.source switch
							}
							if(lID.substr(0,1) != "t" && lID.substr(0,1) != "u"){
								ret("ide");
								debugShout("lID="+lID+" and substr="+lID.substr(0,1)+"\n");
								break;//Exit body.source switch
							}
							if(isNaN(iD.substr(1)) || isNaN(lID.substr(1))){
								ret("ide");
								break;//Exit body.source switch
							}
							//Check that the user exists
							fs.readFile(lFile, "utf8", function(err, data){
								if(err){
									ret("fe");
								}
								else{
									var lIndex = data.indexOf("\n"+lID);
									if(lIndex == -1)
										ret("anfe");
									else{
										fs.readFile(file, "utf8", function(err, data2){
											if(err){
												ret("fe");
											}
											else{
												/*Including \n makes it safer. 
												Otherwise, if somebody makes their password "abct0011fcsda", trainer 11 is broken.
												Now, just make something prevent escape characters. In form submission.*/
												var accIndex = data2.indexOf("\n"+iD);//e.g. data2 = "-----\nu0000;male;1/1/1;pass;t0000,t0001;0,0;\n-----"
												var dAcc = data2.slice(accIndex).split("\n")[1];
												//Absolute index of the section with the links (+1 for "\n" and +1 for ";" = +2)
												var lIndex = 2+accIndex+indexNOf(dAcc, ";", 4);//After the fourth ";"//e.g. 29
												var dBefore = data2.slice(0, lIndex);//e.g. "-----\nu0000;male;1/1/1;pass;"
												//Later, this will become the data after the links
												var dAfter = data2.slice(lIndex); //e.g. "t0000,t0001;0,0;\n-----"
												var endIndex = dAfter.indexOf(";");//End of the link section // e.g. 11
												var dLinks = dAfter.slice(0, endIndex);//e.g. t0000,t0001
													dAfter = dAfter.slice(endIndex);//Includes ";" //e.g. ";0,0;\n-----"
												
												var newLData = lID;//e.g. "t0002"
												if(dLinks != ""){
													//verify that the account is not already linked
													var linkedA = dLinks.split(",");//split
													for(i=0; i<linkedA.length; i++){
														if(linkedA[i] == lID){
															var oldAccData = dAcc.split(";");
															ret(oldAccData);
															newLData = "already";
														}
													}
													newLData += ",";
												}
												if(newLData != "already,"){
													newLData += dLinks;//append existing links //e.g. "t0002,t0000,t0001"
													var newData =  dBefore+ newLData+ dAfter;
													//Save the changes. Do it sync so the file doesn't get edited inbetween
													fs.writeFileSync(file, newData, "utf-8");
													fs.readFile(file, "utf8", function(err, data3){
														if(err)
															ret("fe");
														else{
															var people = data3.split("\n");
															var found = false;
															for(i=0; i < people.length; i++){
																personFields = people[i].split(";");
																if(personFields[0] == iD){
																	found = true;
																	if(personFields[3] == body.pWord)
																		ret(personFields);//Success - Return manage_account(data)
																	else
																		ret("pce");//Password Confirmation Error
																	break;//Exit for
																}
															}
															if(!found)
																ret("anfe");//Account not found error
														}
													});
												}//No need for a ret() statement here, it happened earlier
											}
										});
									}
								}
							});
						break;
					}//Switch (body.source) (Within /account.html)
				break;
				case "/session/index.html":
					switch(body.source){
						case "newSession"://{source, id, pWord, lid}			
							/**handle form submission for new session
							verify password, 
							check that accounts are linked,
							(if user) add id to lnusers.data,
								[loading page]set timer to look for session file every 2s for 1m -->
								[link successful page]set timer to look for "session started" every 2s for 1m -->
									[counter page]start local reward timer

							(if trainer) [loading page]set timer to look for other account (in lnusers) every 2s for 1m --> 
								[start page]create session data file, show Start button --> 
									[session control page]Append "session started at"+, show Tic Detected, Stop Session butttons
							 */
							var newSes = require("./session/newSes.js");				
							newSes.new_session(body, function(result){
								switch(result){
									case "ide":
									case "fe":
									case "anle":
									case "pce":
									case "anfe":
										debugShout("error within session.js");
										ret_error(result, "/session/index.html");
									break;
									case "success":
										body.tryN = 0;
										//Go to Link Loading Page
										if(body.id.substring(0,1)=="t")
											ret_link_loading_trainer(body);
										else //b.i.sub() is definitely "u" because the error would have already been caught otherwise
											ret_link_loading_user(body);
									break;
								}
							});
						break;
						case "linkloading-trainer"://{source, id, pWord, lid, tryN } tryN is the try number
							if(body.tryN < 30){
								//All the errors for id format have been caught already
								fs.readFile("./session/lnusers.data", "utf-8", function(err, data){
									//look for other account
									var searchEntry = "\n" +body.lid+ "," +body.id;
									var iSE = data.indexOf(searchEntry);
									if(iSE == -1){
										//Wait two seconds and try again
										ret_link_loading_trainer(body);
									}
									else{
										var iSEEnd = iSE + searchEntry.length;
										var newData = data.substring(0, iSE) + data.substring(iSEEnd, data.length);
										//Cut out entry
										fs.writeFileSync("./session/lnusers.data", newData, "utf-8");
										//make a session file - this should only exist for the duration of the session.
										//when the session ends, rename and copy the file to an archive: ./session/archive
										var sesFileName = "./session/session"+ body.id + body.lid + ".data";
										fs.writeFile(sesFileName, "", function(err){
											if(err)
												ret_error("fe", "/session/index.html");
											else
												ret_start_session_trainer(body);//source, id, pWord, lid, tryN 
										});
									}
								});
							}
							else{//Timeout
								ret_error("toe", "/session/index.html");
							}
						break;
						case "linkloading-user"://source, id, pWord, lid, tryN 
							/*(if user) [loading page]set timer to look for session file every 2s for 1m -->
							*/
							if(body.reqType == 'leave' || body.reqType == 'timeout'){
								//remove entry in lnusers
								fs.readFile("./session/lnusers.data", "utf-8", function(err, data){
									var searchEntry = "\n" +body.id+ "," +body.lid;
									debugShout("attempting to delete entry: "+searchEntry)
									var iSE = data.indexOf(searchEntry);
									if(iSE == -1){
										ret_error("fe", "/session/index.html");
									}
									else{
										var iSEEnd = iSE + searchEntry.length;
										var newData = data.substring(0, iSE) + data.substring(iSEEnd, data.length);
										fs.writeFileSync("./session/lnusers.data", newData, "utf-8");//Cut out entry
										if(body.reqType == 'timeout')
											ret_error("toe", "/session/index.html");
									}
								});
							}
							else if(body.reqType == 'exists'){
								var searchFile = "./session/session"+ body.lid + body.id + ".data";
								fs.stat(searchFile, function(err, stats){
									if(err == null){//File exists
										body.tryN = 0;
										ret_start_session_user(body);
									}
									else if(err.code == "ENOENT"){//File does not exist
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("wait", function(err){res.end();});
									}
									else//Some other error
										ret_error("fe", "/session/index.html");
								});
							}
						break;
						case "start_session-trainer"://source, id, pWord, lid
							//If aborting, delete the session file - don't bother with archive because it hasn't even started yet
							if(body.reqType == 'leave'){
								var sesFile = "./session/session" + body.id + body.lid + ".data";
								debugShout("1216", 3);
								fs.unlink(sesFile, function(err){
									if(err)
										ret_error("fe");
								});
							}
							else{ //START pressed
								var sesFile = "./session/session"+ body.id + body.lid + ".data";
								//If file does not exist, the user must have left early
								fs.stat(sesFile, function(err){
									if(err){
										if(err.code == "ENOENT"){//user left (or magic ghosts deleted the file){
											ret_session_ended(body);
											debugShout("1228", 3);
										}
										else
											ret_error("fe","/session/index.html");
									}
									else{//file exists
										//Append "session started at"+time, show Tic Detected, Stop Session butttons
										var sEntry = "session started at:" + time();
										fs.appendFile(sesFile, sEntry, function(err){
											if(err)
												ret_error("fe", "/session/index.html");
											else{
												ret_session_trainer(body);
											}
										});
										
									}
								});
							}
						break;
						//See if the session has started
						case "start_session-user"://source, id, pWord, lid, tryN 
							if(body.reqType == 'leave' || body.reqType == 'timeout'){
								//end session - it has not started yet, so just delete it
								var sesFile = "./session/session" + body.lid + body.id + ".data";
								fs.unlink(sesFile, function(err){
									if(err){
										ret_error("fe");
									}
									else{
										ret_session_ended(body);
									}
								});
							}
							else if(body.reqType == 'started'){
								//has the session started
								var searchFile = "./session/session"+ body.lid + body.id + ".data";
								fs.readFile(searchFile, "utf-8", function(err, data){
									if(err){
										if(err.code == "ENOENT")//trainer left
											ret_session_ended(body);
										else
											ret_error("fe");
									}
									else{
										if(data.indexOf("session started at:") == -1){
											//return 'wait'
											res.writeHead(200, {"Content-Type": "text/plain"});
											res.write("wait", function(err){res.end();});
										}
										else{
											//load level and points from user.data and start session
											fs.readFile("./user.data", "utf-8", function(err, data2){
												if(err){
													ret_error("fe");
												}
												else{
													var people = data2.split("\n");
													var found = false;
													for(i=0; i < people.length; i++){
														personFields = people[i].split(";");
														if(personFields[0] == body.id){
															found = true;
															if(personFields[3] == body.pWord){
																var lpData = personFields[5].split(",");
																body.level = lpData[0];
																body.points = lpData[1];
																body.sesL = data.length;//current session file length (just one entry)
																ret_session_user(body);
															}
															else
																ret_error("pce", "/session/index.html");//Password Confirmation Error
															break;//Exit for
														}
													}
													if(!found){
														debugShout("anfe 1496");
														ret_error("anfe");//Account not found error
													}
												}
											});
										}
									}
								});
							}
						break;
						case "session-trainer"://Tic. body= source:session-trainer, id:t0000, pWord: , lid:u0000
							var sesFile = "./session/session"+ body.id + body.lid + ".data";
							var tEntry = "\ntic detected at:" +time();
							fs.stat(sesFile, function(err, stats){
								if(err == null){//File exists
									fs.appendFile(sesFile, tEntry, function(err){
										if(err)//Why would this happen? 
											ret_error("fe");
										else{
											res.writeHead(200, {"Content-Type": "text/plain"});
											res.write("good", function(err){res.end();});
										}
									});
								}
								//File does not exist. 
								//This happens when the user has ended the session already
								else if(err.code == "ENOENT"){
									ret_session_ended(body);
								}
								else//Some other error
									ret_error("fe", "/session/index.html");
							});
							
						break;
						case "session-user"://body: source, id, pWord, lid
							//Requests made from the ongoing user session
							/*Check the session file here for tic detected or session ended*/
							var sesFile = "./session/session"+ body.lid + body.id + ".data";
							fs.readFile(sesFile, "utf-8", function(err, data){
								if(err){
									ret_error("fe");
								}
								else{
									var oldL = body.sesL;
									var newL = data.length;
									//File has been edited since you last checked
									if(newL > oldL){
										debugShout("old: "+oldL+"new:"+newL+"sub: "+data.slice(oldL+1));
										var entries = data.slice(oldL).split("\n");// = cut off first ""\n
										debugShout("deltadata == "+entries);
										var retMessage = data.length.toString();//new sesL
										for(i = 1; i<entries.length; i++){//i=1 cut off first ""\n
											var entryType = entries[i].split(" at:")[0];//First half
											switch(entryType){
												case "tic detected":
													retMessage += "&tic";
												break;
												case "session ended":
													retMessage += "&end";
												break;
												default:
													retMessage += "&?";
												break;
											}
										}
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write(retMessage, function(err){res.end();});
									}
									else{
										res.writeHead(200, {"Content-Type": "text/plain"});
										res.write("none", function(err){res.end();});
									}
								}
							});
						break;
						case "session_end-trainer":
							debugShout("1393", 3);
							var sesFile = "./session/session" + body.id + body.lid + ".data";
							var eEntry = "\nsession ended at:"+time();
							fs.stat(sesFile, function(err, stats){
								if(err == null){//File exists
									debugShout("1398", 3);
									fs.appendFile(sesFile, eEntry, function(err){//should I also archive it? No, the user needs to save their new points and level
										if(err)
											ret_error("fe");
										else{
											ret_session_ended(body);
										}
									});
								}
								//File does not exist. 
								//This happens when the user has ended the session already
								else if(err.code == "ENOENT"){
									ret_session_ended(body);
								}
								else//Some other error
									ret_error("fe", "/session/index.html");
							});
						break;
						case "session_end-user":
							var sesFile = "./session/session" + body.lid + body.id + ".data";
							var sF2 = "./session/archive/session" + body.lid + body.id + time("forfile") + ".data";
							var uFile = "./user.data";
							fs.readFile(uFile, "utf-8", function(err, data){
								if(err)
									ret_error("fe");
								else{
									var accIndex = data.indexOf("\n"+body.id);
									var aData = data.substring(accIndex+1);
										aData = aData.substring(0, aData.indexOf("\n"));
									var pass = aData.split(";")[3];
									if(body.pWord == pass){
										var lpIndex = accIndex + 1+indexNOf(data.substr(accIndex), ";", 5);//Index of the level and points info
										var afterlp = accIndex + indexNOf(data.substr(accIndex), ";", 6);
										var dBefore = data.substring(0, lpIndex);
										var dAfter = data.substring(afterlp);
										var newLp = body.level + "," + body.points;
										var newData = dBefore + newLp + dAfter;
										fs.writeFileSync(uFile, newData, "utf-8");//If you let the edit be postponed, it could be edited inbetween. 
									}
									else{
										ret_error("pce");
									}
									fs.readFile(sesFile, "utf-8", function(err, data){
										if(err)
											ret_error("fe");
										else{
											if(data.indexOf("session ended") == -1){
												var eEntry = "\nsession ended at:"+time();
												fs.appendFile(sesFile, eEntry, function(err){
													if(err)
														ret_error("fe");
													else{
														//Archive the session file under a new name
														fs.rename(sesFile, sF2, function(err){
															if(err){
																ret_error("fe");
															}
															else{
																ret_session_ended(body);
															}
														});
													}
												});
											}
											else{
												//Archive the session file under a new name
												fs.rename(sesFile, sF2, function(err){
													if(err){
														ret_error("fe");
													}
													else{
														ret_session_ended(body);
													}
												});
											}
										}
									});
								}
							});
						break;
					}
				break;
			}
		});
	}
	else{
		loadRequestedFile(pathname);
	}
}

//Create server using hR
var server = http.createServer(handleRequest);

//Start server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening.
    console.log("Server listening on: http://localhost:" + PORT);
});


/*Code Graveyard:
start session-user periodic form submit: 

			"<p style='text-align:center;'><img src='/media/loading.gif' alt='Loading' width='128' height='128' align='middle'></p>"+
			"<form id='lookForm' method='POST'>"+//target='_blank'
				"<input type='hidden' name='source' value='start_session-user'>"+
				"<input type='hidden' name='id' value='"+data.id+"'>"+//Pass the id to the next page
				"<input type='hidden' name='pWord' value='"+data.pWord+"'>"+//Pass the pw to the next page
				"<input type='hidden' name='lid' value='"+data.lid+"'>"+//Pass the pw to the next page
				"<input type='hidden' name='tryN' value='"+(parseInt(data.tryN)+1)+"'>"+
			"</form>"+
			"<script>"+
				"function look(){"+//send form
					"var form = document.getElementById('lookForm');"+
					"setTimeout(function(){ alert('looking'); form.submit(); }, 2850);"+
				"}"+
			"</script>";
			 - server-side:
							if(body.tryN < 30){
								var sesFile = "./session/session"+ body.lid + body.id + ".data";
								fs.readFile(sesFile, "utf-8", function(err, data){
									if(err)//Session file got deleted somehow
										ret_error("fe", "/session/index.html");
									else if(data.indexOf("session started at:") == -1)//Session has not started
										ret_start_session_user(body);
									else{
										fs.readFile("./user.data", "utf-8", function(err, data2){
											if(err){
												ret_error("fe");
											}
											else{
												var people = data2.split("\n");
												var found = false;
												for(i=0; i < people.length; i++){
													personFields = people[i].split(";");
													if(personFields[0] == body.id){
														found = true;
														if(personFields[3] == body.pWord){
															var lpData = personFields[5].split(",");
															body.level = lpData[0];
															body.points = lpData[1];
															body.sesL = data.length;//current session file length (just one entry)
															ret_session_user(body);
														}
														else
															ret_error("pce 1086");//Password Confirmation Error
														break;//Exit for
													}
												}
												if(!found){
													debugShout("anfe 1091");
													ret_error("anfe");//Account not found error
												}
											}
										});
									}
								});
							}
							else{
								ret_error("toe", "/session/index.html");
							}
			
llu:
					"var form = document.getElementById('lookForm');"+
					"form.submit();"+
linkloading_trainer
		var ctnt_v2 = //Using ajax. I'm abandoning this for now because the form method works.
			"<p style='text-align:center;'><img src='/media/loading.gif' alt='Loading' width='128' height='128' align='middle'></p>"+
			"<form id='lookForm' method='POST'>"+//target='_blank'
				"<input type='hidden' name='source' value='linkloading-trainer'>"+
				"<input type='hidden' name='id' value='"+data.id+"'>"+//Pass the id to the next page
				"<input type='hidden' name='pWord' value='"+data.pWord+"'>"+//Pass the pw to the next page
				"<input type='hidden' name='lid' value='"+data.lid+"'>"+//Pass the pw to the next page
				"<input type='hidden' name='tryN' value='"+(parseInt(data.tryN)+1)+"'>"+
			"</form>"+
			"<script>"+
				"function look(){"+//send form
					"var xhr = new XMLHttpRequest();"+
					"var url = '/session/index.html';"+
					"var reqBody = 'source=linkloading-trainer"+
							"&id="+data.id+
							"&pWord="+data.pWord+
							"&lid="+data.lid+
							"&tryN="+(parseInt(data.tryN)+1)+"';"+
					"xhr.open('POST', url, true);"+
					"xhr.setRequestHeader('Content-type', 'text/plain');"+
					"xhr.onreadystatechange = function(){"+
						"if(xhr.readyState == 4 && xhr.status == 200) {"+//readystate codes:http://www.w3schools.com/ajax/ajax_xmlhttprequest_onreadystatechange.asp
							"alert(xhr.responseText);"+
							
							"setTimeout(function(){ look(); }, 2000);"+//loop
							
						"}"+
					"};"+
					"xhr.send(reqBody);"+
				"}"+
			"</script>";

		var ctnt = 
		"<table id='display' style='width:100%;'>"+
		"<td id='pCounter' class='bigCounter'>"+data.points+"</td>\n"+
		"<td id='rCounter' class='medCounter'>0</td></table>\n"+
		"<form id='endF' method='POST'>\n"+
			"<input type='hidden' name='source' value='session_end-user'>\n"+
			"<input type='hidden' name='id' value='"+data.id+"'>\n"+//Pass the id to the next page
			"<input type='hidden' name='pWord' value='"+data.pWord+"'>\n"+//Pass the pw to the next page
			"<input type='hidden' name='lid' value='"+data.lid+"'>\n"+//Pass the trainer id to the next page
			"<input type='hidden' id='levelI' name='level' value='"+data.level+"'>\n"+
			"<input type='hidden' id='pointsI' name='points' value='"+data.points+"'>\n"+
		"</form>\n"+
		"<script>\n"+
			"window.onbeforeunload = endS;"+
			"var points = "+data.points+";\n"+//body.?????????
			"var level = "+data.level+";\n"+
			"if(level == 0){\n"+
				"level = 1;\n"+
				"alert('It appears to be your first session. Try not to tic.');\n"+//First time spiel
			"}\n"+
			"var nextLevel = 1000*level*level*level;\n"+
			"var cap = 10*level*level;\n"+
			"var rate = 0;\n"+
			"var lastL = "+data.sesL+";\n"+
			"update_display();\n"+
			"frame();\n"+
			"function frame(){\n"+
				"var xhr = new XMLHttpRequest();\n"+
				"var url = '/session/index.html';\n"+
				"var reqBody = 'source=session-user"+
					"&id="+data.id+
					"&pWord="+data.pWord+
					"&lid="+data.lid+
					"&sesL='+lastL;\n"+
				"xhr.open('POST', url, true);\n"+
				"xhr.setRequestHeader('Content-type', 'text/plain');\n"+
				"xhr.onreadystatechange = function(){\n"+
					"if(xhr.readyState == 4) {\n"+//4: request finished & response ready - readystate codes:http://www.w3schools.com/ajax/ajax_xmlhttprequest_onreadystatechange.asp
						"if(xhr.status == 200){\n"+
							"var tic = 0;"+
							"var end = 0;"+
							"if(xhr.responseText != 'none'){\n"+
								"var fields = xhr.responseText.split('&');\n"+
								"lastL = fields[0]\n"+
								"for(i=0; i<fields.length; i++){\n"+
									"if(fields[i] == 'tic') tic++;"+
									"if(fields[i] == 'end') end++;"+
                  "}\n"+
							"}\n"+
							"if(end == 0){\n"+
							  "if(tic == 0){\n"+
                  // Continue with the frame
                  "if(rate < cap){\n"+
                  	"rate += level*level;\n"+
                  	"if(rate > cap)//Overshot\n"+
                  		"rate = cap;\n"+
                  "}\n"+
                  "points += rate;\n"+
                  "if(points > nextLevel)\n"+
                  	"levelUp();\n"+
                "}\n"+
                "else{ ticTrigger(); }\n"+
								"update_display();\n"+
								"setTimeout(function(){ frame(); }, 1000*level);\n"+
							"}\n"+
							"else{ endS(); }\n"+
						"}\n"+
						"else{\n"+
							"var errP = xhr.responseText;\n"+
							"document.getElementById('mainC').innerHTML = errP;\n"+
						"}\n"+//ERROR
					"}\n"+
				"};\n"+
				"xhr.send(reqBody);\n"+
			"}\n"+
			"function ticTrigger(){\n"+//Flash red
			  "rate = 0;\n"+
			  "document.getElementById('display').setAttribute('style', 'background-color:red; width:100%;');\n"+
			  "setTimeout(function(){document.getElementById('display').setAttribute('style', 'width:100%;');}, 1000)\n"+
			"}\n"+
			"function endS(){\n"+
				"document.getElementById('levelI').setAttribute('value', level);\n"+
				"document.getElementById('pointsI').setAttribute('value', points);\n"+
				"var form = document.getElementById('endF');\n"+
				"form.submit();\n"+
				"return null;"+
			"}\n"+
			"function levelUp(){\n"+
				"level++;\n"+
				"nextLevel = 1000*level*level*level;\n"+
				"cap = 10*level*level;\n"+
				//Flash green
			  "document.getElementById('display').setAttribute('style', 'background-color:green; width:100%;');\n"+
			  "setTimeout(function(){document.getElementById('display').setAttribute('style', 'width:100%;');}, 1000)\n"+
			"}\n"+
			"function update_display(){\n"+
				"document.getElementById('pCounter').innerHTML = points;\n"+
				"document.getElementById('rCounter').innerHTML = '+'+rate;\n"+
			"}\n"+
		"</script>";
*/
