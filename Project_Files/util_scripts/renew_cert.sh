#!/bin/bash

if [ $(whoami) != "root" ] ; then
	echo "This program won't work unless run as root."
	exit 0
fi

/home/ec2-user/util_scripts/killTT.sh

sudo /usr/local/bin/certbot-auto certonly --force-renewal -d tictrainer.com -d www.tictrainer.com --standalone --cert-name tictrainer.com --preferred-challenges http

/home/ec2-user/util_scripts/runTT.sh


