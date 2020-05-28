#!/bin/bash

cd ~/src/
date_str=$(date +%Y%m%d)
mv ./TicTrainer-node ./"Tt"$date_str

git clone https://github.com/jonkb/TicTrainer-node.git

#Copy over important files from the old server
cp ./"Tt"$date_str/root/account/user_data/* ./TicTrainer-node/root/account/user_data
cp ./"Tt"$date_str/root/account/trainer_data/* ./TicTrainer-node/root/account/trainer_data
cp ./"Tt"$date_str/root/account/admin_data/* ./TicTrainer-node/root/account/admin_data
cp ./"Tt"$date_str/root/session/archive/* ./TicTrainer-node/root/session/archive
cp ./"Tt"$date_str/root/account/next_IDs.ttd ./TicTrainer-node/root/account/next_IDs.ttd

echo "Now kill the old server and run runTT.sh"
echo "You may want to edit the settings first in root/scripts/settings.json"

