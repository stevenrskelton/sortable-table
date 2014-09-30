CREATE DATABASE sortabletable;
CREATE USER sortabletable@localhost IDENTIFIED BY '';
GRANT SELECT ON sortabletable.sp500 TO sortabletable@localhost;