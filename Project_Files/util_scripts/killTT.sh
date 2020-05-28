#!/bin/bash

if [ $(whoami) != "root" ] ; then
	echo "This program won't work unless run as root."
	exit 0
fi

#This part kills the last running node server
ps_str=$(ps -A | grep node)
IFS=' '
read -ra split_arr <<<$ps_str
ps_id=${split_arr[0]}
kill $ps_id

