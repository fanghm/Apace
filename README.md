## INSTALLATION ##
* Install MongoDB
* Install Node.js
* Download source code to a local folder, or clone it from: https://github.com/fanghm/apace
* Install dependencies with source folder: `npm i`

## CONFIGURATION ##
* /config.js
  * debug: false                  # note: all mails are sending to config.test_email in debug mode
  * db: <mongodb_connection_uri>  # refer: https://docs.mongodb.com/manual/reference/connection-string/

* Set env variable (preferably in .bashrc): `export NODE_ENV='production'`

* Import JSON format of user data file that contains uidNumber (type: Number), name and mail fields at least, for the purpose of auto-complete input of action owners:
  * `$ mongoimport --db <db_name> --collection users --jsonArray < employee_name_list.csv`
