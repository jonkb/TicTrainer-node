#!/bin/bash

resetting="true"

if [ $(whoami) = root ] ; then
	cd ~/TicTrainer-node/root
	#set PORT
	ex +'/const\ PORT/s/8888/80' -cwq server.js
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
	#actually start it now
	nohup node server.js &> ../"Project Files"/log.txt &
else
	echo Script $0 needs to be run as root.
fi
