# TicTrainer and TicTimer Web

This project contains the files used to serve TicTrainer™ via node.js. 
TicTrainer™ is a web tool meant to help people build their ability to fight their tics. 
It was built to implement the RE-ERP strategy proposed by Kevin Black (see description [here](http://dx.doi.org/10.12688/f1000research.13460.1)).

Also included now is TicTimer Web, which runs on the same server and is accessed at webroot/tsp/. 
TicTimer is a program designed to automate record keeping and reward delivery during tic suppression research. 
This web-based version of TicTimer allows for sessions to be performed remotely and 
without the bulky token dispenser hardware that was used with [the previous version of TicTimer](https://github.com/jonkb/TicTimer). 
Additional information to be added here when published.

## Download and Installation
1. Download this git repository to the server
	1. `$ git clone --depth 1 -b master https://github.com/jonkb/TicTrainer-node.git`
	2. alternatively, download and scp those files
2. Install mysql 8.0 [Guide](https://techviewleo.com/how-to-install-mysql-8-on-amazon-linux-2/)
3. Install node.js 12 [Guide](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html) [Better? Guide](https://tecadmin.net/install-latest-nodejs-and-npm-on-centos/)
	1. Run `$ npm install` From the /src folder to install dependencies from package.json

## Setup
1. Set up mysql database
	1. If restoring from a backup, do that and skip the following. [Backup/Restore Guide](https://phoenixnap.com/kb/how-to-backup-restore-a-mysql-database)
	2. Start the mysql database if not already running `$ mysqld`
	3. Log in as root `$ mysql -u root -p`
	4. Create the nodejs user and the tictrainer database as described in Project_Files/sql/setup.sql
		1. Can copy and paste everything except the password
	5. Execute the other .sql files in that folder. Order matters [Guide](https://dev.mysql.com/doc/refman/8.0/en/mysql-batch-commands.html)
		1. Create accounts tables (admins.sql, trainers.sql, users.sql)
		2. Create links table (links.sql)
		3. Create survey_state table (survey_state.sql)
		4. Create session index table (sessions.sql)
2. Add the keys.json file to the parent directory of the git repository
~~~
keys.json:
{
	"sql": "[mysql_password]",
	"ckses": "[cookie_key]"
}
~~~
3. Alter settings if needed (src/settings.json)
	1. A clear description of each of the settings is in the file src/settings_description.txt
	2. The constant "testing" should be set as *false* for the server to use the normal ports (80 and 443). 
		Otherwise, it will run on port 8888.
	3. Be sure to keep the proper formatting of the json file.
4. Hosting-specific things (This is not generalizable, but this is how we did it)
	1. Set up certbot for Let's Encrypt. Guide [here](https://dade2.net/kb/how-to-install-and-configure-certbot-on-apache-centos/), but don't follow whole thing
		1. `$ yum install epel-release`
		2. `$ yum install certbot`
	2. Get certificate from Let's Encrypt.
		1. `sudo certbot certonly --force-renewal -d tictrainer.com -d www.tictrainer.com --standalone --cert-name tictrainer.com --preferred-challenges http`
		2. Port 80 needs to be free (i.e. don't have the server running)
		3. The domain name needs to be set up to redirect to the server.
	3. Create crontab jobs
		1. Let's Encrypt auto-renewing certificate: `$ sudo crontab -e` 
			1. `32 04 3 1,3,5,7,9,11 * /home/ec2-user/TicTrainer-node/util_scripts/renew_cert.sh`
			2. This auto-renews the certificate every odd month. On the inside, this script runs the same command from 4.ii.a
		2. FreeDNS update IP: `$ crontab -e`
			1. If your server IP address is changing unpredictably: `3,8,13,18,23,28,33,38,43,48,53,58 * * * * sleep 22 ; curl -s http://sync.afraid.org/u/xRVpcm1UCjJvfgRsjJsTHT37/ >> /tmp/freedns_tictrainer_mooo_com.log 2>/dev/null`
			2. If your server IP address is more stable: `21 2,14 * * * sleep 17; curl -s http://sync.afraid.org/u/xRVpcm1UCjJvfgRsjJsTHT37/ >> /tmp/freedns_tictrainer_mooo_com.log 2>/dev/null`

## Running the server
Run the script /util_scripts/runTT.sh (making sure that the pathnames are correct there)

or

1. cd to the "/src" directory.
2. `path/to/Tt_repository/src$ sudo nohup node server.js &> logs/log.txt &`
	1. "sudo" because it needs to be run as root to use ports 80 and 443
	2. "nohup" lets the server continue running after closing the ssh session
	3. "&>" pipes output to log.txt
