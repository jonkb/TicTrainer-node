/* See https://techviewleo.com/how-to-install-mysql-8-on-amazon-linux-2/
	for a good guide on installing mysql 8.0
*/

/* Change 'password' */
create user 'nodejs'@'localhost' identified by 'password';

create database tictrainer;

grant select, insert, update, create, references on tictrainer.* to 'nodejs'@'localhost';
