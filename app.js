
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

var j = schedule.scheduleJob('*/20 * * * * *', function() {
    console.log('The answer to life, the universe, and everything!');
    request('http://104.236.96.56/gbi/update/realtime', function(error, response, body) {

    });
});

//Define the Start Date
var bfdate = "11/24/2017";

var adobeAuth = new ClientOAuth2({
    clientId: '56370d89a0-lc-gbi-integration',
    clientSecret: 'fd8378729093b9cfaf76',
    accessTokenUri: 'https://api.omniture.com/token',
    redirectUri: 'https://watsonnodejs-shivu7sm.c9users.io/authorise',
    grant_type: 'client_credentials'
})
//var require('handlebars');
mongoose.connect("mongodb://127.0.0.1:27017/jiradb");
var app = express();
app.set("view engine", "ejs");
app.use(function(req, res, next) {
  var allowedOrigins = ['http://127.0.0.1', 'http://localhost', 'http://insrv03.lenovo.com','http://lenovocentral.lenovo.com'];
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
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


//Root route
app.get('/', function(req, res) {
    res.render("dashboard");

});

app.get('/rest/api/gbidata', function(req, res) {
	
        
		    TotalData.find({ 'key': 'gbiBlackFridaydata' }, function(err, totalData) {
		        if (err) {
		            console.log(err);

		        }
		        else {
		            res.send(totalData["0"]);
		        }
		    });
    	

});


app.get('/gbi/update/realtime', function(req, res) {
    //console.log(req.originalUrl);


    var bf = new Date(bfdate);


    //console.log(req.originalUrl);
    
    var today = new Date();
	console.log(today + ":" + bf);
    if (today > bf) {
        console.log("Today is greater than Black friday " + today + " : " + bf);
        var timenow = dateFormat(today, "h:MM:ss TT");
        console.log(timenow);

        var d = new Date();

        // convert to msec
        // add local time zone offset 
        // get UTC time in msec
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

        // create new Date object for different city
        // using supplied offset
        var offset = -5;
        var nd = new Date(utc + (3600000 * offset));
        console.log(dateFormat(nd, "TT"));
        console.log(nd.toLocaleString());
        var ampm = dateFormat(nd, "TT");

        if (ampm == "AM") {
            adobeAuth.credentials.getToken()
                .then(function(user) {
                    //console.log(user) //=> { accessToken: '...', tokenType: 'bearer', ... } 


                    request.post(
                        'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                            form: {
                                "access_token": user.accessToken,
                                "reportDescription": {
                                    "source": "realtime",
                                    "reportSuiteID": "lenovoglobal",
                                    "dateFrom": "today 00:00:00",
                                    "dateTo": "now",
                                    "dateGranularity": "minute:60",
                                    "metrics": [{
                                        "id": "revenue"
                                    }]

                                }
                            }
                        },
                        function(error, response, body) {
                            //console.log(response)
                            if (!error && response.statusCode == 200) {
                                var todaysRevenueData = JSON.parse(body);
                                //console.log(todaysRevenueData);
                                request.post(
                                    'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                                        form: {
                                            "access_token": user.accessToken,
                                            "reportDescription": {
                                                "source": "realtime",
                                                "reportSuiteID": "lenovoglobal",
                                                "dateFrom": "today 00:00:00",
                                                "dateTo": "now",
                                                "dateGranularity": "minute:60",
                                                "metrics": [{
                                                    "id": "units"
                                                }]

                                            }
                                        }
                                    },
                                    function(error, response, body) {
                                        //console.log(response)
                                        if (!error && response.statusCode == 200) {
                                            var todaysUnitsData = JSON.parse(body);
                                            //console.log(todaysUnitsData);
                                            var updateData = new TotalData({
                                                key: "gbiBlackFridaydata",
                                                amtodaysrevenue: todaysRevenueData['report']['totals']["0"].replace(",", ""),
                                                amtodaysunits: todaysUnitsData['report']['totals']["0"],
                                                pmtodaysrevenue: 0,
                                                pmtodaysunits: 0,
                                                todayUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
                                                todayPeriod: todaysUnitsData['report']['period'].replace(/T0/g, " ")
                                            });
                                            console.log(updateData);
                                            TotalData.findOne({
                                                    'key': 'gbiBlackFridaydata'
                                                },
                                                function(err, datafound) {
                                                    if (err) {

                                                        //callback(err, null);

                                                    }
                                                    else {
                                                        if (datafound == null) {
                                                            console.log("New");
                                                            updateData.save(function(err, issue) {
                                                                if (err) {
                                                                    console.log("Something went wrong in new");

                                                                }
                                                            })
                                                        }
                                                        else {
                                                            console.log("Updated AM data " + updateData.key);
                                                            updateData._id = datafound._id;
                                                            TotalData.update(datafound, updateData, function(err) {
                                                                if (err) {
                                                                    console.log("Something went wrong in update" + err);

                                                                }
                                                                else {
                                                                    res.redirect('/bfdata');
                                                                }
                                                            });

                                                        }
                                                    }
                                                });



                                        }

                                    }
                                );

                            }

                        }
                    );
                });
        }
        else {
            adobeAuth.credentials.getToken()
                .then(function(user) {
                    //console.log(user) //=> { accessToken: '...', tokenType: 'bearer', ... } 


                    request.post(
                        'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                            form: {
                                "access_token": user.accessToken,
                                "reportDescription": {
                                    "source": "realtime",
                                    "reportSuiteID": "lenovoglobal",
                                    "dateFrom": "today 12:00:00",
                                    "dateTo": "now",
                                    "dateGranularity": "minute:60",
                                    "metrics": [{
                                        "id": "revenue"
                                    }]

                                }
                            }
                        },
                        function(error, response, body) {
                            //console.log(response)
                            if (!error && response.statusCode == 200) {
                                var todaysRevenueData = JSON.parse(body);
                                //console.log(todaysRevenueData);
                                request.post(
                                    'https://api.omniture.com/admin/1.4/rest/?method=Report.Run', {
                                        form: {
                                            "access_token": user.accessToken,
                                            "reportDescription": {
                                                "source": "realtime",
                                                "reportSuiteID": "lenovoglobal",
                                                "dateFrom": "today 12:00:00",
                                                "dateTo": "now",
                                                "dateGranularity": "minute:60",
                                                "metrics": [{
                                                    "id": "units"
                                                }]

                                            }
                                        }
                                    },
                                    function(error, response, body) {
                                        //console.log(response)
                                        if (!error && response.statusCode == 200) {
                                            var todaysUnitsData = JSON.parse(body);
                                            //console.log(todaysUnitsData);
                                            var updateData = new TotalData({
                                                key: "gbiBlackFridaydata",
                                                pmtodaysrevenue: todaysRevenueData['report']['totals']["0"].replace(",", ""),
                                                pmtodaysunits: todaysUnitsData['report']['totals']["0"],
                                                todayUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
                                                todayPeriod: todaysUnitsData['report']['period'].replace(/T0/g, " ")
                                            });
                                            TotalData.findOne({
                                                    'key': 'gbiBlackFridaydata'
                                                },
                                                function(err, datafound) {
                                                    if (err) {

                                                        //callback(err, null);

                                                    }
                                                    else {
                                                        if (datafound == null) {
                                                            console.log("New");
                                                            updateData.save(function(err, issue) {
                                                                if (err) {
                                                                    console.log("Something went wrong in new");

                                                                }
                                                            })
                                                        }
                                                        else {
                                                            console.log("Updated PM Data" + updateData.key);
                                                            updateData._id = datafound._id;
                                                            TotalData.update(datafound, updateData, function(err) {
                                                                if (err) {
                                                                    console.log("Something went wrong in update" + err);

                                                                }
                                                                else {
                                                                    res.redirect('/bfdata');
                                                                }
                                                            });

                                                        }
                                                    }
                                                });



                                        }

                                    }
                                );

                            }

                        }
                    );
                });
        }
    }
    else {
        console.log("Today is smaller than Black friday " + today + " : " + bf);
        var updateData = new TotalData({
            key: "gbiBlackFridaydata",
            amtodaysrevenue: 0,
            amtodaysunits: 0,
            pmtodaysrevenue: 0,
            pmtodaysunits: 0,
            todayUpdateDate: dateFormat(new Date(), "yyyy-mm-dd h:MM:ss TT"),
            todayPeriod: 0
        });
        console.log(updateData);
        TotalData.findOne({
                'key': 'gbiBlackFridaydata'
            },
            function(err, datafound) {
                if (err) {

                    //callback(err, null);

                }
                else {
                    if (datafound == null) {
                        console.log("New");
                        updateData.save(function(err, issue) {
                            if (err) {
                                console.log("Something went wrong in new");

                            }
                        })
                    }
                    else {
                        console.log("Black Friday not started Yet: " + updateData.key);
                        updateData._id = datafound._id;
                        TotalData.update(datafound, updateData, function(err) {
                            if (err) {
                                console.log("Something went wrong in update" + err);

                            }
                            else {
                                res.redirect('/bfdata');
                            }
                        });

                    }
                }
            });
    }


});


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
    var toDate = dateFormat(todayDate, "yyyy-mm-dd");
    //console.log(req.originalUrl);
    console.log(today + ":" + bf);

    //if ((todayDate > bf) && (todayDate != bf)) {
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
                                                                TotalData.findOne({
                                                                        'key': 'gbiBlackFridaydata'
                                                                    },
                                                                    function(err, datafound) {
                                                                        if (err) {

                                                                            //callback(err, null);

                                                                        }
                                                                        else {
                                                                            if (datafound == null) {
                                                                                console.log("New");
                                                                                updateData.save(function(err, issue) {
                                                                                    if (err) {
                                                                                        console.log("Something went wrong in new");

                                                                                    }
                                                                                })
                                                                            }
                                                                            else {
                                                                                console.log("Updated" + updateData.key);
                                                                                updateData._id = datafound._id;
                                                                                TotalData.update(datafound, updateData, function(err) {
                                                                                    if (err) {
                                                                                        console.log("Something went wrong in update" + err);

                                                                                    }
                                                                                    else {
                                                                                        res.redirect('/bfdata');
                                                                                    }
                                                                                });

                                                                            }
                                                                        }
                                                                    });
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

    //}
   



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

app.listen(80, function () {
    console.log("Server Started: Dashboard started");

});
