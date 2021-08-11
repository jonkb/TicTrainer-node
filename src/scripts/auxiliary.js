/**
*	Auxiliary functions and constants
*/

// Import modules
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mainroot = path.join(__dirname, "/..");
const scriptsroot = __dirname;
const dbroot = mainroot + "/db/";
const settings = JSON.parse(fs.readFileSync(mainroot+"/settings.json"));
// Functions for reading and writing to the database
const sql = require(scriptsroot+"/mysql.js")
// Other constants
const localeroot = "./locales/";
const languages = ["en", "pt"];
const user_editable_fields = ["password", "birth_date", "sex", "level", "points", "coins", "best_tfi"];
const trainer_editable_fields = ["password", "birth_year"];
const admin_editable_fields = ["password"];
//const err_types = ["anfe", "anle", "conses", "dfe", "fe", "ice", "ide", "ife", "pce", "se", "toe"];
const err_types = ["anfe", "pce", "ife", "fe", "se"];
const err_titles = {
	anfe: "Account Does Not Exist",
	pce: "Invalid Password",
	ife: "Input Error: Incomplete Form",
	fe: "Error 500: File System",
	se: "Error 500: Server"
};
// Global Variables
var lnusers = new Set();
var lndata = {};

/**
*	Exported constants
*/
module.exports.settings = settings;
module.exports.languages = languages;
module.exports.err_types = err_types;
module.exports.err_titles = err_titles;
module.exports.dbroot = dbroot;
module.exports.mainroot = mainroot;
/**
*	Exported functions
*/
module.exports.time = time;
module.exports.db_log = db_log;
module.exports.ln_add = ln_add;
module.exports.ln_has = ln_has;
module.exports.ln_delete = ln_delete;
module.exports.get_locale_data = get_locale_data;
module.exports.register_user = register_user;
module.exports.register_trainer = register_trainer;
module.exports.login = login;
module.exports.edit_account = edit_account;
module.exports.get_links = get_links;
module.exports.add_link = add_link;

module.exports.build_endses_report = build_endses_report; //TODO

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

function ln_add(link_data){
	/**
	*	Add an entry to lnusers
	*/
	lnusers.add(link_data.uid);
	lndata[link_data.uid] = link_data;
}

function ln_has(link_data){
	/**
	*	Check for an entry in lnusers
	*	(Also, if the entry found is older than 1h, reject and delete it)
	*/
	if(!lnusers.has(link_data.uid))
		return false;
	
	let age = Date.now() - lndata[link_data.uid].ts;
	if(age > 3600*1000){
		// Delete the entry if it's >1h old
		ln_delete(link_data);
		return false;
	}
	
	if(lndata[link_data.uid].tid == link_data.tid)
		return true;
	
	return false;
}

function ln_delete(link_data){
	/**
	*	Remove an entry from lnusers
	*/
	lnusers.delete(link_data.uid);
	delete lndata[link_data.uid];
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
	//db_log(`id: ${body.id}; id[0]: ${body.id[0]}`);
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
	//db_log(`id_N: ${idN};`);
	
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
				//db_log(pwh);
				//db_log(existing_pwh);
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
						acc_obj.items = result[0].items;
						// Research settings
						acc_obj.RID = result[0].RID;
						acc_obj.RS = result[0].RSTATE;
						acc_obj.AITI = result[0].AITI;
						acc_obj.SMPR = result[0].SMPR;
						acc_obj.PTIR = result[0].PTIR;
						acc_obj.FLASH = result[0].FLASH;
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

function edit_account(data, con, callback){
	/**
	*	Edit an account
	*		data.id = uid
	*		data.edits = {key1:val1, key2:val2, ...}
	*			key = field name (e.g. is_coder) Must be in editable_fields
	*			val = new value
	*		con = sql connection (from login)
	*		data.pw = pw || data.pwh = pwh (if no con)
	*/
	
	if(!con){
		// Create a connection if none was provided
		login(data, (err, acc_obj, con) => {
			if(err){
				callback(err);
				return;
			}
			edit_account(data, con, callback);
		});
		return;
	}
	
	//TODO: refactor for editing mutiple values at once. data.edits = {k1:v1, k2:v2, ...}
	let editable_fields, table;
	switch(data.id[0]){
		case "u":
			editable_fields = trainer_editable_fields;
			table = "users";
			break;
		case "t":
			editable_fields = trainer_editable_fields;
			table = "trainers";
			break;
		case "a":
			editable_fields = admin_editable_fields;
			table = "admins";
	}
	let new_pwh = false; // If updating pwh, then return the new hash
	let idN = sql.esc(id_to_N(data.id));
	let update_query = `UPDATE ${table}`;
	for(let key in data.edits){
		if(editable_fields.indexOf(key) == -1){
			callback("se");
			return;
		}
		let val = data.edits[key];
		if(key == "password"){
			key = "password_hash";
			let pwh = crypto.createHash("sha256");
			pwh.update(sql.esc(val));
			val = pwh.digest();
			new_pwh = sql.esc(val);
		}
		key = sql.esc(key).slice(1,-1);
		val = sql.esc(val);
		update_query += `\nSET ${key} = ${val}`;
	}
	update_query += `\nWHERE ID = ${idN}`;
	db_log(update_query);
	
	con.query(update_query, (err, result) => {
		if(err){
			callback(err);
			return;
		}
		// TODO: Check to see if it worked & return new acc_obj
		db_log(result);
		if(new_pwh)
			callback(null, new_pwh);
		else
			callback(null);
	});
}

function get_links(data, con, callback){
	/**
	*	Get the links associated with this account.
	*		data.id = uid
	*		data.pw = pw || data.pwh = pwh (if no con)
	*/
	
	if(!con){
		// Create a connection if none was provided
		login(data, (err, acc_obj, con) => {
			if(err){
				callback(err);
				return;
			}
			get_links(data, con, callback);
		});
		return;
	}
	
	let isuser = data.id[0] == "u";
	let lid_type = isuser ? "t" : "u";
	let id = sql.esc(id_to_N(data.id));
	let table, IDcol;
	if(isuser){
		table = "user_links";
		IDcol = "UID";
		LIDcol = "TID";
	}
	else{
		table = "trainer_links";
		IDcol = "TID";
		LIDcol = "UID";
	}
	// Get all links related to this account
	let select_query = `SELECT * 
FROM ${table} WHERE ${IDcol} = ${id}
ORDER BY ${LIDcol}`;
	con.query(select_query, (err, result, fields) => {
		if(err){
			callback(err);
			return;
		}
		let lids = [];
		for(row of result){
			let lid = isuser ? row.TID : row.UID;
			lid = N_to_id(lid, lid_type);
			lids.push(lid);
		}
		db_log(lids, 3);
		callback(null, lids);
	});
}

function add_link(data, con, callback){
	/**
	*	Add a link btw trainer & user
	*	data should have id & lid
	*/
	let isuser = data.id[0] == "u";
	let table, tid, uid;
	if(isuser){
		table = "user_links";
		tid = data.lid;
		uid = data.id;
	}
	else{
		table = "trainer_links";
		tid = data.id;
		uid = data.lid;
	}
	let tidN = sql.esc(id_to_N(tid));
	let uidN = sql.esc(id_to_N(uid));
	let insert_query = `INSERT INTO ${table} (TID, UID)
VALUES (${tidN}, ${uidN})`;
	con.query(insert_query, (err, result) => {
		if(err){
			callback(err);
			return;
		}
		//db_log("Link insert result: " + result.toString());
		callback();
	});
}

function build_endses_report(uid, tid, report, callback){
	/**
	*	Load the user's data to know the personal best and load the report if needed.
	*		Then combine that info into a single report object.
	*	uid: user id
	*	tid: trainer id (Provide if report not provided)
	*	report: The text of the session report. When the user ends, it has the report text,
	*		but the trainer needs to load it from the archived file.
	*/
	//TODO: Personal best not yet implemented
	if(report){
		var obj = report_to_obj(report);
		//TODO: Add personal best
		callback(null, obj);
		return;
	}
	console.log(760, uid, tid);
	// Search for, load, and parse the archived session file
	const archive_dname = dbroot + "session/archive";
	// Poll repeatedly to see if the user has archived the session yet
	const maxtries = 30;
	const interval = 1000;
	var tries = 0;
	var timer = setInterval(check, interval);
	function check(){
		tries++;
		if(tries > maxtries){
			clearInterval(timer);
			callback(null, {});
			return;
		}
		var now = new Date();
		fs.readdir(archive_dname, (err, files) => {
			if(err){
				clearInterval(timer);
				callback("se");
				return;
			}
			for(const i in files){
				var file = files[i];
				//This is terribly inefficient. Oh well.
				//TODO: also check uid & tid
				fileparts = file.split("_");
				if(fileparts.length < 2)
					continue;
				if(fileparts[0] != tid+uid)
					continue;
				console.log(792, file);
				var datetime = fileparts[1]; //YYYYMMDD-hhmmss
				var dtparts = datetime.split("-");
				var ISOdt = dtparts[0].slice(0,4) + "-" + dtparts[0].slice(4,6) + "-" 
				ISOdt += dtparts[0].slice(6,8) + "T" + dtparts[1].slice(0,2) + ":" 
				ISOdt += dtparts[1].slice(2,4) + ":" + dtparts[1].slice(4,6) + ".000Z";
				var fdate = new Date(ISOdt);
				if(Math.abs(fdate - now) < 30*1000){
					//This file was archived within 30s of now
					clearInterval(timer);
					load_report(file);
					return;
				}
			}
		});
	}
	function load_report(file){
		fs.readFile(archive_dname + "/" + file, "utf8", (err, data) => {
			if(err){
				callback("se");
				return;
			}
			var report_text = data.split("Report:")[1];
			console.log(791, file, report_text);
			callback(null, report_to_obj(report_text));
		});
	}
}