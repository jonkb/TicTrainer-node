# TicTrainer-node

This project contains the files used to serve TicTrainer™ via node.js. 
TicTrainer™ is a web tool meant to help people build their ability to fight their tics. 
It was built to implement the RE-ERP strategy proposed by Kevin Black (see description [here](http://dx.doi.org/10.12688/f1000research.13460.1)).

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
	- .../root$ sudo nohup node server.js &> ../"Project_Files"/log.txt
	- "nohup" lets the server continue running after closing the ssh session
	- "&>" pipes error and regular output to log.txt
	- It needs to be run as root to use ports 80 and 443
4. Make sure the domain name is linked to the server's IP
	- AWS elastic IPs help with this.
	- (From godaddy.com) link the domain name (_e.g._ TicTrainer.com) to the IP address of the server. 
	
## Starting the server with Docker
1. Install Docker
	- On Windows 10 Pro, you can use [Docker Desktop](https://docs.docker.com/docker-for-windows/install/).
	- Installing Docker on Linux ([Ubuntu](https://docs.docker.com/install/linux/docker-ce/ubuntu/), [CentOS](https://docs.docker.com/install/linux/docker-ce/centos/))
2. Install [Git](https://git-scm.com/download/)
3. (For Windows users) Install [Windows Terminal](https://www.microsoft.com/en-us/p/windows-terminal-preview/9n0dx20hk701) (It's better than "cmd.exe").
4. Clone the git repository and checkout the "token_dispenser" branch.
	- `git clone https://github.com/jonkb/TicTrainer-node.git`
5. Configure a docker-compose .env file
	- Copy sample.env to .env
	- Open .env in a text editor, set the `NODE_ROOT_PATH` for your system (the git repo path + /root)
6. Run docker-compose up to bring up the server
	- `docker-compose up`
	- To edit things like the node version, port, etc., you can edit docker-compose.yml
7. Go to `localhost:8888` to use the site.
8. To stop the server:
	- In the terminal where you ran docker-compose, press Ctrl-C
	- This will stop the containers, but won't remove them
	- To remove the containers: `docker-compose down`
