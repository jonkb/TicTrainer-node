/**
*	Auxiliary functions and constants
*/

// Import modules
const crypto = require("crypto");
const fs = require("fs");
const mainroot = __dirname + "/..";
const scriptsroot = __dirname;
const settings = JSON.parse(fs.readFileSync(mainroot+"/settings.json"));
// Functions for reading and writing to the database
const sql = require(scriptsroot+"/mysql.js")
// Other constants
const localeroot = "./locales/";
const languages = ["en", "pt"];

/**
*	Exported constants
*/
module.exports.settings = settings;
module.exports.languages = languages;
/**
*	Exported functions
*/
module.exports.time = time;
module.exports.db_log = db_log;
module.exports.get_locale_data = get_locale_data;
module.exports.register_user = register_user;
module.exports.register_trainer = register_trainer;

function id_to_N(id){
	var N36 = id.slice(1);
	return parseInt(N36, 36);
}

function N_to_id(N, type){
	/**
	*	type is account type, from ("t", "u", "a")
	*/
	var N36 = N.toString(36);
	return type + N36;
}

function pad2(num){
	/**
	*	Convert the given number (0-99) to a 2-character string, 
	*	padded with a leading zero if needed.
	*/
	if(num < 10){
		return "0" + num.toString();
	}
	return num.toString();
}

function time(type){
	/**
	*	Returns the current time in the requested format type
	*	type:
	*		"forfile": YYYYMMDD-hhmmss (GMT)
	*		"millis": (e.g.)1494298134109
	*		"ISO": YYYY-MM-DDThh:mm:ss.sssZ (GMT)
	*/
	var d = new Date();
	switch(type){
		case "forfile"://YYYYMMDD-hhmmss
			//return d.getFullYear()+pad2(d.getMonth()+1)+pad2(d.getDate())+
			//	"-"+pad2(d.getHours())+pad2(d.getMinutes())+pad2(d.getSeconds());
			let ISOstr = d.toISOString();
			return ISOstr.replace(/-/g, "").replace(/:/g,"").replace("T", "-").split(".")[0];
		break;
		case "millis":
			return d.now();
		case "ISO":
		default:
			return d.toISOString();
		break;
	}
}

function db_log(message, depth){
	/**
	*	A simple wrapper for console.log()
	*	By setting the value of the debugging constant, the person running the server
	*	can decide how many messages to see.
	*		depth 0: always show the message, even with debugging 0
	*		depth 1: print if debugging depth >= 1
	*		depth 2(default): print if debugging depth >= 2
	*		depth N: print if debugging depth >= N
	*/
	if(!depth)
		depth = 2;
	if(settings.debugging >= depth)
		console.log(message);
}

function get_locale_data(lang, callback){
	/**
	* Return an object with all text strings in the specified language
	*/
	db_log(83, lang);
	if(lang === false){
		lang = "en"; // Default to English
	}
	var locale_path = localeroot + lang + ".json";
	fs.readFile(locale_path, (err, data) => {
		if(err){
			callback("se");
			return;
		}
		callback(null, JSON.parse(data));
	});
}

function register_user(body, callback){
	/**
	*	Create a new user account
	*/
	
	var pw = sql.esc(body.pw);
	var sex = sql.esc(body.sex);
	if(["'M'","'F'"].indexOf(sex) == -1){
		callback("ife");
		return;
	}
	var birth = sql.esc(body.birth);
	
	sql.connect((err, con) => {
		if(err){
			callback(err);
			return;
		}
		// Create a new account for the user
		var insert_cols = "(password_hash, birth_date, sex)";
		var insert_query = `INSERT INTO users ${insert_cols}
VALUES (UNHEX(SHA2("${pw}", 256)), ${birth}, ${sex})`;
		con.query(insert_query, (err, result) => {
			if(err){
				callback(err);
				return;
			}
			console.log("Record inserted. ID: " + result.insertId);
			body.id = N_to_id(result.insertId, "u");
			callback(null, body);
		});
	});
}

function register_trainer(body, callback){
	/**
	*	Create a new trainer account
	*/
	
	var pw = sql.esc(body.pw);
	var birth = sql.esc(body.birth);
	
	sql.connect((err, con) => {
		if(err){
			callback(err);
			return;
		}
		// Create a new account for the trainer
		var insert_cols = "(password_hash, birth_year)";
		var insert_query = `INSERT INTO trainers ${insert_cols}
VALUES (UNHEX(SHA2("${pw}", 256)), ${birth})`;
		con.query(insert_query, (err, result) => {
			if(err){
				callback(err);
				return;
			}
			console.log("Record inserted. ID: " + result.insertId);
			body.id = N_to_id(result.insertId, "t");
			callback(null, body);
		});
	});
}