//Sends a GET request for settings.json
function req_settings(callback){
	var xhr = new XMLHttpRequest();
	xhr.open('GET', "/gj/settings.json", true);
	xhr.setRequestHeader('Content-type', 'application/json');
	xhr.onreadystatechange = function(){
		if(xhr.readyState == 4){
			if(xhr.status == 200){
				var res = xhr.responseText;
				var settings = JSON.parse(res);
				callback(null, settings);
			}
			else{
				var res = xhr.responseText;
				callback(res);
			}
		}
	};
	xhr.send();
}
