#!/bin/bash

if [ $(whoami) != "root" ] ; then
	echo "This program won't work unless run as root."
	exit 0
fi

/home/ec2-user/TicTrainer-node/util_scripts/killTT.sh

sudo certbot certonly --force-renewal -d tictrainer.com -d www.tictrainer.com --standalone --cert-name tictrainer.com --preferred-challenges http

/home/ec2-user/TicTrainer-node/util_scripts/runTT.sh

