# TicTrainer and TicTimer Web

This project contains the files used to serve TicTrainer™ via node.js. 
TicTrainer™ is a web tool meant to help people build their ability to fight their tics. 
It was built to implement the RE-ERP strategy proposed by Kevin Black (see description [here](http://dx.doi.org/10.12688/f1000research.13460.1)).

Also included now is TicTimer Web, which runs on the same server and is accessed at root/nt/. 
TicTimer is a program designed to automate record keeping and reward delivery during tic suppression research. 
This web-based version of TicTimer allows for sessions to be performed remotely and 
without the bulky token dispenser hardware that was used with [the previous version of TicTimer](https://github.com/jonkb/TicTimer). 
Additional information to be added here when published.

## Starting the server
1. Download the repository to the server
	- $ git clone https://github.com/jonkb/TicTrainer-node.git
	- alternatively, download and scp those files
2. Alter settings if needed (root/settings.json)
	- A clear description of each of the settings is in the file root/settings_description.txt
	- The constant "testing" should be set as *false* for the server to use the normal ports (80 and 443). 
		Otherwise, it will run on port 8888.
	- Be sure to keep the proper formatting of the json file.
3. Start the server
	- node.js must be installed already.
	- cd to the "/root" directory.
	- path/to/Tt_repository/root$ sudo nohup node server.js &> ../"Project_Files"/log.txt
	- "sudo" because it needs to be run as root to use ports 80 and 443
	- "nohup" lets the server continue running after closing the ssh session
	- "&>" pipes output to log.txt
