/* Create Account Links Tables */

CREATE TABLE trainer_links (
TID INT NOT NULL,
UID INT NOT NULL,
PRIMARY KEY (TID, UID),
CONSTRAINT fk_tlTID
FOREIGN KEY (TID)
REFERENCES trainers(ID),
CONSTRAINT fk_tlUID
FOREIGN KEY (UID)
REFERENCES users(ID)
);

CREATE TABLE user_links (
TID INT NOT NULL,
UID INT NOT NULL,
PRIMARY KEY (TID, UID),
CONSTRAINT fk_ulTID
FOREIGN KEY (TID)
REFERENCES trainers(ID),
CONSTRAINT fk_ulUID
FOREIGN KEY (UID)
REFERENCES users(ID)
);

/*
	Note: These are 2 separate tables because the links are one-directional.
		Alternatively I could combine them and just include an "owner" field: T/U.
		Or... make it so that only one needs to link, then the link is made?
	
	Note: Using the composite key makes it impossible to duplicate entries.
		I think... I'm no pro.
*/
