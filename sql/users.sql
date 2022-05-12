/* Create Users Table */

CREATE TABLE users (
ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
password_hash BINARY(32) NOT NULL,
birth_date DATE NOT NULL,
sex CHAR(1) NOT NULL,
level INT NOT NULL DEFAULT 0,
points INT NOT NULL DEFAULT 0,
coins INT NOT NULL DEFAULT 0,
best_tfi INT NOT NULL DEFAULT 0,
items VARCHAR(255) NOT NULL DEFAULT "",
RID VARCHAR(32) NOT NULL DEFAULT "",
RSTATE VARCHAR(4) NOT NULL DEFAULT "REG",
AITI INT NOT NULL DEFAULT 10,
SMPR INT NOT NULL DEFAULT 3000,
PTIR INT NOT NULL DEFAULT 5,
FLASH BOOL NOT NULL DEFAULT 0
);

/*
	Note: best_tfi = best tic-free time in milliseconds
	Links are in their own table
	
	EXAMPLE INSERTION:
INSERT INTO users (password_hash, birth_date, sex)
    -> VALUES (0x88B9584E81C84B5F11700F87F31CE71A463946A0741DFBFCB51B8221E97F8AA9, "2000-01-01", "M");

	Note: careful when migrating data over from existing accounts, with the autoincrement column. I'm not sure if you can insert the ID as well.

*/