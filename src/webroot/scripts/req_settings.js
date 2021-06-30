//Sends a GET request for settings.json
function req_settings(callback){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', "/settings.gj", true);
	xhr.setRequestHeader('Content-type', 'text/plain');
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			if(xhr.status == 200){
				var res = xhr.responseText;
				var settings = JSON.parse(res);
				callback(xhr.status, settings);
			}
			else{
				var res = xhr.responseText;
				callback(xhr.status, res);
			}
		}
	};
	xhr.send();
}
