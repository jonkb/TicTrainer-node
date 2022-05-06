/* See https://techviewleo.com/how-to-install-mysql-8-on-amazon-linux-2/
		for a good guide on installing mysql 8.0
	See https://www.sqlshack.com/learn-mysql-install-mysql-server-8-0-19-using-a-noinstall-zip-archive/
		and https://dev.mysql.com/doc/refman/5.7/en/data-directory-initialization.html
		for a guide on using noinstall mysql 8.0
	See https://stackoverflow.com/questions/8940230/how-to-run-sql-script-in-mysql
		for running scripts in mysql
*/

/* Change 'password' */
create user 'nodejs'@'localhost' identified by 'password';

create database tictrainer;

grant select, insert, update, create, references on tictrainer.* to 'nodejs'@'localhost';
