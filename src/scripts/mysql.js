/**
*	Functions for interacting with the SQL database
*/

const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");
// Load keys
const keys_path = path.join(__dirname, "/../../../keys.json");
const keys = JSON.parse(fs.readFileSync(keys_path));

module.exports.connect = connect;
module.exports.esc = mysql.escape;

// MySQL Connection details & credentials
var con_details = {
	host: 'localhost',
	user: 'nodejs',
	password: keys.sql,
	database: 'tictrainer'
};

function connect(callback){
	/**
	*	Connect to the tictrainer db
	*	callback arguments: (err, connection)
	*/
	var connection = mysql.createConnection(con_details);
	connection.connect((err) => {
	  if (err) {
		  callback(err);
		  return;
	  }
	  //console.log('Connected to MySQL Server: tictrainer database');
	  callback(null, connection);
	});
}
