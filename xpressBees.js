/*
XPressbees
curl -v   -H 'Content-Type: application/json' -H "Content-type: application/json" -d '{ "username":"admin@snackcart.com","password":"Pass123!","secretkey":"Iqc7BDe1"}' 'http://stageusermanagementapi.xbees.in/api/auth/generateToken'
*/
var curl = require('curlrequest');
var async = require('async');

var relogin = function(callback) {
    var login_options = {
        url: 'http://stageusermanagementapi.xbees.in/api/auth/generateToken',
        method : 'POST',
        headers : {
          //'authority': 'api-ums.delhivery.com',
          //'sec-ch-ua': 'Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer xyz',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          //'origin: https':'//cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          //'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9',
          'XBKey' : 'Iqc7BDe1'
        },
        'limit-rate': '5000k',
         encoding: null,
         data : '{"username":"admin@snackcart.com","password":"Pass123!","secretkey":"Iqc7BDe1"}'
         //data : '{"username":"dummy","password":"Xpress@123","secretkey":"dummy"}'
    };

    curl.request(login_options, function (err, file) {
        if(!err) {
             var output = JSON.parse(file.toString());
             console.log(output);
        }
        callback(err);
    });
}


var awbstatus = function(callback) {
    var login_options = {
        //url: 'http://114.143.206.69:803/StandardForwardStagingService.svc/GetShipmentSummaryDetails',
        url: 'http://114.143.206.69:803/StandardForwardStagingService.svc/GetBulkShipmentStatus',
        method : 'POST',
        headers : {
          //'authority': 'api-ums.delhivery.com',
          //'sec-ch-ua': 'Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer xyz',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          //'origin: https':'//cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          //'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9',
          //'XBKey' : 'Iqc7BDe1'
        },
        'limit-rate': '5000k',
         encoding: null,
         data : '{ "XBkey":"Iqc7BDe1","AWBNo":"14348021108464"}'
         //data : '{"username":"dummy","password":"Xpress@123","secretkey":"dummy"}'
    };

    curl.request(login_options, function (err, file) {
        if(!err) {

        	 console.log(file);
             var output = JSON.parse(file.toString());
             console.log(output);
        }
        callback(err);
    });
}


awbstatus(function(err){
	console.log(err);
});