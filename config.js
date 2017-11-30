var config = {}

config.PORT = "process.env.PORT"; //change it to 80 if you are running it locally

config.localhost = "realtime-gbi-shivu7sm.c9users.io"; //Define the Local Host Name

config.dbURL = "mongodb://localhost/jiradb"; // Define database URL - Supports mongodb only

config.bfdate = "11/24/2017"; //Define the Event Start Date


//API AUTHENTICATION RELATED
config.clientId = '';
config.clientSecret = '';
config.accessTokenUri = 'https://api.omniture.com/token';
config.grant_type = 'client_credentials';

//HEADER RELATED
config.allowedOrigins = ['http://127.0.0.1', 'http://localhost', 'http://insrv03.lenovo.com', 'http://lenovocentral.lenovo.com'];

//ADOBE RELATED CONFIGURATION
config.reportSuiteID= "lenovoglobal";


//EXPORT THE CONFIG VARIABLE TO THE APPLICATION
module.exports = config;
