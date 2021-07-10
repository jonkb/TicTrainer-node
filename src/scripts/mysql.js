/**
*	Functions for interacting with the SQL database
*/

const mysql = require("mysql2");

module.exports.connect = connect;
module.exports.esc = mysql.escape;

// MySQL Connection details & credentials
// Slightly more secure method: Ask for sql pw
// const prompt = require('prompt-sync')();
// pw = prompt("MySQL pw: ");
// TEMP: We do not want the actual sql password in plain text
pw = "tmp_nodepw";
var con_details = {
	host: 'localhost',
	user: 'nodejs',
	password: pw,
	database: 'codecredits'
};

function connect(callback){
	/**
	*	Connect to the codecredits db
	*	callback arguments: (err, connection)
	*/
	var connection = mysql.createConnection(con_details);
	connection.connect((err) => {
	  if (err) {
		  callback(err);
		  return;
	  }
	  console.log('Connected to MySQL Server: codecredits database');
	  callback(null, connection);
	});
}
