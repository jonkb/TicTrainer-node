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
// module.exports.pool = pool; --> BELOW

// https://www.npmjs.com/package/mysql2#using-connection-pools
const pool_details = {
	host: 'localhost',
	user: 'nodejs',
	password: keys.sql,
	database: 'tictrainer',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
};
// Create the connection pool
const pool = mysql.createPool(pool_details);
module.exports.pool = pool;

// MySQL Connection details & credentials
const con_details = {
	host: 'localhost',
	user: 'nodejs',
	password: keys.sql,
	database: 'tictrainer'
};

function connect(callback){
	/**
	*	Connect to the tictrainer db
	*	callback arguments: (err, connection)
	*	CAUTION: Remember to close this connection with con.end()
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
