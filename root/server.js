var https = require("https");
var http = require("http");//For port 80 redirect server
var fs = require("fs");

var hdl_req = require("./scripts/handle_req.js").hrq;
var aux = require("./scripts/auxiliary.js");

const HTTPS_PORT = 443;
const TESTING_PORT = 8888;


if(aux.settings.testing){
	var server = http.createServer(hdl_req);
	server.listen(TESTING_PORT, function(){
		console.log("Started at "+aux.time());
		console.log("Server listening on: http://localhost:" + TESTING_PORT);
	});
}
else{
	//Set up server to run on port 80 that just redirects to the https server.
	var server_80 = http.createServer(function(req, res){
		res.writeHead(301, {"Location": "https://tictrainer.com:" + HTTPS_PORT});
		res.end();
	}).listen(80);

	//Set up main https server
	const options = {
		key: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/privkey.pem"),
		cert: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/fullchain.pem")
	};
	//Create server using hdl_req
	var server = https.createServer(options, hdl_req);
	//Start server
	server.listen(HTTPS_PORT, function(){
		console.log("Started at "+aux.time());
		console.log("Server listening on: https://localhost:" + HTTPS_PORT);
	});
}
