var config = {}

config.localhost = "realtime-gbi-shivu7sm.c9users.io"; //Define the Local Host Name

config.dbURL = "mongodb://localhost/jiradb"; // Define database URL - Supports mongodb only

config.bfdate = "11/24/2017"; //Define the Event Start Date


//API AUTHENTICATION RELATED
config.clientId = '56370d89a0-lc-gbi-integration';
config.clientSecret = 'fd8378729093b9cfaf76';
config.accessTokenUri = 'https://api.omniture.com/token';
config.grant_type = 'client_credentials';

//HEADER RELATED
config.allowedOrigins = ['http://127.0.0.1', 'http://localhost', 'http://insrv03.lenovo.com', 'http://lenovocentral.lenovo.com'];


//EXPORT THE CONFIG VARIABLE TO THE APPLICATION
module.exports = config;
