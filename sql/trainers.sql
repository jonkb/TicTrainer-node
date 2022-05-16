/* Create Trainers Table */

CREATE TABLE trainers (
ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
password_hash BINARY(32) NOT NULL,
birth_year YEAR NOT NULL
);

/*
	Links are in their own table
	
	EXAMPLE INSERTION:
INSERT INTO users (password_hash, birth_date, sex)
    -> VALUES (0x88B9584E81C84B5F11700F87F31CE71A463946A0741DFBFCB51B8221E97F8AA9, "2000-01-01", "M");

	Note: careful when migrating data over from existing accounts, with the autoincrement column. I'm not sure if you can insert the ID as well.

*/