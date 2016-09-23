##INSTALLATION##
* Install MongoDB
* Install Node.js
* Download source code, or use git clone to get source code from: https://github.com/fanghm/apace
* Install dependencies: `npm i`
* Settings
  * /config.js
    * debug: false
    * db: <db_name>

  * set env variable: `export NODE_ENV='production'`

* Import user data (for auto-complete in name inputing), should contain uidNumber, name and mail fields
  * `mongoimport --db <db_name> --collection users --jsonArray < names.csv`