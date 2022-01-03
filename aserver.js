var http = require('http'); 
const https = require('https');
var fs = require('fs');
var parser = require('fast-xml-parser');
var htmlentities = require('html-entities');
const url = require('url');

const multer = require('multer');
const path = require('path');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

//if folder does not exist, then create it.
if (!fs.existsSync('database')) {
	fs.mkdirSync('database', {});
	fs.writeFileSync("database/orders.json", "[]");
	fs.writeFileSync("database/inProcessOrders.json", "[]");
	fs.writeFileSync("database/products.json", "[]");
	fs.writeFileSync("database/logs.json", "[]");
} else {
	if (!fs.existsSync('database/orders.json')) fs.writeFileSync("database/orders.json", "[]");
	if (!fs.existsSync('database/inProcessOrders.json')) fs.writeFileSync("database/inProcessOrders.json", "[]");
	if (!fs.existsSync('database/products.json')) fs.writeFileSync("database/products.json", "[]");
	if (!fs.existsSync('database/logs.json')) fs.writeFileSync("database/logs.json", "[]");
}

if (!fs.existsSync('productImagesPreview')) fs.mkdirSync('productImagesPreview', {});
if (!fs.existsSync('productImages')) fs.mkdirSync('productImages', {});

if (!fs.existsSync('invoices')) fs.mkdirSync('invoices', {});
if (!fs.existsSync('invoicesPreview')) fs.mkdirSync('invoicesPreview', {});

var wooCommWrapper = require("./wooCommWrapper.js");
var localDBWrapper = require("./localDBWrapper.js");
var delhiveryWrapper = require("./delhiveryWrapper.js");

localDBWrapper.init(true);
wooCommWrapper.init();
delhiveryWrapper.init();

var isWin = process.platform === "win32";
var enableOFWindow = false;

var productsXML = [];

var inProgressTasks= {};
inProgressTasks.syncProducts = {running: false, percent: 0, lastupdatetime: 0};
inProgressTasks.syncOrders = false;
inProgressTasks.syncInProcessingOrders = false;
inProgressTasks.convertImages = false;
inProgressTasks.syncQuantityInfo = {running: false, percent: 0, lastupdatetime: 0};

const storage1 = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'invoices/');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const storage2 = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'labels/');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

const imageFilter = function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

function isNumeric(value) {
        return /^-?\d+$/.test(value);
}

const getRanHex = size => {
  let result = [];
  let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

  for (let n = 0; n < size; n++) {
    result.push(hexRef[Math.floor(Math.random() * 16)]);
  }
  return result.join('');
}

function loadConfig() {
	var cfg2 = fs.readFileSync('config.json').toString();
	config = JSON.parse(cfg2);
	console.log("Loaded config: " + cfg2);
}

function saveConfig(time) {
	
	//Lets see if new XML file is present?
    console.log(JSON.stringify(curr_files));

    config.productsXML =  curr_files[0];
    config.time = time;
    config.updateTime = Math.floor((new Date()).getTime() / 1000);
    console.log(JSON.stringify(config));
	fs.writeFile('config.json', JSON.stringify(config, null, 4), function (err) {
				//if (err) throw err
				//else {
					console.log("... wrote config.json");
					//callback(whattodo);
				//}
	});
}

var server = https.createServer(options, function (req, res) {
	//var server = http.createServer(function (req, res) {   //create web server
  	console.log(req.method + " by " + req.headers.referer);
  	console.log(req.connection.remoteAddress);

  	//var cookies = cookie.parse(req.headers.cookie || '');
  	var requestHasCookie = false;

  	for (var i =0;i < config.auth.length;i++) {
  		var thiscookie = "scart=" + config.auth[i].cookie;
  		if (thiscookie == req.headers.cookie) {
  			requestHasCookie = true;
  			break;
  		}
  	}

  	if (false == requestHasCookie && req.url != '/login' && req.url.indexOf('/validate') != 0 && req.url.indexOf('/assets/') != 0) {
	    res.writeHead(302, {
	      location: "/login",
	    });
  		res.end("Please login");
  		return;
  	}

 if (req.method == 'POST') {
	 if (req.url == '/upload-delhivery') {

		    let upload = multer({ storage: storage2, fileFilter: imageFilter }).single('shipping_label_pdf');

		    upload(req, res, function(err) {
		        // req.file contains information of uploaded file
		        // req.body contains information of text fields, if there were any

		        if (typeof req.file === 'undefined') {
		        	res.end('Server error!');
		        	return;
		        }
				var id = req.file.originalname.substr(0,5);
				console.log("id = " + JSON.stringify(req.file));
				if (!fs.existsSync("invoices/" + id + ".pdf")) {
			       	res.writeHead(200, { 'Content-Type': 'text/html' }); 
			        res.write("Failed upload as invoice " + id + " is not present! " + req.file.path + " <br><br><br>");
			        res.end("<a href='uploadPdf'> Click to re-try another file</a>");
			        return;
				}

		        if (req.fileValidationError) {
		            return res.end(req.fileValidationError);
		        }
		        else if (!req.file) {
		            return res.end('Please select an image to upload ' + req.file);
		        }
		        else if (err instanceof multer.MulterError) {
		            return res.end(err);
		        }
		        else if (err) {
		            return res.end(err);
		        }

		       	res.writeHead(200, { 'Content-Type': 'text/html' }); 
		        res.write("Sucessfully uploaded! " + req.file.path + " <br><br><br>");
		        res.end("<a href='uploadPdf'> Click to upload another file</a>");

		        if (!isWin) {
			        var labels = require('./Scripts/LabelMakerLin.js');
					labels.generateLabel(id);
				} else {
			        var labels = require('./Scripts/LabelMakerWindows.js');
					labels.generateLabel(id);					
				}

		    });
	} else if (req.url == '/upload-multiple-invoices') {
		    let upload = multer({ storage: storage, fileFilter: imageFilter }).array('i', 100);

		    upload(req, res, function(err) {
		        if (req.fileValidationError) {
		            return res.end(req.fileValidationError);
		        }

		        let result = "You have uploaded these images: <hr />";
		        const files = req.files;
		        let index, len;

		        // Loop through all the uploaded images and display them on frontend
		        for (index = 0, len = files.length; index < len; ++index) {
		            result += `<img src="${files[index].path}" width="300" style="margin-right: 20px;">`;
		        }
		        result += '<hr/><a href="./">Upload more images</a>';
		        res.end(result);
		    });

	} else if (req.url == '/updateInventoryCounts') { //This is login attempt, verify credentials
			let buff = '' //buffer variable to save response
			req.on('data', function (chunk) {
			   		buff += chunk; //concat each newline to the buff variable
			});

			req.on('end', function () {
				var postdata = JSON.parse(buff);
				console.log(">>> updateInventoryCounts >>> " + JSON.stringify(postdata));	
				wooCommWrapper.updateRawQuantityInfo(postdata.productid, postdata.WebsiteNewCount);
				localDBWrapper.updateRawQuantityInfo(postdata.productid, postdata.RoomNewCount, postdata.WebsiteNewCount,
						postdata.product_comment, postdata.expiry, postdata.product_buy_price);
				res.end(buff);
		 	});
	} else if (req.url == '/confirmOrderToDB') { //check the URL of the current request
		let buff = '' //buffer variable to save response
		req.on('data', function (chunk) {
		   		buff += chunk; //concat each newline to the buff variable
		});

		req.on('end', function () {
			console.log(postdata);
			var postdata = JSON.parse(buff);
			
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 
	        localDBWrapper.acceptOrderAndDecrementInventory(postdata, function(result) {
	        	wooCommWrapper.acceptOrderAndDecrementInventory(postdata, function(res2) {
	        		//XXX we have to move the order to completedOrders.json
			        res.write(result + "," + res2);
			        res.end();	        		
	        	})

	        });
	 	});
	} else if (req.url == '/saveOrder') { //check the URL of the current request
		let buff = '' //buffer variable to save response
		req.on('data', function (chunk) {
		   		buff += chunk; //concat each newline to the buff variable
		});

		req.on('end', function () {
			var postdata = JSON.parse(buff);
			console.log(postdata);
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 
	        localDBWrapper.updateInProcessingOrder(postdata, function(result) {
		        res.write(JSON.stringify(result));
		        res.end();
	        });
	 	});
	} else if (req.url == '/getSingleProductInfo') { //check the URL of the current request
		let buff = '' //buffer variable to save response
		req.on('data', function (chunk) {
		   		buff += chunk; //concat each newline to the buff variable
		});

		req.on('end', function () {
			var postdata = JSON.parse(buff);
			console.log(postdata);
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 
	        wooCommWrapper.getPriceAndQuantityInfo(postdata.productid, function(name, quantity, regularPrice, salePrice) {
	        	var resdata = {};
	        	resdata.productid = postdata.productid;
	        	resdata.quantity = (quantity == null || typeof quantity == 'undefined')? 0 : quantity;
	        	resdata.regularPrice = regularPrice;
	        	resdata.salePrice = salePrice;

	        	localDBWrapper.findProductData(postdata.productid, function(cdata) {
	        		resdata.expiry = cdata.expiry;
	        		resdata.buyPrice = cdata.buy;
	        		res.end(JSON.stringify(resdata));
	        	});
	        	
	        });
	 	});
	} else if (req.url == '/removeOrder') { //check the URL of the current request
		let buff = '' //buffer variable to save response
		req.on('data', function (chunk) {
		   		buff += chunk; //concat each newline to the buff variable
		});

		req.on('end', function () {
			var postdata = JSON.parse(buff);
			console.log(postdata);
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 
	        localDBWrapper.removeOrderNotInWPProcessing(postdata, function(result) {
		        res.write(JSON.stringify(result));
		        res.end();
	        });
	 	});
	} else {
		res.end("Wrong url: Failed! post");
	}
 } else { 
 		var queryParams = url.parse(req.url,true).query;

 		var isJSFile = (req.url.indexOf('.js') == (req.url.length - 3))? true : false;
 		var isCSSFile = (req.url.indexOf('.css') == (req.url.length - 4))? true : false;
 		var isPNGFile = (req.url.indexOf('.png') == (req.url.length - 4))? true : false;
 		var isJPGFile = (req.url.indexOf('.jpg') == (req.url.length - 4) || req.url.indexOf('.jpeg') == (req.url.length - 5))? true : false;
 		var isGIFFile = (req.url.indexOf('.gif') == (req.url.length - 4))? true : false;
 		var isPDFFile = (req.url.indexOf('.pdf') == (req.url.length - 4))? true : false;

 		console.log("Get request " + req.url);
	    if (req.url == '/' || req.url.indexOf('..') >= 0) { //check the URL of the current request
	        res.end("OKAY");
	    
	    } else if (typeof (req.headers.referer) != 'undefined' && req.headers.referer.indexOf("/ofwindow") > 0 && enableOFWindow == false) {
	    		res.end("");
	    } else if(typeof (req.headers.referer) != 'undefined' && req.url == '/enableOFWindow' && req.headers.referer.indexOf("/orderflowadmin") > 0) {
	    	enableOFWindow = true;
	    	res.end("Done, enabled");
	    } else if (typeof (req.headers.referer) != 'undefined' && req.url == '/disableOFWindow' && req.headers.referer.indexOf("/orderflowadmin") > 0) {
	    	enableOFWindow = false;
	    	res.end("Done, disabled");
		} else if (req.url == '/allinventory') {
    		res.writeHead(200, { 'Content-Type': 'application/json' }); 
    		var array1 = fs.readFileSync('database/products.json').toString();
    		res.write(JSON.stringify(JSON.parse(array1)));
    		res.end();
	    } else if (req.url == '/updateProductQuantityData') {
	    	var currentTime = Math.floor((new Date()).getTime() / 1000);
	    	var timeAgo = currentTime - inProgressTasks.syncQuantityInfo.lastupdatetime;

	    	res.writeHead(200, { 'Content-Type': 'application/json' });
	        if (inProgressTasks.syncQuantityInfo.running || timeAgo < 3600*4) {
	        	res.end(JSON.stringify(inProgressTasks));
	        } else {
	        	inProgressTasks.syncQuantityInfo.running = true;
	        	inProgressTasks.syncQuantityInfo.percent = 0;    
	        	inProgressTasks.syncQuantityInfo.lastupdatetime = Math.floor((new Date()).getTime() / 1000);
	        	localDBWrapper.getAllKnownProductIds(function(result) { 
	        		//XXX dod work here
	        		wooCommWrapper.updateStockQuantityAsSeenInWebsite(inProgressTasks, result);

	        		res.write(JSON.stringify(inProgressTasks));
	        		res.end();
	        	}); 	
	        }	    	
	    } else if (req.url == '/deleteTempFolders') {
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 
	        	var ret = {};
	        	ret.result = "SUCCESS";
	        	res.end(JSON.stringify(ret));

	        	//delete invoices/ folder contents
	        	//delete invoicesPreview/ folder contents
	        	//delete Backups/ folder contents
	        	//delete labels/ folder contents
	        	//delete TEMP/ folder contents

	        	fs.rmdirSync('invoices',{ recursive: true, force: true });
	        	fs.rmdirSync('invoicesPreview',{ recursive: true, force: true });
	        	fs.rmdirSync('Backups',{ recursive: true, force: true });
	        	fs.rmdirSync('labels',{ recursive: true, force: true });
	        	fs.rmdirSync('TEMP',{ recursive: true, force: true });

	        	fs.mkdirSync('invoices', {});
	        	fs.mkdirSync('invoicesPreview', {});
	        	fs.mkdirSync('Backups', {});
	        	fs.mkdirSync('labels', {});
	        	fs.mkdirSync('TEMP', {});


	    } else if (req.url == '/updateProductData') {
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 

	        if (inProgressTasks.syncProducts.running) {
	        	res.end(JSON.stringify(inProgressTasks));
	        } else {
	        	inProgressTasks.syncProducts.running = true;
	        	inProgressTasks.syncProducts.percent = 0;
		        localDBWrapper.getAllKnownProductIds(function(result) {
		        	wooCommWrapper.get_all_new_products(inProgressTasks, result, true, function(full_products) {
		        		inProgressTasks.syncProducts.running = false;
		        		inProgressTasks.syncProducts.percent = 0;
		        		//console.log(full_products);
		        		localDBWrapper.updateAllProductData(full_products);
		        	});
			        res.write(JSON.stringify(inProgressTasks));
			        res.end();
		        });
	    	}
	    }
	    else if (req.url == '/ping') {
	    	res.writeHead(200, { 'Content-Type': 'application/json' });
	    	/*
	    	localDBWrapper.getCachedOrderList(function(cached_order_list) {
	    		for (var i=0;i<cached_order_list.length;i++) {
	    			if (cached_order_list[i].OrderId == 99999) {
	    				wooCommWrapper.acceptOrderAndDecrementInventory(cached_order_list[i], function(result) {
	    					console.log("-----> " + result);
	    				})
	    			}
	    		}
	    	});
			*/
	    	res.end("{error: 'SUCCESS'}");
	    } else if (req.url == '/uploadPdf') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'text/html' }); 
	        var htmlpage = fs.readFileSync("orderflowadmin.htm").toString();
	        res.write(htmlpage);
	        res.end();
	    } else if (req.url == '/login') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'text/html' }); 
	        var htmlpage = fs.readFileSync("login.htm").toString();
	        res.write(htmlpage);
	        res.end();
	    }  else if (req.url == '/manage') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'text/html' }); 
	        var htmlpage = fs.readFileSync("manage.htm").toString();
	        res.write(htmlpage);
	        res.end();
	    } else if (req.url.indexOf('/validate') == 0) { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 
	        var authStatus = false;
	        var cookie_t = "";
	        for (var i=0;i<config.auth.length;i++) {
	        	if (config.auth[i].username == queryParams.uname && config.auth[i].password == queryParams.upassword) {
	        		authStatus = true;
	        		cookie_t = getRanHex(16);
	        		config.auth[i].cookie = cookie_t;
	        		break;
	        	}
	        }
	        var ret = {};
	        if (authStatus == true) {
	        	ret.result = "SUCCESS";
	        	ret.cookie = cookie_t;
	        	res.write(JSON.stringify(ret));
	    	} else {
	        	ret.result = "FAILED";
	        	res.write(JSON.stringify(ret));	    		
	    	}
	        res.end();
	    } else if (req.url == '/inventoryadmin') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'text/html' }); 
	        var htmlpage = fs.readFileSync("inventory2.htm").toString();
	        res.write(htmlpage);
	        res.end();
	    }  else if (req.url == '/shipping') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'text/html' }); 
	        var htmlpage = fs.readFileSync("shipping.htm").toString();
	        res.write(htmlpage);
	        res.end();
	    } else if (req.url == '/ofwindow') { //check the URL of the current request
	    	if (enableOFWindow == false) {
	    		res.writeHead(200, { 'Content-Type': 'text/html' }); 
	    		res.end("Order data is not ready to be processed");
	    	} else {
	        	res.writeHead(200, { 'Content-Type': 'text/html' }); 
	        	var htmlpage = fs.readFileSync("orderflow.htm").toString();
	        	res.write(htmlpage);
	        	res.end();
	        }
	    } else if (req.url == '/orderflowadmin') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'text/html' }); 
	        var htmlpage = fs.readFileSync("orderflow.htm").toString();
	        res.write(htmlpage);
	        res.end();
	    } else if (req.url == '/getProcessingOrders') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'application/json' });
	        wooCommWrapper.get_all_orders('processing', 100, function(data) {
	        	console.log("In wooCommWrapper.get_all_orders callback: " + data + " utc time == " + Math.floor((new Date()).getTime() / 1000));
	        	delhiveryWrapper.getOverallStatsForOrders(function(deliveryStatus) {
		        	localDBWrapper.updateBulkInProcessingOrdersFetchedFromWooCommerce(data, deliveryStatus, function(data){
		        		console.log("... in callback 2..");
			        	var result = {};
			        	result.orders = data;
			        	result.meta = {};
			        	result.meta.updateTime = Math.floor((new Date()).getTime() / 1000);
			        	//console.log(JSON.stringify(result));
			        	res.write(JSON.stringify(result));
			        	res.end();
		        	});
	        	});
	        });
	    } else if (req.url == '/getProcessingOrdersLite') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 

	        	localDBWrapper.getCachedOrderList(function(data){
	        		console.log("... in callback 2 LITE..");
		        	var result = {};
		        	result.orders = data;
		        	result.meta = {};
		        	result.meta.updateTime = Math.floor((new Date()).getTime() / 1000);
		        	res.write(JSON.stringify(result));
		        	res.end();
	        	});

	    } else if (req.url.indexOf('getLabelJson') > 0) {
	    		res.writeHead(200, { 'Content-Type': 'application/json' }); 
	    		delhiveryWrapper.getSlipData( queryParams.trackingId, function(data) {
		    		res.write(JSON.stringify(data));
		    		res.end();
	    		});
	  	} else if (req.url.indexOf('topbar.png') > 0) {
	    		res.writeHead(200, { 'Content-Type': 'image/png' }); 
	    		var array1 = fs.readFileSync('docs/topbar.png');
	    		res.write(array1);
	    		res.end();
	  	} else if (req.url.indexOf('productPageOnSite') > 0) {
	    		localDBWrapper.findProductData(queryParams.product, function(productdata) {
	    			res.writeHead(302, { "Location": productdata.permalink });
		    		res.end();
	    		});
	  	}	  	
	  	else if (req.url == '/getAllProductList') { //check the URL of the current request
	        res.writeHead(200, { 'Content-Type': 'application/json' }); 
	        localDBWrapper.getCompleteProductList(function(result) {
	        	var resultData = {};
	        	resultData.productList = result;
	        	resultData.updateTime = config.updateTime;
	        	res.write(JSON.stringify(resultData));
	        	res.end();
	        });
	    } else if (req.url.indexOf('/assets/') == 0 && req.url.indexOf('..') < 0 && (isJSFile || isCSSFile)) { //check the URL of the current request
	    	var actualPath = req.url.substr(1, req.url.length);
	    	if (actualPath == "assets/pageInit.js") {
	    		console.log(">> switch the actual JS file sent: " + req.headers.referer);
	    		if (req.headers.referer.indexOf("/inventoryadmin") > 0) {
	    			actualPath = "assets/adminMode.js";
	    		} else if (req.headers.referer.indexOf("/inventory") > 0) {
	    			actualPath = "assets/packerMode.js";
	    		} else if (req.headers.referer.indexOf("/orderflowadmin") > 0) {
	    			actualPath = "assets/ordersAdminMode.js";
	    		} else if (req.headers.referer.indexOf("/ofwindow") > 0) {
	    			actualPath = "assets/ordersPackerMode.js";
	    		} 
	    		console.log("actualPath = " + actualPath);
			}
	    	if (isCSSFile)
	    		res.writeHead(200, { 'Content-Type': 'text/css' }); 
	    	else if (isJSFile)
	        	res.writeHead(200, { 'Content-Type': 'application/javascript' });

	        if (fs.existsSync(actualPath)) {
	        	var htmlpage = fs.readFileSync(actualPath).toString();
	        	res.write(htmlpage);
	    	}
	        res.end();
	    } else if (req.url.indexOf('/docs/') == 0 && req.url.indexOf('..') < 0 && (isPDFFile)) { //check the URL of the current request
	    	var actualPath = req.url.substr(1, req.url.length);
	    	if (isPDFFile)
	    		res.writeHead(200, { 'Content-Type': 'application/pdf' }); 
	    	else
	        	res.writeHead(200, { 'Content-Type': 'text/plain' });

	        if (fs.existsSync(actualPath)) {
	        	var rawfile = fs.readFileSync(actualPath);
	        	res.write(rawfile);
	    	}
	        res.end();
	    } else if ((req.url.indexOf('/icons/') == 0 || req.url.indexOf('/productImages/') == 0 || req.url.indexOf('/productImagesPreview/') == 0 || 
	    		  req.url.indexOf('/invoicesPreview/') == 0 || req.url.indexOf('/RTP/') == 0 ) && 
	    			req.url.indexOf('..') < 0 && (isPNGFile || isJPGFile || isGIFFile)) { //check the URL of the current request
	    	var actualPath = req.url.substr(1, req.url.length);
	    	if (isJPGFile)
	    		res.writeHead(200, { 'Content-Type': 'image/jpeg' }); 
	    	else if (isPNGFile)
	        	res.writeHead(200, { 'Content-Type': 'image/png' }); 
	        else if (isGIFFile)
	        	res.writeHead(200, { 'Content-Type': 'image/gif' }); 

	        console.log("is gif " + isGIFFile + " p= " + actualPath);
	        if (fs.existsSync(actualPath)) {
		        var s = fs.createReadStream(actualPath);
				s.on('open', function () {
				        s.pipe(res);
				        console.log("--> sent " + actualPath + " length ");				 });
			} else {
				res.end();
			}
	    } else {
	        res.end('Invalid Request!');
	    }
	}

});

loadConfig();

console.log("AServer listening on " + config.serverPort);
server.listen(config.serverPort, "0.0.0.0"); 
console.log("AServer started on " + config.serverPort + ", try localhost:" + config.serverPort + "/orderflowadmin");
