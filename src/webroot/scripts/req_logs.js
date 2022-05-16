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

function txt_to_HTML(data){
	/**
	Convert the line breaks in a txt file to <br>
	*/
	return data.replace(/\n/g,"<br>");
}

function csv_to_array(data){
	/**
	Convert the text of a csv file to an array.
	Assumes format:
		"abc","def","gh""quote""i","jkl"
		"mno","pqr" ...
	*/
	// Uses a smidge of extra memory, but whatever.
	let subdata = data;
	let entry = "";
	let i_entry_start, i_entry_end, i_newline;
	let rows = [];
	let row = [];
	while(subdata.length > 0){
		i_entry_start = subdata.indexOf("\"")+1;
		// This next loop searches for the end of the entry
		i_entry_end = i_entry_start;
		while(true){
			console.log(85, i_entry_end);
			// Distance to next " after the current index
			i_entry_end = subdata.indexOf("\"", i_entry_end);
			if(i_entry_end == -1){
				i_entry_end = subdata.length-1;
				break;
			}
			if(subdata[i_entry_end+1] == "\""){
				i_entry_end += 2; // Skip "" and keep looking
			}
			else{
				// Found the end of the entry
				break;
			}
			// TODO: Check that this can't infinite loop.
		}
		entry = subdata.slice(i_entry_start, i_entry_end);
		entry = entry.replace(/""/g, "\""); // Unescape quotes
		row.push(entry);
		subdata = subdata.slice(i_entry_end+1);
		// At this point, the next " will be the start of the next entry
		i_nextentry = subdata.indexOf("\"");
		if(i_nextentry == -1){
			// EOF
			rows.push(row);
			break;
		}
		i_newline = subdata.indexOf("\n");
		if(i_newline < i_nextentry && i_newline > -1){
			// End of row
			rows.push(row);
			row = [];
		}
	}
	return rows;
}

function csv_to_HTML(data){
	/** USED by VL
	Parse plain text from a .csv file to a table.
		See the leaderboard scripts.
	*/
	
	let html = "\n<table style='table-layout: auto;'>\n";
	rows = csv_to_array(data);
	for(row of rows){
		html += "<tr>";
		for(entry of row){
			html += "<td>" + entry + "</td>";
		}
		html += "</tr>\n";
	}
	html += "</table>\n";
	return html;
}

function ttsd_to_HTML(data){
	/** OLD -- I'm using handlebars for this now. I THINK.
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
	/** OLD -- I'm using handlebars for this now
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
	// Personal best was not yet implemented server-side when I made this
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