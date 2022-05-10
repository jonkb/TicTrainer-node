/* Create Survey State Table */

CREATE TABLE survey_state (
TID INT NOT NULL,
UID INT NOT NULL,
consent_state BIT(2) NOT NULL DEFAULT b'00',
consent_ts VARCHAR(24) NOT NULL DEFAULT "2000-01-01T00:00:00.000Z",
last_survey_ts VARCHAR(24) NOT NULL DEFAULT "2000-01-01T00:00:00.000Z",
PRIMARY KEY (TID, UID),
CONSTRAINT fk_ssTUID
FOREIGN KEY (TID, UID)
REFERENCES trainer_links(TID, UID)
);

/*
consent_state:
	b'00': Not yet asked for consent
	b'01': consented
	b'10': opted out
	b'11': UNUSED (currently)
consent_ts: Timestamp of when consent_state last changed
	This could be considered bad normalization form, but I'm not happy with the
	built-in timestamps that can be used for auto-updating.
	Mostly b/c of Y2038.
last_survey_ts: Timestamp of last survey completion

default timestamps: DEFAULT "2000-01-01T00:00:00.000Z"
	I like the idea of always being able to parse ts fields as ISO strings.
*/