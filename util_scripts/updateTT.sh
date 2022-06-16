#!/bin/bash

if [ $(whoami) != "root" ] ; then
	echo "This program won't work unless run as root."
	exit 0
fi

echo "This script will do the following:"
echo "1. Backup the database & logs"
echo "2. Stop the server"
echo "3. Pull updates from GitHub without changing settings.json or src/logs/"
echo "4. Open settings.json and pulled_settings.json in vim for you to update the settings"
echo "5. Restart the server"
read -p "Press any key to continue (or Ctrl+C to cancel)"

# Backup database & logs
/home/ec2-user/TicTrainer-node/util_scripts/backupTT.sh

# Stop the server
/home/ec2-user/TicTrainer-node/util_scripts/killTT.sh

# Make copies of old logs & settings
cd /home/ec2-user/TicTrainer-node/src
cp -r logs old_logs
cp settings.json old_settings.json
# Update from Github
git fetch
git pull
# Revert to old logs & settings
mv logs pulled_logs
mv old_logs logs
mv settings.json pulled_settings.json
mv old_settings settings.json
# Prompt for edits to settings.json, based on the pulled settings
vi -p settings.json pulled_settings.json

# Restart the server
/home/ec2-user/TicTrainer-node/util_scripts/runTT.sh

echo "The /src/logs/ folder was not changed"
echo "See /src/pulled_logs for the version of that folder pulled from GitHub"
echo "If any changes were desired, make those changes"
