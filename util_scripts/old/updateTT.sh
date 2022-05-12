#!/bin/bash

cd ~/src/
date_str=$(date +%Y%m%d)
mv ./TicTrainer-node ./"Tt"$date_str

#This is a really inefficient way to do it, leaving tons of extra data everywhere, but it seems like the safest way to do it all without any chance of interrupting the ongoing server or losing any user data.
#In the future I may switch this to simply git fetch and pull.
git clone https://github.com/jonkb/TicTrainer-node.git

#Copy over important files from the old server
cp ./"Tt"$date_str/root/account/user_data/* ./TicTrainer-node/root/account/user_data
cp ./"Tt"$date_str/root/account/trainer_data/* ./TicTrainer-node/root/account/trainer_data
cp ./"Tt"$date_str/root/account/admin_data/* ./TicTrainer-node/root/account/admin_data
cp ./"Tt"$date_str/root/session/archive/* ./TicTrainer-node/root/session/archive
#cp ./"Tt"$date_str/root/account/next_IDs.ttd ./TicTrainer-node/root/account/next_IDs.ttd
cp ./"Tt"$date_str/root/settings.json ./TicTrainer-node/root/oldsettings.json
cp ./"Tt"$date_str/root/error/log.ttd ./TicTrainer-node/root/error/oldlog.ttd

echo "Now restart the server with killTT.sh and runTT.sh"
echo "You may want to edit the settings first in root/scripts/settings.json"

