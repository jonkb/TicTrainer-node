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
module.exports.login = login;

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

function login(body, callback){
	/**
	*	Verify account
	*		body.id = uid / tid / aid
	*		body.pw = pw || body.pwh = pwh
	*/
	let pwh = null;
	if(body.pw){
		pwh = crypto.createHash("sha256");
		pwh.update(sql.esc(body.pw));
		pwh = pwh.digest();
	}
	else{
		pwh = Buffer.from(body.pwh.data);
	}
	let table = null;
	db_log(`id: ${body.id}; id[0]: ${body.id[0]}`);
	switch(body.id[0]){
		case "u":
			table = "users";
			break;
		case "t":
			table = "trainers";
			break;
		case "a":
			table = "admins";
			break;
		default:
			callback("ife");
			return;
	}
	let idN = sql.esc(id_to_N(body.id));
	db_log(`id_N: ${idN};`);
	
	sql.connect((err, con) => {
		if(err){
			callback(err);
			return;
		}
		// See if the account already exists
		var select_query = `SELECT *
FROM ${table} WHERE ID=${idN}`;
		con.query(select_query, (err, result, fields) => {
			if(err){
				callback(err);
				return;
			}
			if(result.length > 0){
				// Account exists with this username
				// Verify password
				existing_pwh = result[0].password_hash;
				db_log(pwh);
				db_log(existing_pwh);
				if(Buffer.compare(pwh, existing_pwh) === 0){
					// Password Verified
					//body = {...body, ...result[0]]}
					let acc_obj = {
						id: body.id,
						pwh: existing_pwh
					};
					if(table == "users"){
						acc_obj.birth_date = result[0].birth_date;
						acc_obj.sex = result[0].sex;
						acc_obj.level = result[0].level;
						acc_obj.points = result[0].points;
						acc_obj.coins = result[0].coins;
						acc_obj.best_tfi = result[0].best_tfi;
					}
					else if(table == "trainers"){
						acc_obj.birth_year = result[0].birth_year;
					}
					callback(null, acc_obj, con);
				}
				else{
					callback("pce");
				}
			}
			else{
				// Account does not exist
				callback("anfe");
			}
		});
	});
}
