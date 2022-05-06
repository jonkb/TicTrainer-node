/**
*	Auxiliary functions and constants
*/

// Import modules
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const mainroot = path.join(__dirname, "/..");
const scriptsroot = __dirname;
const logroot = mainroot + "/logs/";
const settings = JSON.parse(fs.readFileSync(mainroot+"/settings.json"));
// Functions for reading and writing to the database
const sql = require(scriptsroot+"/mysql.js")
// Other constants
const localeroot = "./locales/";
const languages = ["en", "pt"];
const console_log_file = path.join(logroot, "log.txt");
const err_log_file = path.join(logroot, "err_log.ttd");
const user_editable_fields = ["password", "birth_date", "sex", "level", 
	"points", "coins", "best_tfi", "items", "RID", "RSTATE", "AITI", "SMPR",
	"PTIR", "FLASH"];
const trainer_editable_fields = ["password", "birth_year"];
const admin_editable_fields = ["password"];
const directories = ["/error", "/session", "/tsp", "/register", "/account", "/admin"];

//const err_types = ["anfe", "anle", "conses", "dfe", "fe", "ice", "ide", "ife", "pce", "se", "toe"];
const err_types = ["anfe", "pce", "ife", "fe", "se", "conses", "toe"];
const err_titles = {
	anfe: "Account Does Not Exist",
	pce: "Invalid Password",
	ife: "Input Error: Incomplete Form",
	fe: "Error 500: File System",
	se: "Error 500: Server",
	conses: "Warning: Concurrent Session",
	toe: "Timeout"
};

// Global Variables
var lnusers = new Set();
var lndata = {};

/**
*	Exported constants
*/
module.exports.settings = settings;
module.exports.languages = languages;
module.exports.console_log_file = console_log_file;
module.exports.err_log_file = err_log_file;
module.exports.err_types = err_types;
module.exports.err_titles = err_titles;
module.exports.logroot = logroot;
module.exports.mainroot = mainroot;
module.exports.directories = directories;
/**
*	Exported functions
*/
module.exports.validate_id = validate_id;
module.exports.time = time;
module.exports.db_log = db_log;
module.exports.log_error = log_error;
module.exports.ln_add = ln_add;
module.exports.ln_has = ln_has;
module.exports.ln_delete = ln_delete;
module.exports.ln_list = ln_list;
module.exports.get_locale_data = get_locale_data;
module.exports.register_user = register_user;
module.exports.register_trainer = register_trainer;
module.exports.register_admin = register_admin;
module.exports.load_account = load_account;
module.exports.login = login;
module.exports.edit_account = edit_account;
module.exports.get_links = get_links;
module.exports.add_link = add_link;
module.exports.gen_report_obj = gen_report_obj;
module.exports.gen_report_txt = gen_report_txt;
module.exports.archive_session = archive_session;
module.exports.load_recent_report = load_recent_report;
module.exports.list_archived_sessions = list_archived_sessions;

// TODO: Check that we're using validate_id everywhere that it's appropriate
function validate_id(id, valid_initials = "tua"){
	/* Check whether id is a valid id string.
		valid_initials: combination of "t", "u", &/or "a" (lowercase)
		returns a lowercase version of the given id or "-" if the id is invalid.
		Copied in account.js for client-side use.
	*/
	
	id = id.toLowerCase();
	if(valid_initials.indexOf(id[0]) == -1)
		return "-";
	if(id[0] != "a" && id.length < 2)
		return "-";
	return id;
}

// MAYBE_TODO: add case for "a" -> 0? Well, sometimes we want a3 -> 3 and sometimes a3 -> 0...
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

function time(type, date){
	/**
	*	Returns the current time in the requested format type
	*	type:
	*		"forfile": YYYYMMDD-hhmmss (GMT)
	*		"millis": (e.g.)1494298134109
	*		"ISO": YYYY-MM-DDThh:mm:ss.sssZ (GMT)
	*/
	let d = date || new Date();
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

function log_error(error_type, message){
	/**
	*	Writes an error to the error log (./logs/err_log.ttd)
	*/
	message = message || "-";
	// Escape special characters for the .ttd format
	// It would be much better as a csv or something standard...
	// IMPROVEMENT_TODO: Switch to csv or SQL table
	const open_char = "<";
	const open_char_description = "[L.T. chevron]";
	const close_char = ">";
	const close_char_description = "[G.T. chevron]";
	const division_char = ";";
	const division_char_description = "[semicolon]";
	message = message.replace(open_char, open_char_description);
	message = message.replace(close_char, close_char_description);
	message = message.replace(division_char, division_char_description);
	var eEntry = open_char+error_type+division_char+time()+
		division_char+message+close_char+"\n";
	fs.appendFile(err_log_file, eEntry, function(err){});
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
	db_log("Current lnusers list: "+Array.from(lnusers).join(", "), 3);
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
	db_log("Current lnusers list: "+Array.from(lnusers).join(", "), 3);
}

function ln_list(){
	/**
	*	Getter for lndata
	*/
	
	return Object.values(lndata);
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
			db_log("Record inserted. ID: " + result.insertId);
			body.id = N_to_id(result.insertId, "u");
			callback(null, body);
		});
	});
}

function register_trainer(body, callback){
	/**
	*	Create a new trainer account
	*/
	
	let pw = sql.esc(body.pw);
	let birth = sql.esc(body.birth);
	
	sql.connect((err, con) => {
		if(err){
			callback(err);
			return;
		}
		// Create a new account for the trainer
		let insert_cols = "(password_hash, birth_year)";
		let insert_query = `INSERT INTO trainers ${insert_cols}
VALUES (UNHEX(SHA2("${pw}", 256)), ${birth})`;
		con.query(insert_query, (err, result) => {
			if(err){
				callback(err);
				return;
			}
			db_log("Record inserted. ID: " + result.insertId);
			body.id = N_to_id(result.insertId, "t");
			callback(null, body);
		});
	});
}

function register_admin(body, con, callback){
	/**
	*	Create a new admin account
	*/
	if(!con){
		// Create a connection if none was provided
		sql.connect((err, con) => {
			if(err){
				callback(err);
				return;
			}
			register_admin(body, con, callback);
		});
		return;
	}
	
	let pw = sql.esc(body.pw);
	
	// Create a new account
	let insert_query = `INSERT INTO admins (password_hash)
VALUES (UNHEX(SHA2("${pw}", 256)))`;
	con.query(insert_query, (err, result) => {
		if(err){
			callback(err);
			return;
		}
		db_log("Record inserted. ID: " + result.insertId);
		body.id = N_to_id(result.insertId, "a");
		callback(null, body);
	});
}

function load_account(id, con, callback){
	/**
	*	Load an account's data
	*/
	if(!con){
		// Create a connection if none was provided
		sql.connect((err, con) => {
			if(err){
				callback(err);
				return;
			}
			load_account(id, con, callback);
		});
		return;
	}
	
	// Validate the id format
	id = validate_id(id);
	
	let table = null;
	switch(id[0]){
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
	let idN = sql.esc(id_to_N(id));
	
	let select_query = `SELECT *
FROM ${table} WHERE ID=${idN}`;
	con.query(select_query, (err, result, fields) => {
		if(err){
			callback(err);
			return;
		}
		if(result.length > 0){
			// Account exists with this username
			let acc_obj = {
				id: id,
				pwh: result[0].password_hash
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
			// Account does not exist
			callback("anfe");
		}
	});
}

function login(body, con, callback){
	/**
	*	Verify account
	*		body.id = uid / tid / aid
	*		body.pw = pw || body.pwh = pwh
	*/
	if(!con){
		// Create a connection if none was provided
		sql.connect((err, con) => {
			if(err){
				callback(err);
				return;
			}
			login(body, con, callback);
		});
		return;
	}
	
	let pwh = null;
	if(body.pw){
		pwh = crypto.createHash("sha256");
		pwh.update(sql.esc(body.pw));
		pwh = pwh.digest();
	}
	else{
		pwh = Buffer.from(body.pwh.data);
	}
	
	load_account(body.id, null, (err, acc_obj, con) => {
		if(err){
			callback(err);
			return;
		}
		// Verify password
		existing_pwh = acc_obj.pwh;
		if(Buffer.compare(pwh, existing_pwh) === 0){
			// Password Verified
			callback(null, acc_obj, con);
		}
		else{
			callback("pce");
		}
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
		login(data, null, (err, acc_obj, con) => {
			if(err){
				callback(err);
				return;
			}
			edit_account(data, con, callback);
		});
		return;
	}
	
	let editable_fields, table;
	switch(data.id[0]){
		case "u":
			editable_fields = user_editable_fields;
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
	let update_query = `UPDATE ${table}
SET`;
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
		update_query += ` ${key} = ${val},`;
	}
	update_query = update_query.slice(0,-1); // Remove trailing comma
	update_query += ` WHERE ID = ${idN}`;
	db_log(update_query);
	
	con.query(update_query, (err, result) => {
		if(err){
			callback(err);
			return;
		}
		// Load and return the updated acc_obj
		load_account(data.id, con, (err, acc_obj, con) => {
			if(err){
				callback(err);
				return;
			}
			callback(null, acc_obj);
		});
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
		login(data, null, (err, acc_obj, con) => {
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
	
	if(!con){
		// Create a connection if none was provided
		sql.connect((err, con) => {
			if(err){
				callback(err);
				return;
			}
			add_link(data, con, callback);
		});
		return;
	}
	
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

function gen_report_obj(log_txt){
	/**
	*	Takes the text of the session file (data) and generates a report object
	*	summarizing the session
	*/
	let report_obj = {
		tt_version: settings.tt_version,
		tics: 0,
		tens_tfis: 0, // 10-second tic-free intervals
		longest_tfi: 0, // Longest tic-free interval
		is_tsp: false,
		tsp_stype: "",
		ended: false,
		initT: 0,
		endT: 0,
		duration: 0,
		initL: 0,
		endL: 0,
		levels: 0,
		initP: 0,
		endP: 0,
		points: 0,
		initC: 0,
		endC: 0,
		coins: 0,
		tsp_rewards: 0
	};
	// Temporary variables, not part of the report
	let tic_time, last_tic, tfi_time; // Last tic time, Tic Free Interval time
	let lpc = [];
	let line_parts = [];
	// Loop through each line in the file
	let lines = log_txt.split("\n");
	for(let line of lines){
		if(line.trim() == ""){
			continue;//Ignore blank lines
		}
		line_parts = line.split("|");
		switch(line_parts[0]){
			case "session started":
				report_obj.initT = new Date(line_parts[1]);
				report_obj.endT = report_obj.initT;
				last_tic = report_obj.initT;
			break;
			case "starting user l,p,c":
				lpc = line_parts[1].split(",");
				report_obj.initL = parseInt(lpc[0]);
				report_obj.endL = report_obj.initL;
				report_obj.initP = parseInt(lpc[1]);
				report_obj.endP = report_obj.initP;
				report_obj.initC = parseInt(lpc[2]);
				report_obj.endC = report_obj.initC;
			break;
			case "tic detected":
				report_obj.tics++;
				tic_time = new Date(line_parts[1]);
				tfi_time = tic_time - last_tic;
				last_tic = tic_time;
				if(!report_obj.ended)
					report_obj.endT = tic_time;
				if(tfi_time > report_obj.longest_tfi)
					report_obj.longest_tfi = tfi_time;
				/*Convert tfi_time time to seconds. 
					Divide that by 10s and add that many to the 10s Interval count.
				*/
				report_obj.tens_tfis += Math.floor(tfi_time / 1e4);
			break;
			case "session ended":
				report_obj.endT = new Date(line_parts[1]);
				report_obj.ended = true;
				tfi_time = report_obj.endT - last_tic;
				if(tfi_time > report_obj.longest_tfi)
					report_obj.longest_tfi = tfi_time;
				report_obj.tens_tfis += Math.floor(tfi_time / 1e4);
			break;
			case "user l,p,c":
				lpc = line_parts[1].split(",");
				report_obj.endL = parseInt(lpc[0]);
				report_obj.endP = parseInt(lpc[1]);
				report_obj.endC = parseInt(lpc[2]);
				if(!report_obj.ended)
					report_obj.endT = new Date(line_parts[2]);
			break;
			case "Research ID":
				report_obj.is_tsp = true;
				report_obj.tsp_stype = line_parts[2];
			break;
			case "reward dispensed":
				report_obj.tsp_rewards++;
				if(!report_obj.ended)
					report_obj.endT = new Date(line_parts[1]);
			break;
			case "ncr reward times":
			break;
			default:
				return "\nError: unknown entry: "+line;
			break;
		}
	}
	// Levels, points, and coins gained
	report_obj.levels = report_obj.endL - report_obj.initL;
	report_obj.points = report_obj.endP - report_obj.initP;
	report_obj.coins = report_obj.endC - report_obj.initC;
	report_obj.duration = report_obj.endT - report_obj.initT;
	if(report_obj.endL > report_obj.initL){
		/*At each levelUp(), points are subtracted
			and converted to coins.
			Add those subtracted points to the point total.
		*/
		for(var i = report_obj.initL; i < report_obj.endL; i++){
			//300L^2 = nextLevel
			report_obj.points += settings.points_to_first_level*i*i;
		}
	}
	return report_obj;
}

function gen_report_txt(report_obj){
	/**
	*	Convert a report object to report text, to be appended to the end of the
	*	archived session log file
	*/
	let report_txt = "\n****************\nReport:";
	if(!report_obj.ended)
		report_txt += "\nWARNING: no \"session ended\" entry found. Session length may be inaccurate.";
	report_txt += "\nsession length|"+ report_obj.duration/1000;
	if(!report_obj.is_tsp){
		report_txt += "\nending l,p,c|"+report_obj.endL+","+report_obj.endP+","+report_obj.endC;
		report_txt += "\nlevels gained|"+ report_obj.levels;
		report_txt += "\npoints earned|"+ report_obj.points;
		report_txt += "\ncoins earned|"+ report_obj.coins;
	}
	report_txt += "\nnumber of tics|"+ report_obj.tics;
	report_txt += "\nlongest tic free interval|"+ report_obj.longest_tfi/1000;
	report_txt += "\nnumber of 10s tic free intervals|"+ report_obj.tens_tfis;
	if(report_obj.is_tsp)
		report_txt += "\nnumber of rewards dispensed|"+ report_obj.tsp_rewards;
	report_txt += "\nreport generated with TicTrainer version|"+report_obj.tt_version+"\n";
	return report_txt;
}

function archive_log(data, callback){
	/**
	*	Store the session object in the database
	*	data = {tid, uid, end_ts, report_obj}
	*/
	sql.connect((err, con) => {
		if(err){
			console.log(690);
			callback(err);
			return;
		}
		// If admin, store a 0
		let tidN = data.tid[0] = "a" ? 0 : sql.esc(id_to_N(data.tid));
		let uidN = sql.esc(id_to_N(data.uid));
		let insert_cols = "(TID, UID, filename, end_ts, duration, levels, points, coins, tics, "
		insert_cols += "longest_tfi, tens_tfis, is_tsp, tsp_stype, tsp_rewards, tt_version)";
		let insert_query = `INSERT INTO session_archive_index ${insert_cols}
VALUES (${tidN}, ${uidN}, ${sql.esc(data.filename)}, ${sql.esc(data.end_ts)},
${sql.esc(data.report_obj.duration)}, ${sql.esc(data.report_obj.levels)},
${sql.esc(data.report_obj.points)}, ${sql.esc(data.report_obj.coins)},
${sql.esc(data.report_obj.tics)}, ${sql.esc(data.report_obj.longest_tfi)},
${sql.esc(data.report_obj.tens_tfis)}, ${sql.esc(data.report_obj.is_tsp)},
${sql.esc(data.report_obj.tsp_stype)}, ${sql.esc(data.report_obj.tsp_rewards)},
${sql.esc(data.report_obj.tt_version)})`;
		console.log(706, insert_query)
		con.query(insert_query, (err, result) => {
			if(err){
				console.log(708, err);
				callback(err);
				return;
			}
			callback();
		});
	});
}

function update_best_tfi(uid, tfi_time, callback){
	/**
	*	Saves tfi_time as the user's personal best if it is greater than
	*	the current personal best
	*		ALT: alternate method compares tfi_time to session.acc_obj.best_tfi
	*/
	let idN = sql.esc(id_to_N(uid));
	let tfi = parseInt(sql.esc(tfi_time));
	sql.connect((err, con) => {
		if(err){
			console.log(730);
			callback(err);
			return;
		}
		let update_query = `UPDATE users
SET best_tfi = GREATEST(best_tfi, ${tfi})
WHERE ID = ${idN}`;
		con.query(update_query, (err, result) => {
			if(err){
				console.log(735, err);
				callback(err);
				return;
			}
			callback();
		});
	});
}

function archive_session(sesFile, callback){
	/**
	*	Archives the given session file
	*	If it was a TSP session, include the stype in the filename
	*	callback(err)
	*
	*	1. Generate the report object and text
	*	2. Append that text to the session file
	*	3. Move the session file to the archive directory
	*	4. Store a summary of the report object to the database
	*	5. Update the user's personal best if appropriate
	*/
	fs.readFile(sesFile, "utf8", function(err, log_txt){
		if(err){
			callback("fe");
			return;
		}
		let report_obj = gen_report_obj(log_txt);
		let report_txt = gen_report_txt(report_obj);
		let end_d = new Date();
		let end_ts = end_d.toISOString();
		let end_tsf = time("forfile", end_d);
		// For file (See time(forfile))
		//let end_tsf = end_ts.replace(/-/g, "").replace(/:/g,"").replace("T", "-").split(".")[0];
		
		let sesFile2 = sesFile.slice(sesFile.lastIndexOf("/")+1);
		let ids = sesFile2.split("_")[0].split("-");
		console.log(730, ids);
		sesFile2 = sesFile2.slice(0, sesFile2.indexOf(".ttsd"));
		sesFile2 += "_" + end_tsf;
		if(report_obj.is_tsp)
			sesFile2 += "_"+report_obj.tsp_stype;
		sesFile2 += ".ttsd";
		let filename = sesFile2; // Grab just the filename, after the path
		sesFile2 = logroot + "session/archive/" + sesFile2;
		fs.appendFile(sesFile, report_txt, function(err){
			if(err){
				callback("fe");
				return;
			}
			fs.rename(sesFile, sesFile2, function(err){
				if(err){
					callback("fe");
					return;
				}
				let data = {
					tid: ids[0],
					uid: ids[1],
					end_ts: end_ts,
					filename: filename,
					report_obj: report_obj
				};
				// Save report to database
				archive_log(data, (err) => {
					if(err){
						callback(err);
						return;
					}
					// Update user's personal best
					update_best_tfi(ids[1], report_obj.longest_tfi, (err) => {
						if(err){
							callback(err);
							return;
						}
						callback(null, report_obj);
					});
				});
			});
		});
	});
}

function load_recent_report(tid, uid, callback){
	/**
	*	Search the session archive for a recently completed session btw tid & uid
	*	Then (if found) load that report and return it as an object
	*/
	sql.connect((err, con) => {
		if(err){
			callback(err);
			return;
		}
		let tidN = tid[0] = "a" ? 0 : sql.esc(id_to_N(tid));
		let uidN = sql.esc(id_to_N(uid));
		// Load all session files btw tid & uid that ended in the last 5 minutes
		// Sorted so that the first one is the most recent
		let select_query = `SELECT *
FROM session_archive_index 
WHERE TID=${tidN} AND UID=${uidN}
AND TIMEDIFF( UTC_TIMESTAMP(), STR_TO_DATE(end_ts, "%Y-%m-%dT%T.%fZ") ) < TIME("00:05:00")
ORDER BY end_ts DESC`;
		con.query(select_query, (err, result, fields) => {
			if(err){
				callback(err);
				return;
			}
			if(result.length > 0){
				callback(null, result[0]);
			}
			else{
				// No error, no report
				callback(null);
			}
		});
	});
}

function list_archived_sessions(uid, stype, callback){
	/**
	*	Return a list of all session archives associated with the given user
	*	If uid is undefined, then load all of them
	*/
	sql.connect((err, con) => {
		if(err){
			callback(err);
			return;
		}
		// Load all session files w/ uid
		// Sorted so that the first one is the most recent
		let select_query = `SELECT *
FROM session_archive_index`;
		if(uid || stype){
			select_query += `
WHERE `;
			if(uid){
				let uidN = sql.esc(id_to_N(uid));
				select_query += `UID=${uidN}`;
				if(stype)
					select_query += `
AND `;
			}
			if(stype){
				select_query += `tsp_stype=${sql.esc(stype)}`;
			}
		}
		
		select_query += `
ORDER BY end_ts DESC`;
		db_log(select_query);
		con.query(select_query, (err, result, fields) => {
			if(err){
				callback(err);
				return;
			}
			callback(null, result);
		});
	});
}