#!/bin/bash

# Make a backup of the SQL database and of the logs folder

# Load the sql key
cd /home/ec2-user/
#sqlkey=$(python -c 'import json; obj=json.load(open("keys.json")); print(obj["sql"]);')
sqlkey=$(cat backuper_key)

# Make a new backup folder for today
date_str=$(date +%Y%m%d)
mkdir backups/Tt_${date_str}
# Dump the database
mysqldump -u backuper -p${sqlkey} tictrainer > backups/Tt_${date_str}/Tt_db_${date_str}.sql
# Copy over the logs
cp -r TicTrainer-node/src/logs backups/Tt_${date_str}/Tt_logs_${date_str}
# Compress this new folder
tar --remove-files -czf backups/Tt_${date_str}.tar.gz backups/Tt_${date_str}
