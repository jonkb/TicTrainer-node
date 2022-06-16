#!/bin/bash

# Check if root
if [ $(whoami) != "root" ] ; then
	echo "This program won't work unless run as root."
	exit 0
fi

# Check if server already running
ps_str=$(ps -A | grep node)
if [ ${#ps_str} -gt 0 ] ; then
echo "A server is already running. kill it first."
exit 0
fi

# cd and start the server
cd /home/ec2-user/TicTrainer-node/src
nohup node server.js &>> logs/log.txt &
