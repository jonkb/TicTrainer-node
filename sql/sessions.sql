/* Create tables used by sessions*/

CREATE TABLE session_archive_index (
ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
TID INT NOT NULL,
UID INT NOT NULL,
filename VARCHAR(255) NOT NULL,
end_ts VARCHAR(24) NOT NULL,
duration INT NOT NULL,
levels INT NOT NULL,
points INT NOT NULL,
coins INT NOT NULL,
tics INT NOT NULL,
longest_tfi INT NOT NULL,
tens_tfis INT NOT NULL,
is_tsp BOOLEAN NOT NULL DEFAULT 0,
tsp_stype VARCHAR(255) NOT NULL DEFAULT "",
tsp_rewards INT NOT NULL DEFAULT 0,
tt_version VARCHAR(255) NOT NULL,
CONSTRAINT fk_saUID
FOREIGN KEY (UID)
REFERENCES users(ID)
);

/*
	This table is an index of completed session files that makes it easy to search.
	For example, you could select all sessions involving u1 & t2 after a certain date.
	
	For communication during sessions and the main session logs, I think I want to 
	stick with the current system of writing to and reading from a session file that
	then gets archived.
	What about /tsp/ and admin sessions? That's why there's no fk constraint on TID.
	
	What about lnusers? They're really ephemeral and better off in RAM or a text file.
	The current solution stores them in RAM. I don't think it'll ever grow to be very 
	big, and if it does, then we will have better resources.
*/

/* OLD:

CREATE TABLE session_archive_index (
ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
TID INT NOT NULL,
UID INT NOT NULL,
filename VARCHAR(255) NOT NULL,
end_ts VARCHAR(24) NOT NULL,
length INT NOT NULL,
levels INT NOT NULL,
points INT NOT NULL,
coins INT NOT NULL,
tics INT NOT NULL,
longest_tfi INT NOT NULL,
ten_s_tfis INT NOT NULL,
CONSTRAINT fk_saTID
FOREIGN KEY (TID)
REFERENCES trainers(ID),
CONSTRAINT fk_saUID
FOREIGN KEY (UID)
REFERENCES users(ID)
);
*/