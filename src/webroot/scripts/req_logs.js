//Functions related to requesting log files.

//Load a list of session log files. Needs admin authentication.
function req_ses_list(aid, apw, uid, callback){
	var xhr = new XMLHttpRequest();
	var url = '/admin/viewLogs.dynh';
	var reqBody = 'admin_id='+aid+'&admin_pw='+apw+'&source=reqlist&uid='+uid;
	xhr.open('POST', url, true);
	xhr.setRequestHeader('Content-type', 'text/plain');
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			var res = xhr.responseText;
			if(xhr.status == 200){
				var loglist = JSON.parse(res);
				callback(xhr.status, loglist);
			}
			else{
				callback(xhr.status, res);
			}
		}
	};
	xhr.send(reqBody);
}

/*Parse plain text from a .ttd file to a table.
	.ttd files are organized like this: <~;~>\n<~;~;~>
	See the leaderboard scripts.
*/
function ttd_to_HTML(data){
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

/*Parse plain text from a .ttsd file to a table.
	.ttsd files are organized like this: 
		~|~
		~|~|~
		******
		Report:
		~|~
		~|~
*/
function ttsd_to_HTML(data){
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
	html += "</table>\n"
	return html;
}