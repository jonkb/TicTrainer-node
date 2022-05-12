/* Create Admins Table */

CREATE TABLE admins (
ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
password_hash BINARY(32) NOT NULL
);

/*
	Insert a default admin account because there is no way to create an admin
	from the web interface without having an existing admin.
	After creating the database, always change the password of a1.
*/

INSERT INTO admins (password_hash)
VALUES (UNHEX(SHA2("'tmp_admin_pw'", 256)));
