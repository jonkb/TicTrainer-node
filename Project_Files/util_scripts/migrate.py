# I was thinking of doing this in bash, but I realized I'm not that good at bash.

# This file is to migrate all the data over from the old system to the new system.
# Tables: admins, trainers, users, trainer_links, user_links, session_archive_index
# Do I want to index the sessions, or can I skip that?

import datetime
import mysql.connector as sqlcon

# Set up database connection
# See https://www.w3schools.com/python/python_mysql_update.asp
sql_usr = "nodejs"
sql_pw = input("sql pw: ")
mydb = sqlcon.connect(
  host="localhost",
  user=sql_usr,
  password=sql_pw,
  database="tictrainer",
  auth_plugin="mysql_native_password"
)
cursor = mydb.cursor(prepared=True)

def load_ttad(filename):
  ## Load data from the given account file and return an array.
  # Format: <> <> <> ...
  entries = []
  current = ""
  lookingAtData = False
  with open(filename) as file:
    while True:
      c = file.read(1)
      if not c:
        break;
      if c == "<":
        lookingAtData = True
      elif c == ">":
        entries.append(current)
        current = ""
        lookingAtData = False
      elif lookingAtData:
        current += c
  return entries
def id2N(id):
  ## id to N
  s = id[1:]
  return int(s, 36)
def ttad_to_user(ttad):
  ## Take an array of strings loaded from a ttad file
  # Returns a dictionary ready to be inserted into the users table
  d = dict()
  id = ttad[0]
  assert id[0] == 'u'
  d["ID"] = id2N(id)
  pw = ttad[1]
  d["pw"] = pw # UNSAFE SQL to hash it
  dt = datetime.datetime.fromtimestamp(int(ttad[2]) / 1000, tz=datetime.timezone.utc)
  d["bd"] = format(dt, "%Y-%m-%d")
  d["links"] = ttad[3] # Takes some extra work
  d["sex"] = ttad[4] # Already in char(1) format
  lpc = ttad[5].split(",")
  d["level"] = lpc[0]
  d["points"] = lpc[1]
  d["coins"] = lpc[2]
  d["items"] = ttad[6] # Same format - string of chars
  R_settings = ttad[7].split(",") #(RS,AITI,SMPR,PTIR,FLASH)
  d["RID"] = "" if ttad[8] == "-" else ttad[8]
  d["RSTATE"] = R_settings[0]
  d["AITI"] = R_settings[1]
  d["SMPR"] = R_settings[2]
  d["PTIR"] = R_settings[3]
  d["FLASH"] = R_settings[4]
  return d
def ttad_to_trainer(ttad):
  ## Take an array of strings loaded from a ttad file
  # Returns a dictionary ready to be inserted into the users table
  d = dict()
  id = ttad[0]
  assert id[0] == 't'
  d["ID"] = id2N(id)
  pw = ttad[1]
  d["pw"] = pw # UNSAFE SQL to hash it
  d["birth_year"] = ttad[2]
  d["links"] = ttad[3] # Takes some extra work
  return d
def ttad_to_admin(ttad):
  ## Take an array of strings loaded from a ttad file
  # Returns a dictionary ready to be inserted into the users table
  d = dict()
  id = ttad[0]
  assert id[0] == 'a'
  d["ID"] = id2N(id)
  pw = ttad[1]
  d["pw"] = pw # UNSAFE SQL to hash it
  return d
def insert_user(d):
  ## Take the object and insert it into the db
  query = """INSERT INTO users (ID, password_hash, birth_date, sex, level, points, coins, items, RID, RSTATE, AITI, SMPR, PTIR, FLASH)
VALUES (%s, UNHEX(SHA2('%s',256)), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);"""
  vals = (d['ID'], d['pw'], d['bd'], d['sex'], d['level'], d['points'], d['coins'], d['items'], d['RID'], d['RSTATE'], d['AITI'], d['SMPR'], d['PTIR'], d['FLASH'])
  cursor.execute(query, vals);
  mydb.commit()

data = ttad_to_user(load_ttad("../../src/db/account/user_data/u3.ttad"))
print(data)
insert_user(data)
data = ttad_to_trainer(load_ttad("../../src/db/account/trainer_data/t1.ttad"))
print(data)
data = ttad_to_admin(load_ttad("../../src/db/account/admin_data/a1.ttad"))
print(data)

