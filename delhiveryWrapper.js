/*
 * Delhivery wrapper.
 */
 //Dont init all the time. We dont know how long the session will last. So first try a query, if not then relogin and get a new jwt.

var curl = require('curlrequest');
var async = require('async');
var fs = require('fs');
var jwt = "";
var loginTime = 0;

var config = {};

//2021-06-21T00:00%20-%202021-07-01T23:59
var convertDateStr = function(dstart) {
    var day = (dstart.getDate() <=9)? "0" + dstart.getDate() : dstart.getDate();
    var month = ((dstart.getMonth()+ 1) <= 9)? ("0" + (dstart.getMonth() + 1)) : (dstart.getMonth() + 1);
    var str = dstart.getFullYear() + "-" + month + "-" + day;
    return str;
}

var convertURL = function(url, dstart, dend) {
    //console.log("Original : " + url);
    url = url.replace("{STARTDATE}", convertDateStr(dstart));
    url = url.replace("{ENDDATE}", convertDateStr(dend));
    //console.log("Modified : " + url);
    return url;
}

var relogin = function(callback) {

    var login_options = {
        url: 'https://api-ums.delhivery.com//v2/login/',
        method : 'POST',
        headers : {
          'authority': 'api-ums.delhivery.com',
          'sec-ch-ua': 'Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin: https':'//cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        'limit-rate': '5000k',
         encoding: null,
         data : JSON.stringify(config.delhiveryAuth)
    };

    curl.request(login_options, function (err, file) {
        if(!err) {
             var output = JSON.parse(file.toString());
             jwt = output.jwt;
             console.log(jwt);
        }
        callback(err);
    });


}

var init = function() {
    var cfg2 = fs.readFileSync('config.json').toString();
    config = JSON.parse(cfg2);

    relogin(function(err) {
        console.log(err);
    });
}

//
var getReturnedOrders = function(callback) {
    var status_options = {
        url : 'https://cl-api.delhivery.com/packages/filter?from=0&to=25&size=25&cl=CUCULU%20EXPRESS&sort_by=cs.sd&date_range={STARTDATE}T00:00%20-%20{ENDDATE}T23:59&date_by=cs.sd&cs_ss=RTO&cs_st=DL&fields=wbn,cl,oid,nm,pd,ed,cty,pin,pt,rs,cod,cs,dd,occ,fbd,sht,mwn,mps_amt,adt,date,pdd,date.red,date.rpdd,rt_p,mot,flags',
        method : 'GET',
        headers : {
          'authority': 'cl-api.delhivery.com',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer <space> jwt',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin': 'https://cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        encoding: null
    }

    const d = new Date();
    const dstart = new Date();
    dstart.setDate( d.getDate() - 10);
    status_options.url = convertURL(status_options.url, dstart,d );

    status_options.headers.authorization = 'Bearer ' + jwt;

    curl.request(status_options, function (err, file) {
         //console.log(err);
         var output = JSON.parse(file.toString());
         //console.log(output);
         callback(output);
    });
}

var getInTransitOrders = function(callback) {
    console.log("in getInTransitOrders jwt= " + jwt);
    var status_options = {
        url : 'https://cl-api.delhivery.com/packages/filter?from=0&to=100&size=100&cl=CUCULU%20EXPRESS&sort_by=cs.sd&date_range={STARTDATE}T00:00%20-%20{ENDDATE}T23:59&date_by=cs.sd&cs_ss=In%20Transit,Pending&cs_st=RT,UD&fields=wbn,cl,oid,nm,pd,ed,cty,pin,pt,rs,cod,cs,dd,occ,fbd,sht,mwn,mps_amt,adt,date,pdd,date.red,date.rpdd,rt_p,mot,flags',
        method : 'GET',
        headers : {
          'authority': 'cl-api.delhivery.com',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer <space> jwt',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin': 'https://cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        encoding: null
    }

    const d = new Date();
    const dstart = new Date();
    dstart.setDate( d.getDate() - 10);
    status_options.url = convertURL(status_options.url, dstart,d );

    status_options.headers.authorization = 'Bearer ' + jwt;

    curl.request(status_options, function (err, file) {
         //console.log(err);
         var output = JSON.parse(file.toString());
         //console.log(output);
         callback(output);
    });
}

var getOutForDeliveryOrders = function(callback) {
    var status_options = {
        url : 'https://cl-api.delhivery.com/packages/filter?from=0&to=100&size=100&cl=CUCULU%20EXPRESS&sort_by=cs.sd&date_range={STARTDATE}T00:00%20-%20{ENDDATE}T23:59&date_by=cs.sd&cs_ss=Dispatched&cs_st=RT,UD&fields=wbn,cl,oid,nm,pd,ed,cty,pin,pt,rs,cod,cs,dd,occ,fbd,sht,mwn,mps_amt,adt,date,pdd,date.red,date.rpdd,rt_p,mot,flags',
        method : 'GET',
        headers : {
          'authority': 'cl-api.delhivery.com',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer <space> jwt',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin': 'https://cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        encoding: null
    }

    const d = new Date();
    const dstart = new Date();
    dstart.setDate( d.getDate() - 2);
    status_options.url = convertURL(status_options.url, dstart,d );

    status_options.headers.authorization = 'Bearer ' + jwt;

    curl.request(status_options, function (err, file) {
         //console.log(err);
         var output = JSON.parse(file.toString());
         //console.log(output);
         callback(output);
    });
}

var getDeliveredOrders = function(callback) {
    var status_options = {
        url : 'https://cl-api.delhivery.com/packages/filter?from=0&to=100&size=100&cl=CUCULU%20EXPRESS&sort_by=cs.sd&date_range={STARTDATE}T00:00%20-%20{ENDDATE}T23:59&date_by=cs.sd&cs_ss=Delivered&cs_st=DL&fields=wbn,cl,oid,nm,pd,ed,cty,pin,pt,rs,cod,cs,dd,occ,fbd,sht,mwn,mps_amt,adt,date,pdd,date.red,date.rpdd,rt_p,mot,flags',
        method : 'GET',
        headers : {
          'authority': 'cl-api.delhivery.com',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer <space> jwt',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin': 'https://cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        encoding: null
    }

    const d = new Date();
    const dstart = new Date();
    dstart.setDate( d.getDate() - 10);
    status_options.url = convertURL(status_options.url, dstart,d );

    status_options.headers.authorization = 'Bearer ' + jwt;

    curl.request(status_options, function (err, file) {
         //console.log(err);
         var output = JSON.parse(file.toString());
         //console.log(output);
         callback(output);
    });
}

var getManifestedOrders = function(callback) {
    var status_options = {
        url : 'https://cl-api.delhivery.com/packages/filter?from=0&to=50&size=50&cl=CUCULU%20EXPRESS&sort_by=date.cd&date_range={STARTDATE}T00:00%20-%20{ENDDATE}T23:59&date_by=cs.sd&cs_ss=Manifested&cs_st=UD&fields=wbn,cl,oid,nm,pd,ed,cty,pin,pt,rs,cod,cs,dd,occ,fbd,sht,mwn,mps_amt,adt,date,pdd,date.red,date.rpdd,rt_p,mot,flags',
        method : 'GET',
        headers : {
          'authority': 'cl-api.delhivery.com',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer <space> jwt',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin': 'https://cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        encoding: null
    }

    const d = new Date();
    const dstart = new Date();
    dstart.setDate( d.getDate() - 6);
    status_options.url = convertURL(status_options.url, dstart,d );

    status_options.headers.authorization = 'Bearer ' + jwt;

    curl.request(status_options, function (err, file) {
         //console.log(err);
         var output = JSON.parse(file.toString());
         //console.log(output);
         callback(output);
    });
}

var getDeliveryCharges = function(callback) {
    var status_options = {
        url : 'https://u8rmsd966f.execute-api.ap-southeast-1.amazonaws.com/prod/psapp/getawb/?end={ENDDATE}%2018:29:59.9&start={STARTDATE}%2018:30:00.0&client_name=CUCULU%20EXPRESS&filter=deductions&page=1',
        method : 'GET',
        headers : {
          'authority': 'cl-api.delhivery.com',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer <space> jwt',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin': 'https://cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        encoding: null
    }

    const d = new Date();
    const dstart = new Date();
    dstart.setDate( d.getDate() - 6);
    status_options.url = convertURL(status_options.url, dstart,d );

    status_options.headers.authorization = 'Bearer ' + jwt;

    curl.request(status_options, function (err, file) {
         //console.log(err);
         var output = JSON.parse(file.toString());
         //console.log(">>> " + file.toString());
         callback(output);
    });
}

var getRefundInformation = function(callback) {
    var status_options = {
        url : 'https://u8rmsd966f.execute-api.ap-southeast-1.amazonaws.com/prod/psapp/getawb/?end={ENDDATE}%2018:29:59.9&start={STARTDATE}%2018:30:00.0&client_name=CUCULU%20EXPRESS&filter=refunds&page=1',
        method : 'GET',
        headers : {
          'authority': 'cl-api.delhivery.com',
          'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
          'accept': 'application/json, text/plain, */*',
          'authorization': 'Bearer <space> jwt',
          'sec-ch-ua-mobile': '?0',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'content-type': 'application/json',
          'origin': 'https://cl.delhivery.com',
          'sec-fetch-site': 'same-site',
          'sec-fetch-mode': 'cors',
          'sec-fetch-dest': 'empty',
          'referer': 'https://cl.delhivery.com/',
          'accept-language': 'en-US,en;q=0.9'
        },
        encoding: null
    }

    const d = new Date();
    const dstart = new Date();
    dstart.setDate( d.getDate() - 30);
    status_options.url = convertURL(status_options.url, dstart,d );

    status_options.headers.authorization = 'Bearer ' + jwt;

    curl.request(status_options, function (err, file) {
         //console.log(err);
         var output = JSON.parse(file.toString());
         //console.log(output);
         callback(output);
    });
}

var getSlipData = function(wbns, callback) {
    relogin(function(err) {
        var status_options = {
            url : 'https://cl-api.delhivery.com/packages/packingslip?wbns=' + wbns + '&src=clpanel',
            method : 'GET',
            headers : {
              'authority': 'cl-api.delhivery.com',
              'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
              'accept': 'application/json, text/plain, */*',
              'authorization': 'Bearer <space> jwt',
              'sec-ch-ua-mobile': '?0',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'content-type': 'application/json',
              'origin': 'https://cl.delhivery.com',
              'sec-fetch-site': 'same-site',
              'sec-fetch-mode': 'cors',
              'sec-fetch-dest': 'empty',
              'referer': 'https://cl.delhivery.com/',
              'accept-language': 'en-US,en;q=0.9'
            },
            encoding: null
        }

        status_options.headers.authorization = 'Bearer ' + jwt;

        curl.request(status_options, function (err, file) {
             //console.log(err);
             var output = JSON.parse(file.toString());
             console.log(output);
             callback(output);
        }); 
    }); 
}

var types = ["login", "manifested", "intransit", "outfordelivery", "delivered","returned","charges","refunds"];

var getOverallStatsForOrders = function(callback) {
    var finalResult = {};
    async.eachSeries(types, function(whattodo, callbackinternal2) {
            console.log("Fetchind page  " + whattodo);
            if (whattodo == "login") {
                relogin(function(err) {
                    callbackinternal2(null);
                });
            } else if (whattodo == "manifested") {
                getManifestedOrders(function(output) {
                    var m = [];
                    console.log(output);
                    for (var i=0;i<output.hits.length;i++) {
                        console.log(output.hits[i]._source.oid + ":" + output.hits[i]._id);
                        m.push({oid: output.hits[i]._source.oid, tid: output.hits[i]._id});
                    }
                    finalResult.manifested = m;
                    callbackinternal2(null);
                });
            } else if (whattodo == "intransit") {
                getInTransitOrders(function(output) {
                    var it = [];
                    for (var i=0;i<output.hits.length;i++) {
                        console.log(output.hits[i]._source.oid + ":" + output.hits[i]._id);
                        it.push({oid: output.hits[i]._source.oid, tid: output.hits[i]._id});
                    }
                    finalResult.intransit = it;
                    callbackinternal2(null);
                });
            } else if (whattodo == "outfordelivery") {
                getOutForDeliveryOrders(function(output) {
                    var ofd = [];
                    for (var i=0;i<output.hits.length;i++) {
                        console.log(output.hits[i]._source.oid + ":" + output.hits[i]._id);
                        ofd.push({oid: output.hits[i]._source.oid, tid: output.hits[i]._id});
                    }
                    finalResult.outfordelivery = ofd;
                    callbackinternal2(null);
                });
            } else if (whattodo == "delivered") {
                getDeliveredOrders(function(output) {
                    var d = [];
                    for (var i=0;i<output.hits.length;i++) {
                        console.log(output.hits[i]._source.oid + ":" + output.hits[i]._id);
                        d.push({oid: output.hits[i]._source.oid, tid: output.hits[i]._id});
                    }
                    finalResult.delivered = d;
                    callbackinternal2(null);
                });
            } else if (whattodo == "returned") {
                getReturnedOrders(function(output) {
                    var r = [];
                    for (var i=0;i<output.hits.length;i++) {
                        console.log(output.hits[i]._source.oid + ":" + output.hits[i]._id);
                        r.push({oid: output.hits[i]._source.oid, tid: output.hits[i]._id});
                    }
                    finalResult.returned = r;
                    callbackinternal2(null);
                });
                
            } else if (whattodo == "charges") {
                //order id is not present, we must find it
                getDeliveryCharges(function(output) {
                    var ch = [];
                    for (var i=0;i<output.results.length;i++) {
                        console.log(output.results[i].waybill + ":" + output.results[i].amount);
                        ch.push({tid: output.results[i].waybill, amount: output.results[i].amount});
                    }
                    finalResult.charges = ch;
                    callbackinternal2(null);
                });
                
            } else if (whattodo == "refunds") {
                getRefundInformation(function(output) {
                    var rfd = [];
                    for (var i=0;i<output.results.length;i++) {
                        console.log(output.results[i].waybill + ":" + output.results[i].amount);
                        rfd.push({tid: output.results[i].waybill, amount: output.results[i].amount});
                    }
                    finalResult.refunds = rfd;
                    callbackinternal2(null);
                });
            }
    }, function(err, results) {
        //console.log(err);
        console.log("forEachSeries results : " + results);
        callback(finalResult);
    });

}
module.exports.init = init;
module.exports.getOverallStatsForOrders = getOverallStatsForOrders;
module.exports.getSlipData = getSlipData;
module.exports.getDeliveryCharges = getDeliveryCharges;