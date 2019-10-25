#!/bin/bash
#Not very polished yet
#For now, must be run from within the directory [Tt]/root/
#Example: > sudo ../Project_Files/runTT.sh

#Do you want to delete the account data and archives?
resetting="false"

if [ $(whoami) = root ] ; then
	#set PORT
	#ex +'/const\ PORT/s/8888/80' -cwq server.js
	#set debugging
	ex +'/const\ debugging/s/[[:digit:]]/0' -cwq scripts/auxiliary.js
	if [ $resetting = "true" ] ; then
		#reset next_IDs
		echo "<t0>\n<u0>" | cat > account/next_IDs.ttd
		#delete accounts and sessions
		rm accounts/user_data/*.ttad
		rm accounts/trainer_data/*.ttad
		rm session/archive/*.ttsd
	fi
	#start the server
	nohup node server.js &> ../"Project_Files"/log.txt &
else
	echo Script $0 needs to be run as root.
fi
