//Functions related to requesting log files.

function req_ses_list(uid, justDRZ, callback){
	//Load a list of session log files. Needs active admin session.
	var xhr = new XMLHttpRequest();
	var url = "/gj/archived_logs";
	if(uid && uid.length > 1){
		url += "?uid="+uid;
		if(justDRZ)
			url += "&DRZ=true";
	}
	else if(justDRZ){
		url += "?DRZ=true";
	}
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			if(xhr.status == 200){
				var res = JSON.parse(xhr.responseText);
				callback(res);
			}
		}
	};
	xhr.send();
}

function ses_rew_times(filename, callback){
	/**
	*	Request the full text of the given file and return a list of reward times. Used by NCR.
	*	Needs active admin session
	*/
	var xhr = new XMLHttpRequest();
	var url = "/admin/VL-log";
	if(filename.length > 2)
		url += "?file="+filename;
	else
		callback("Error: provide a filename");
	xhr.open('GET', url, true);
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			if(xhr.status == 200){
				var res = xhr.responseText;
				var rew_times = [];
				var sliced = res.slice(res.indexOf("session started|"));
				var stime = new Date(sliced.slice(sliced.indexOf("|")+1, sliced.indexOf("\n")));
				var entries = res.split("\n");
				for(var i = 0; i<entries.length; i++){
					var entryParts = entries[i].split("|");
					if(entryParts[0] == "reward dispensed"){
						var rew_time = new Date(entryParts[1]);
						rew_times.push(rew_time - stime);//# of ms
					}
				}
				callback(null, rew_times);
			}
		}
	};
	xhr.send();
}

function ttd_to_HTML(data){
	/**Parse plain text from a .ttd file to a table.
		.ttd files are organized like this: <~;~>\n<~;~;~>
		See the leaderboard scripts.
	*/
	//Or I could say: if the first line is "Started at ..."
	if(data.indexOf("<") < 0 && data.indexOf(">") < 0){
		//This is probably .txt
		return data.replace(/\n/g,"<br>");
	}
	var html = "\n<table style='table-layout: auto;'>\n";
	for(var i = 0; i< data.length; i++){
		var character = data[i];
		switch(character){
			case "<":
				html += "<tr>\n<td>";
			break;
			case ">":
				html += "</td>\n</tr>\n";
			break;
			case ";":
				html += "</td>\n<td>";
			break;
			default:
				html += character;
			break;
		}
	}//For each character
	html += "</table>\n";
	return html;
}

function ttsd_to_HTML(data){
	/**
	Parse plain text from a .ttsd file to a table.
		.ttsd files are organized like this: 
			~|~
			~|~|~
			******
			Report:
			~|~
			~|~
	*/
	var html = "\n<table style='table-layout: auto;'>\n";
	var rows = data.split(/\s*\n\s*/);
	for(var i=0; i<rows.length; i++){
		var entries = rows[i].split("|");
		if(entries.length > 1){
			html += "<tr>\n";
			for(var j=0; j<entries.length; j++){
				html += "<td>" + entries[j] + "</td>\n";
			}
			html += "</tr>\n";
		}
		else if(rows[i] == "Report:"){
			//Divider Row
			html += "<tr><td style='height:0;border-bottom:1pt solid black;'></td></tr>\n";
		}
	}
	html += "</table>\n";
	return html;
}

function report_to_HTML(type, report){
	/**
	*	Turn a report object into HTML to be injected
	*		example report object: 
	*		{
	*		  seslen: 54.216,
	*		  endl: 2,
	*		  endp: 240,
	*		  endc: 4,
	*		  lvls: 0,
	*		  pts: 40,
	*		  coins: 0,
	*		  tics: 3,
	*		  ltflen: 43.558,
	*		  tfis: 4,
	*		  ttv: '2020.11.11'
	*		}
	*		
	*		type: "u" or "t"
	*
	*		user report: {lpc: "l,p,c",
	*			longest tic-free interval: #s
	*			personal best tic-free interval: #s
	*		}
	*		trainer report: {
	*			lpc: "l,p,c",
	*			longest tic-free interval: #s
	*			personal best tic-free interval: #s
	*			???: ???
	*		}
	*/
	//TODO:Personal best not yet implemented server-side, so it's not included yet
	var html = "<b>User status after session:</b>\n<table style='table-layout: auto;'>\n";
	html += "<tr><td>Level:</td> <td>"+report.endl+"</td></tr>\n";
	html += "<tr><td>Points:</td> <td>"+report.endp+"</td></tr>\n";
	html += "<tr><td>Coins:</td> <td>"+report.endc+"</td></tr>\n";
	html += "</table>\n";
	if(type == "t"){
		html += "<b>Session Details:</b>\n<table style='table-layout: auto;'>\n";
		
		html += "<tr><td>Session Length:</td> <td>"+report.seslen+"</td></tr>\n";
		html += "<tr><td>Levels Gained:</td> <td>"+report.lvls+"</td></tr>\n";
		html += "<tr><td>Points Earned:</td> <td>"+report.pts+"</td></tr>\n";
		html += "<tr><td>Coins Earned:</td> <td>"+report.coins+"</td></tr>\n";
		html += "<tr><td>Number of Tics:</td> <td>"+report.tics+"</td></tr>\n";
		html += "<tr><td>Longest Tic Free Interval:</td> <td>"+report.ltflen+"</td></tr>\n";
		html += "<tr><td>Number of 10s Tic Free Intervals:</td> <td>"+report.tfis+"</td></tr>\n";
		html += "<tr><td>TicTrainer Version:</td> <td>"+report.ttv+"</td></tr>\n";
		
		html += "</table>\n";
	}
	return html;
}