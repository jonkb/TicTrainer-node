# TicTrainer-node

This project contains the files used to serve TicTrainer™ via node.js. TicTrainer™ is a web tool meant to help people build their ability to fight their tics. It was built to implement the RE-ERP strategy developed by Kevin Black (http://www.purl.org/net/kbmd).

**IMPORTANT NOTE:** Make sure not to upload real user data back to github from the server. This shouldn't be easy to do, you'd need to be a collaborator on the github project. (As of 5/9/17, that's just 2 people: jonkb and KBMD.) Just be careful not to make commits on the server that include private data and push them back to the origin with authentication. As it stands today, everything in ttad files on github is just data generated during tests with fake accounts. Update: those files are now gitignored.

## Starting the server
1. Download the repository to the server
	- $ git clone https://github.com/jonkb/TicTrainer-node.git
	- or, download and scp those files
2. Set constants
	- The constant "debugging" in root/scripts/auliliary.js should be set before executing
	- The constant "PORT" in root/server.js should also be set (probably to 80)
3. Start the server
	- (obviously node.js needs to be installed)
	- Run it from the .../root/ directory!
	- .../root$ sudo nohup node server.js &> ../"Project Files"/log.txt
	- "nohup" lets the server continue running after closing the ssh session
	- "&>" pipes error and regular output to log.txt
	- It needs to be run as root to use port 80 and 443
4. Make sure the domain name is linked to the server's IP
	- AWS elastic IPs help with this.
	- (From godaddy.com) link the domain name (TicTrainer.com) to the IP address of the server. 
