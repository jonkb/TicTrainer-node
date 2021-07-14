/**
*	Entry point for starting the TicTrainer server
*/

// Import modules
const https = require("https");
const fs = require("fs");
const path = require("path");
const scriptsroot = path.join(__dirname, "scripts");
const express = require("express");
const bodyParser = require("body-parser");
const hbs = require("express-handlebars");
const cookieSession = require('cookie-session');
const aux = require(scriptsroot + "/auxiliary.js");
const hrq = require(scriptsroot + "/handle_req.js");
// Constants
const HTTPS_PORT = 443;
const TESTING_PORT = 8888;

// Create server
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Set up handlebars
app.set('view engine', 'hbs');
app.engine('hbs', hbs({
	layoutsDir: __dirname + '/views/layouts',
	extname: "hbs"
}));

// Set up cookie-session for client-side sessions
ckses_options = {
  name: 'session',
  keys: ["tmp_098H6DCD87PO"],
  maxAge: 4 * 3600 * 1000 // 4 hours
};
app.use(cookieSession(ckses_options));

// Define responses for specific requests
app.get("/", hrq.root);

app.post("/register/user.html", hrq.register_user);
app.post("/register/trainer.html", hrq.register_trainer);
app.get("/account/logout", hrq.logout);
//TODO

// Everything else should be loaded normally
app.use(express.static("webroot"));

// Handle get requests for files that are not found in webroot
app.get("*", (req, res) => {
	//TODO: Send 404 page
	res.status(404).send("Error 404");
});

// Start the server(s)
if(aux.settings.testing){
	app.listen(TESTING_PORT, () => {
		console.log("Started at "+aux.time());
		console.log("Server listening on: http://localhost:" + TESTING_PORT);
	});
}
else{
	//Set up server to run on port 80 that just redirects to the https server.
	const app80 = express();
	app80.all("*", (req, res) => {
		res.redirect("https://" + req.headers.host + ":" + HTTPS_PORT);
	});
	app80.listen(80);
	
	//Set up main https server
	const options = {
		key: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/privkey.pem"),
		cert: fs.readFileSync("/etc/letsencrypt/live/tictrainer.com/fullchain.pem")
	};
	var server = https.createServer(options, app);
	//Start server
	server.listen(HTTPS_PORT, function(){
		console.log("Started at "+aux.time());
		console.log("Server listening on: https://localhost:" + HTTPS_PORT);
	});
	
	/*
	//Set up main https server
	app.listen(HTTPS_PORT, () => {
		console.log("Started at "+aux.time());
		console.log("Server listening on: http://localhost:" + HTTPS_PORT);
	});
	*/
}