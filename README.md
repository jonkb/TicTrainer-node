# TicTrainer-node

This project contains the files used to serve TicTrainer™ via node.js. 
TicTrainer™ is a web tool meant to help people build their ability to fight their tics. 
It was built to implement the RE-ERP strategy developed by Kevin Black (see draft description [here](https://www.authorea.com/users/4510/articles/174766-software-for-web-based-tic-suppression-training/_show_article)).

## Starting the server
1. Download the repository to the server
	- $ git clone https://github.com/jonkb/TicTrainer-node.git
	- or, download and scp those files
2. Set constants (optional)
	- The constant "debugging" in root/scripts/auxiliary.js is 0 by default. That means almost no log messages.
	- The constant "PORT" in root/server.js is set to 443 by default for https. That probably shouldn't change.
3. Start the server
	- (obviously node.js needs to be installed)
	- Run it from the .../root/ directory!
	- .../root$ sudo nohup node server.js &> ../"Project Files"/log.txt
	- "nohup" lets the server continue running after closing the ssh session
	- "&>" pipes error and regular output to log.txt
	- It needs to be run as root to use ports 80 and 443
4. Make sure the domain name is linked to the server's IP
	- AWS elastic IPs help with this.
	- (From godaddy.com) link the domain name (_e.g._ TicTrainer.com) to the IP address of the server. 
.
