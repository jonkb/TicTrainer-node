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
app.use(bodyParser.urlencoded({
	extended: true,
	type: "application/x-www-form-urlencoded"
}));

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

app.get(aux.directories, hrq.slash_redirect); // e.g. Redirect /session to /session/
// Define responses for specific requests
app.get("/", hrq.root);
app.get("/error/*", hrq.err_get);
app.post("/error/ghses.html", hrq.ghses);
// Requests related to accounts (registration, login, manage account)
app.post("/register/user.html", hrq.register_user);
app.post("/register/trainer.html", hrq.register_trainer);
app.get("/account/login", hrq.login_get);
app.post("/account/login", hrq.login);
app.get("/account/logout", hrq.logout);
app.all("/account/manage", hrq.check_login);
app.get("/account/manage", hrq.manage_get);
app.post("/account/manage", hrq.manage);
// Requests related to training sessions
app.all("/session/*", hrq.check_login); // Must be logged in
app.get("/session/", hrq.new_session_get); // New Training Session
app.post("/session/", hrq.new_session);
app.get("/session/session_ended", hrq.session_ended_get);
app.all("/session/*", hrq.check_lid); // Must be in an ongoing session from here on
app.get("/session/llt", hrq.ll_get); // Link Loading
app.post("/session/llt", hrq.llt);
app.get("/session/llu", hrq.ll_get);
app.post("/session/llu", hrq.llu);
app.get("/session/sst", hrq.ss_get); // Start Session
app.post("/session/sst", hrq.sst);
app.get("/session/ssu", hrq.ss_get);
app.post("/session/ssu", hrq.ssu);
app.get("/session/sest", hrq.ses_get); // Active Session
app.post("/session/sest", hrq.sest);
app.get("/session/sesu", hrq.ses_get);
app.post("/session/sesu", hrq.sesu);
// TSP sessions
app.all("/tsp/*", hrq.check_login); // Must be logged in
app.get("/tsp/", hrq.new_tspses_get);
app.post("/tsp/", hrq.new_session);
app.get("/tsp/session_ended", hrq.session_ended_get);
app.all("/tsp/*", hrq.check_lid); // Must be in an ongoing session from here on
app.get("/tsp/llt", hrq.ll_get); // Link Loading
app.post("/tsp/llt", hrq.llt);
app.get("/tsp/llu", hrq.ll_get);
app.post("/tsp/llu", hrq.llu);
app.get("/tsp/sst", hrq.ss_get); // Start Session
app.post("/tsp/sst", hrq.sst);
app.get("/tsp/ssu", hrq.ss_get);
app.post("/tsp/ssu", hrq.ssu);
app.get("/tsp/sest", hrq.ses_get); // Active Session
app.post("/tsp/sest", hrq.sest);
app.get("/tsp/sesu", hrq.ses_get);
app.post("/tsp/sesu", hrq.sesu);

// gj: Get JSON. API for requesting certain JSON files
app.get("/gj/settings.json", hrq.gj_settings);
app.get("/gj/recent_session", hrq.gj_recent_session);

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