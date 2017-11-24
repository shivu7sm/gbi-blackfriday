var express = require("express");
var request = require('request');
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var https = require("https");
var dateFormat = require('dateformat');
var User = require("./models/user");
var ClientOAuth2 = require('client-oauth2');
var sleep = require('sleep');
var schedule = require('node-schedule');


// MAIN CONFIGURATIONS

var localhost = "realtime-gbi-shivu7sm.c9users.io"; //Define the Local Host Name
var dbURL = "mongodb://localhost/jiradb"; // Define database URL - Supports mongodb only
var bfdate = "11/24/2017"; //Define the Event Start Date
var reportUpdateURL = 'http://' + localhost + '/gbi/update/report';
var realtimeUpdateURL = 'http://' + localhost + '/gbi/update/realtime';

// Connect to database
mongoose.connect(dbURL);

var app = express();
app.set("view engine", "ejs");
app.use(function(req, res, next) {
    var allowedOrigins = ['http://127.0.0.1', 'http://localhost', 'http://insrv03.lenovo.com', 'http://lenovocentral.lenovo.com'];
    var origin = req.headers.origin;
    if (allowedOrigins.indexOf(origin) > -1) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    //res.header('Access-Control-Allow-Origin', 'http://127.0.0.1');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
});
app.use(bodyParser.urlencoded({
    extended: true
}));


// DEFINE CRON JOBS HERE
var j = schedule.scheduleJob('*/5 * * * * *', function() {
    console.log('The answer to life, the universe, and everything!');
    request(realtimeUpdateURL, function(error, response, body) {

    });
});

// DEFINE AUTHENTICATION VARIABLE
var adobeAuth = new ClientOAuth2({
    clientId: '56370d89a0-lc-gbi-integration',
    clientSecret: 'fd8378729093b9cfaf76',
    accessTokenUri: 'https://api.omniture.com/token',
    grant_type: 'client_credentials'
})

// DEFINE DB SCHEMA

var gbiDataSchema = new mongoose.Schema({
    key: String,
    totalrevenue: Number,
    totalunits: Number,
    totalUpdateDate: Date,
    totalPeriod: String,
    amtodaysrevenue: Number,
    amtodaysunits: Number,
    pmtodaysrevenue: Number,
    pmtodaysunits: Number,
    todayUpdateDate: Date,
    todayPeriod: String
});
var TotalData = mongoose.model("TotalData", gbiDataSchema);


// DEFINE ROUTES
//Root route
app.get('/', function(req, res) {
    res.render("dashboard");

});

// APPLICATION API ROUTE
app.get('/rest/api/gbidata', function(req, res) {


    TotalData.find({ 'key': 'gbiBlackFridaydata' }, function(err, totalData) {
        if (err) {
            console.log("NodedJs App API ERROR: "+err);
        }
        else {
            res.send(totalData["0"]);
        }
    });


});


// FUNCTION TO GET NYC LOCAL TIME
function getNYCTime() {
    var d = new Date();
    // convert to msec     // add local time zone offset      // get UTC time in msec
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // create new Date object for different city  using supplied offset
    var offset = -5;
    var nd = new Date(utc + (3600000 * offset));
    return nd;
}

// FUNCTION TO RETURN THE QUERY PARAMETERS
function getRealtimeFormData(metricName, userToken, ampm) {
    if (ampm == "AM") {
        var formData = {
            "access_token": userToken,
            "reportDescription": {
                "source": "realtime",
                "reportSuiteID": "lenovoglobal",
                "dateFrom": "today 00:00:00",
                "dateTo": "now",
                "dateGranularity": "minute:60",
                "metrics": [{
                    "id": metricName
                }]

            }
        };
        return formData;
    }
    else {
        var formData = {
            "access_token": userToken,
            "reportDescription": {
                "source": "realtime",
                "reportSuiteID": "lenovoglobal",
                "dateFrom": "today 12:00:00",
                "dateTo": "now",
                "dateGranularity": "minute:60",
                "metrics": [{
                    "id": metricName
                }]

            }

        };
        return formData;
    }
}

//FUNCTION TO SEARCH AND UPDATE THE DATA
function updateRealtimeData(updateData) {
    TotalData.findOne({
            'key': 'gbiBlackFridaydata'
        },
        function(err, datafound) {
            if (err) {
                console.log("Something went wrong in new");
            }
            else {
                if (datafound == null) {
                    //console.log("New");
                    updateData.save(function(err, data) {
                        if (err) {
                            console.log("Something went wrong in new");
                        }
                        else {
                            console.log("New ");
                            console.log(data);
                            return data;
                        }
                    })
                }
                else {
                    console.log("Updated Data using function: " + updateData.key);
                    updateData._id = datafound._id;
                    TotalData.update(datafound, updateData, function(err) {
                        if (err) {
                            console.log("Something went wrong in update" + err);
                        }
                        else {
                            console.log(updateData);
                            return updateData;
                        }
                    });

                }
            }
        });
}

// APPLICATION REALTIME DATA UPDATE ROUTE
app.get('/gbi/update/realtime', function(req, res) {
    var bf = new Date(bfdate);
    var today = new Date();
    var nyTime = getNYCTime();
    console.log("Current Local Time in New York is: " + nyTime);
    if (nyTime.getTime() > bf.getTime()) {
        var timenow = dateFormat(today, "h:MM:ss TT");
        var ampm = dateFormat(getNYCTime(), "TT");
        adobeAuth.credentials.getToken()
            .then(function(user) {
                if (ampm == "AM") {

                    //console.log(getRealtimeFormData("revenue", user.accessToken, ampm));
                    request.post(
                        'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                            form: getRealtimeFormData("revenue", user.accessToken, ampm)

                        },
                        function(error, response, body) {

                            if (!error && response.statusCode == 200) {
                                var todaysRevenueData = JSON.parse(body);

                                request.post(
                                    'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                                        form: getRealtimeFormData("units", user.accessToken, ampm)
                                    },
                                    function(error, response, body) {

                                        if (!error && response.statusCode == 200) {
                                            var todaysUnitsData = JSON.parse(body);

                                            var updateData = new TotalData({
                                                key: "gbiBlackFridaydata",
                                                amtodaysrevenue: todaysRevenueData['report']['totals']["0"].replace(",", ""),
                                                amtodaysunits: todaysUnitsData['report']['totals']["0"],
                                                pmtodaysrevenue: 0,
                                                pmtodaysunits: 0,
                                                todayUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
                                                todayPeriod: todaysUnitsData['report']['period'].replace(/T0/g, " ")
                                            });

                                            //CALL UPDATE FUNCTION AND PASS THE DATA TO BE UPDATED 
                                            updateRealtimeData(updateData);

                                        }

                                    }
                                );

                            }

                        }
                    );

                }
                else {
                    request.post(
                        'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                            form: getRealtimeFormData("revenue", user.accessToken, ampm)
                        },
                        function(error, response, body) {
                            if (!error && response.statusCode == 200) {
                                var todaysRevenueData = JSON.parse(body);
                                request.post(
                                    'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                                        form: getRealtimeFormData("units", user.accessToken, ampm)
                                    },
                                    function(error, response, body) {
                                        if (!error && response.statusCode == 200) {
                                            var todaysUnitsData = JSON.parse(body);
                                            var updateData = new TotalData({
                                                key: "gbiBlackFridaydata",
                                                pmtodaysrevenue: todaysRevenueData['report']['totals']["0"].replace(",", ""),
                                                pmtodaysunits: todaysUnitsData['report']['totals']["0"],
                                                todayUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
                                                todayPeriod: todaysUnitsData['report']['period'].replace(/T0/g, " ")
                                            });

                                            //CALL UPDATE FUNCTION AND PASS THE DATA TO BE UPDATED 
                                            updateRealtimeData(updateData);
                                        }

                                    }
                                );

                            }

                        }
                    );

                }
            });
    }
    else {
        console.log("Today is smaller than Black Friday " + nyTime + " : " + bf);
        var updateData = new TotalData({
            key: "gbiBlackFridaydata",
            amtodaysrevenue: 0,
            amtodaysunits: 0,
            pmtodaysrevenue: 0,
            pmtodaysunits: 0,
            todayUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
            todayPeriod: 0
        });
        //CALL UPDATE FUNCTION AND PASS THE DATA TO BE UPDATED 
        updateRealtimeData(updateData);
    }


});


// APPLICATION TOTAL DATA UPDATE ROUTE
app.get('/gbi/update/report', function(req, res) {

    var bf = new Date(bfdate);
    var today = new Date();
    today.setHours(00);
    today.setMinutes(00);
    today.setSeconds(00);
    var formatToday = dateFormat(today, "mm/dd/yyyy");
    var todayDate = new Date(formatToday);
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    var fromDate = dateFormat(bf, "yyyy-mm-dd");
    var toDate = dateFormat(yesterday, "yyyy-mm-dd");
    //console.log(req.originalUrl);
    console.log(today + ":" + bf);

  
    var ampm = dateFormat(getNYCTime(), "yyyy-mm-dd");

    if (ampm == "2017-11-24") {
        var newData = new TotalData({
            key: "gbiBlackFridaydata",
            totalrevenue: 0,
            totalunits: 0,
            totalUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
            totalPeriod: 0
        });
        //CALL UPDATE FUNCTION AND PASS THE DATA TO BE UPDATED 
        updateRealtimeData(newData);

    }
    else {
        console.log(" Wait for 10 Seconds: Generating report from " + fromDate + " to " + toDate);
        console.log("Report Generating");
        adobeAuth.credentials.getToken()
            .then(function(user) {
                //console.log(user) //=> { accessToken: '...', tokenType: 'bearer', ... } 


                request.post(
                    'https://api.omniture.com/admin/1.4/rest/?method=Report.Queue', {
                        form: {
                            "access_token": user.accessToken,
                            "reportDescription": {
                                "reportSuiteID": "lenovoglobal",
                                "dateFrom": fromDate,
                                "dateTo": toDate,
                                "dateGranularity": "day",
                                "metrics": [{
                                    "id": "revenue"
                                }]

                            }
                        }
                    },
                    function(error, response, body) {
                        // console.log(response)
                        if (!error && response.statusCode == 200) {
                            var totalRevenueDataId = JSON.parse(body);
                            console.log(totalRevenueDataId);
                            //setTimeout('', 5000);
                            sleep.sleep(10);
                            request.post(
                                'https://api.omniture.com/admin/1.4/rest/?method=Report.Get', {
                                    form: {
                                        "access_token": user.accessToken,
                                        "reportID": totalRevenueDataId["reportID"] //1342758034
                                    }
                                },
                                function(error, response, body) {
                                    console.log(response)
                                    if (!error && response.statusCode == 200) {
                                        var totalRevenueData = JSON.parse(body);
                                        console.log(totalRevenueData);
                                        request.post(
                                            'https://api.omniture.com/admin/1.4/rest/?method=Report.Queue', {
                                                form: {
                                                    "access_token": user.accessToken,
                                                    "reportDescription": {
                                                        "reportSuiteID": "lenovoglobal",
                                                        "dateFrom": fromDate,
                                                        "dateTo": toDate,
                                                        "dateGranularity": "day",
                                                        "metrics": [{
                                                            "id": "units"
                                                        }]

                                                    }
                                                }
                                            },
                                            function(error, response, body) {
                                                //console.log(response)
                                                if (!error && response.statusCode == 200) {
                                                    var totalUnitsDataId = JSON.parse(body);
                                                    console.log(totalUnitsDataId + " Wait for 10 Seconds");

                                                    sleep.sleep(10);
                                                    request.post(
                                                        'https://api.omniture.com/admin/1.4/rest/?method=Report.Get', {
                                                            form: {
                                                                "access_token": user.accessToken,
                                                                "reportID": totalUnitsDataId["reportID"] //1074757567
                                                            }
                                                        },
                                                        function(error, response, body) {
                                                            console.log(response)
                                                            if (!error && response.statusCode == 200) {
                                                                var totalUnitsData = JSON.parse(body);
                                                                console.log(totalUnitsData);


                                                                //res.send(totalUnitsData);
                                                                var updateData = new TotalData({
                                                                    key: "gbiBlackFridaydata",
                                                                    totalrevenue: totalRevenueData['report']['totals']["0"].replace(",", ""),
                                                                    totalunits: totalUnitsData['report']['totals']["0"],
                                                                    totalUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
                                                                    totalPeriod: totalUnitsData['report']['period']
                                                                });
                                                                //CALL UPDATE FUNCTION AND PASS THE DATA TO BE UPDATED 
                                                                updateRealtimeData(updateData);
                                                            }

                                                        }
                                                    );

                                                }

                                            }
                                        );
                                    }
                                    //res.send(revenueData);
                                    //res.render("gbi", { rdata: revenueData, udata: unitsData, trdata: totalRevenueData });
                                }
                            );

                        }

                    }
                );
            });

    }


});



app.get('/bfdata', function(req, res) {

    //console.log(launchdate);
    TotalData.findOne({
            'key': 'gbiBlackFridaydata'
        },
        function(err, datafound) {
            if (err) {
                console.log(err);

            }
            else {
                res.render("gbi", {
                    data: datafound
                });

            }
        });
});

app.use(express.static('static'));

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Server Started: Dashboard started");

});
