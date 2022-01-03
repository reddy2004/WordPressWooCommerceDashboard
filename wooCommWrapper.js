/*
 *	Code to handle wooCommerce side of things on wordpress site
*/
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
var async = require('async');
var fs = require('fs');
request1 = require('request');
var pdf_download = require('download-pdf');
var https = require('https'); 
var curl = require('curlrequest');
var Jimp = require('jimp');

var api = null;

var config = {};

var init = function() {
		var cfg2 = fs.readFileSync('config.json').toString();
		config = JSON.parse(cfg2);

		api = new WooCommerceRestApi(config.wooCommAuth);
}

var get_product_curl = function(productId, callback) {
		var options = {
		   host: 'snack-cart.in',
		   port: 443,
		   path: '/wp-json/wc/v3/products/' + productId,
		   // authentication headers
		   headers: {
		      'Authorization': 'Basic ' + new Buffer(config.wooCommCurlAuth).toString('base64')
		   }   
		};

		//this is the call
		request = https.get(options, function(res){
		   var body = "";
		   res.on('data', function(data) {
		      body += data;
		   });
		   res.on('end', function() {
		    //here we have the full response, html or json object
		      console.log(body);
		      callback({error : 'SUCCESS', result: body});
		   })
		   res.on('error', function(e) {
		      console.log("Got error: " + e.message);
		      callback({error : 'FAILED', result: {}});
		   });
			});

}


function get_product_api(productId, callback) {
	console.log("Trying to get info for " + productId + " from wc/products");
	api.get("products/" + productId)
	  .then((response) => {
	  	console.log(response);
	  	callback({error : 'SUCCESS', result: response.data});
	  	console.log(response.data);
	    console.log("wooCommWrapper get_product success for " + productId + " " + response.data);
	  })
	  .catch((error) => {
	    console.log("wooCommWrapper get_product failed for " + productId);
	    callback({error : 'FAILED', result: {}});
	  });
}

function get_product(productId, callback) {
		if (config.useWooCommApi) {
				get_product_api(productId, callback);
		} else {
				get_product_curl(productId, callback);
		}
}


var downloadInvoice = function(id, url) {
		const file = fs.createWriteStream("invoices/" + id + ".pdf");
		const request1 = https.get(url, function(response) {
		  response.pipe(file);
		});
}

function convertPhone(p) {
	var pa = p.replace(/ /g,'');
	var pb = (pa.length == 13)? pa.replace('+91','') : pa;
	var pc = (pa.length == 12)? pb.replace('91','') : pb;
	console.log (p + "->" + pc);
	return pc;
}

var simplifyOrderData = function(id, data) {
		console.log(data);
		var simpleOrder = {};
		simpleOrder.orderid = id;
		simpleOrder.firstName = data.shipping.first_name;
		simpleOrder.lastName = data.shipping.last_name;
		simpleOrder.phone = convertPhone(data.billing.phone);
		simpleOrder.address_1 = data.shipping.address_1;
		simpleOrder.address_2 = data.shipping.address_2;
		simpleOrder.city = data.shipping.city;
		simpleOrder.state = data.shipping.state;
		simpleOrder.postcode = data.shipping.postcode;
		simpleOrder.items = [];
		simpleOrder.orderKey = data.order_key;
		simpleOrder.invoiceLink = "https://www.snack-cart.in/wp-admin/admin-ajax.php?action=generate_wpo_wcpdf&document_type=invoice&order_ids=" + id + "&&order_key=" + data.order_key;
		simpleOrder.amount = parseInt(data.total);
		simpleOrder.type = data.payment_method;

		simpleOrder.email = (typeof(data.billing.email) == 'undefined')? "": data.billing.email;

		downloadInvoice(id, simpleOrder.invoiceLink);

		var items = data.line_items;
		for (var i=0;i<items.length;i++) {
		   simpleOrder.items.push({product_id: items[i].product_id, quantity: items[i].quantity, name: items[i].name, supplimented_quantity : 0});
		}
		return simpleOrder;
}


function get_order_api(orderid, callback)
{
	console.log("Trying to get info for " + orderid + " from wc/orders");
	api.get("orders/" + orderid)
	  .then((response) => {
	  	console.log(response.data);
	  	var res = simplifyOrderData(orderid, response.data);
	  	callback({error : 'SUCCESS', result: res});
	    console.log(response.data);
	  })
	  .catch((error) => {
	    console.log(error);
	    callback({error : 'FAILED', result: {}});
	  });
}

function get_order_curl(orderid, callback)
{
		var options = {
		   host: 'snack-cart.in',
		   port: 443,
		   path: '/wp-json/wc/v3/orders/' + orderid,
		   // authentication headers
		   headers: {
		      'Authorization': 'Basic ' + new Buffer(config.wooCommCurlAuth).toString('base64')
		   }   
		};

		//this is the call
		request = https.get(options, function(res){
		   var body = "";
		   res.on('data', function(data) {
		      body += data;
		   });
		   res.on('end', function() {
		    //here we have the full response, html or json object
		      console.log(body);
		      callback({error : 'SUCCESS', result: JSON.parse(body)});
		   })
		   res.on('error', function(e) {
		      console.log("Got error: " + e.message);
		      callback({error : 'FAILED', result: {}});
		   });
			});
}

function get_orders_by_page_curl(type, pagenumber, callback) {
		var postdata =  {status : type, page : pagenumber};
		var simplifiedOrderData = [];
		console.log("in curl get order by page " + JSON.stringify(postdata));

		var options = {
		   host: 'snack-cart.in',
		   port: 443,
		   path: '/wp-json/wc/v3/orders/',
		   //method: 'POST',
		   // authentication headers
		   headers: {
		      'Authorization': 'Basic ' + new Buffer(config.wooCommCurlAuth).toString('base64'),
		      'Content-Length': JSON.stringify(postdata).length,
		      'Content-Type': 'application/json',
		   }
		};

		//this is the call
		request = https.request(options, function(res){
		   var body = "";
		   res.on('data', function(data) {
		      body += data;

		   });
		   res.on('end', function() {
		      var jsonbody = JSON.parse(body);
		      console.log("in curl get order by page " + jsonbody.length);
			  	for (var i=0;i<jsonbody.length;i++) {
			  		simplifiedOrderData.push(simplifyOrderData(jsonbody[i].id, jsonbody[i]));
			  	}
		      callback(simplifiedOrderData);
		   })
		   res.on('error', function(e) {
		      console.log("Got error: " + e.message);
		      callback([]);
		   });
			});

		request.write(JSON.stringify(postdata));
		request.end();
}

function get_orders_by_page_api(type,pagenumber, callback) {
		var simplifiedOrderData = [];
				//console.log("Fetchind page (" + type + ") " + whattodo);
				api.get("orders", {status : type, page : whattodo})
					  .then((response) => {
						  	//console.log(response);
						  	for (var i=0;i<response.data.length;i++) {
						  		simplifiedOrderData.push(simplifyOrderData(response.data[i].id, response.data[i]));
						  	}
						  	callback(simplifiedOrderData);
					  })
					  .catch((error) => {
					    console.log(error);
					    console.log("Fail " + whattodo);
					  });	
}
function get_orders_by_page(type, pagenumber, callback)
{
		if (config.useWooCommApi) {
				get_orders_by_page_api(type, pagenumber, callback);
		} else {
				get_orders_by_page_curl(type, pagenumber, callback);
		}
}

function get_order(orderid, callback)
{
		if (config.useWooCommApi) {
				get_order_api(orderid, callback);
		} else {
				get_order_curl(orderid, callback);
		}
}

function downloadImage(productId, url) {
		var download = function(uri, filename, callback){
			  request1.head(uri, function(err, res, body) {
			    request1(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
			  });
		};

		var lastpart = url.substr(url.length - 5, 5);
		var jpegidx = lastpart.indexOf('.');
		var extension = lastpart.substr(jpegidx, lastpart.length - jpegidx);

		if (url == null || typeof url == 'undefined' || url == "") {
			console.log("Error: URL param for downloadImage is " + url);
		} else {
			download(url, "productImages/p" + productId + extension, function() {});
		}
}

function get_product_image_link(product) {
		var idx = product.yoast_head.indexOf('meta property="og:image"');
		if (idx < 0) {
			console.log("No IMAGE LINK FOR " + product.name);
			return "";
		}
		var sidx = product.yoast_head.indexOf('\"', idx+26);
		var eidx = product.yoast_head.indexOf('\"', idx+40);
		var substr = product.yoast_head.substr(sidx+1, eidx - sidx -1);
		return substr;
}

function does_product_already_exist(existingProductIds, newProductId) {
	for (var i=0;i<existingProductIds.length;i++) {
		if (existingProductIds[i] == newProductId) {
			return true;
		}
	}
	return false;
}

function get_all_new_products(inProgressTasks, existingProductIds, forceDownloadImagesAgain, rcallback) 
{
		if (config.useWooCommApi) {
				get_all_new_products_api(inProgressTasks, existingProductIds, forceDownloadImagesAgain, rcallback);
		} else {
				get_all_new_products_curl(inProgressTasks, existingProductIds, forceDownloadImagesAgain, rcallback);
		}
}

function get_all_new_products_curl(inProgressTasks, existingProductIds, forceDownloadImagesAgain, rcallback) 
{
		console.log("Entering get_all_new_products_curl >>>>");
		var options = {
		   host: 'snack-cart.in',
		   port: 443,
		   path: '/wp-json/wc/v3/products/',
		   // authentication headers
		   headers: {
		      'Authorization': 'Basic ' + new Buffer(config.wooCommCurlAuth).toString('base64')
		   }   
		};

		//this is the call
		request = https.get(options, function(res){
				   var body = "";

			  	console.log(res.headers["x-wp-total"]);
			  	console.log(res.headers["x-wp-totalpages"]);
			  	var pageCnt = parseInt(res.headers["x-wp-totalpages"]);
			  	console.log("====get_all_new_products_curl==== " + pageCnt);

			  	if (typeof res.headers["x-wp-total"] == 'undefined' || 
			  				typeof res.headers["x-wp-totalpages"] == 'undefined' || 
			  					typeof res.headers["x-wp-totalpages"] == 'undefined') {
			  		console.log("INCORRECT DATA RETURNED FROM WORDPRESS FOR PRODUCTS/s");
			  		rcallback([]);
			  		return;
			  	}

			  	var arr = [];
			  	for (var p=1;p<=pageCnt;p++) {
			  			arr.push(p);
			  	}
			  	var newProductIds = [];
						async.eachSeries(arr, function(whattodo, callback) {
									var sub_call_postdata =  {page : whattodo};
									var sub_call_options = {
									   host: 'snack-cart.in',
									   port: 443,
									   path: '/wp-json/wc/v3/products/',
									   // authentication headers
									   headers: {
									      'Authorization': 'Basic ' + new Buffer(config.wooCommCurlAuth).toString('base64'),
									   		'Content-Length': JSON.stringify(sub_call_postdata).length,
				      					'Content-Type': 'application/json',
									   }   
									};

									//this is the call
									let request1 = https.request(sub_call_options, function(res){
									   var body = "";
											   res.on('data', function(data) {
											      body += data;

											   });
											   res.on('end', function() {
											      var jsonbody = JSON.parse(body);
											      console.log("in curl get product by page : " + jsonbody.length + " items of page " + whattodo);

												  	  inProgressTasks.syncProducts.percent = (100*whattodo)/pageCnt;
												  	  
													  	for (var i=0;i<jsonbody.length;i++) {
														  		var substr = get_product_image_link(jsonbody[i]);
														  		if (typeof jsonbody[i].stock_quantity == 'undefined' || jsonbody[i].stock_quantity == null) {
														  			jsonbody[i].stock_quantity = 0;
														  		}
														  		console.log("[" + jsonbody[i].stock_quantity + "]  " +jsonbody[i].id  + " " + jsonbody[i].name);

														  		if (!does_product_already_exist(existingProductIds, jsonbody[i].id)) {
														  			downloadImage(jsonbody[i].id, substr);
														  			newProductIds.push({id: jsonbody[i].id, name: jsonbody[i].name, 
														  					permalink: jsonbody[i].permalink, website: jsonbody[i].stock_quantity, 
														  					inventory: 0, expiry: 'YYYY-MM-DD', buy: 0});
													  			} else if (forceDownloadImagesAgain) {
													  				downloadImage(jsonbody[i].id, substr);
													  			}
													  	}

											  		setTimeout(function(){ callback(null); }, 8000);

											   })
											   res.on('error', function(e) {
											      console.log("................... Got error: " + e.message);
											      callback(null);
											   });
										});

									request1.write(JSON.stringify(sub_call_postdata));
									request1.end();

					}, function(err, results) {
						createPreviewImages();
					    rcallback(newProductIds);
					});


				   res.on('data', function(data) {
				      body += data;
				   });
				   res.on('end', function() {
				   		//We need to look at only headers here
				   })
				   res.on('error', function(e) {
				      console.log("Got error: " + e.message);
				      rcallback([]);
				   });
			});
}

/*
 * Look at the site if new products are added and return them
 */
function get_all_new_products_api(inProgressTasks, existingProductIds, forceDownloadImagesAgain, rcallback) 
{
	var newProductIds = [];

	api.get("products", {page : 1})
		  .then((response) => {
			  	console.log(response.headers["x-wp-total"]);
			  	console.log(response.headers["x-wp-totalpages"]);

			  	var pageCnt = parseInt(response.headers["x-wp-totalpages"]);
			  	console.log("==== " + pageCnt);

			  	if (typeof response.headers["x-wp-total"] == 'undefined' || 
			  				typeof response.headers["x-wp-totalpages"] == 'undefined' || 
			  					typeof response.headers["x-wp-totalpages"] == 'undefined') {
			  		console.log("INCORRECT DATA RETURNED FROM WORDPRESS FOR PRODUCT/s");
			  		rcallback([]);
			  		return;
			  	}

			  	var arr = [];
			  	for (var c=1 ; c <= pageCnt; c++) {
			  		arr.push(c);
			  	}
			  	console.log(arr + ">>>");
					async.eachSeries(arr, function(whattodo, callback) {
						api.get("products", {page : whattodo})
							  .then((response) => {
							  	  inProgressTasks.syncProducts.percent = (100*whattodo)/pageCnt;
							  	  
								  	for (var i=0;i<response.data.length;i++) {
									  		var substr = get_product_image_link(response.data[i]);
									  		if (typeof response.data[i].stock_quantity == 'undefined' || response.data[i].stock_quantity == null) {
									  			response.data[i].stock_quantity = 0;
									  		}
									  		console.log("[" + response.data[i].stock_quantity + "]  " + response.data[i].id  + " " + response.data[i].name);

									  		if (!does_product_already_exist(existingProductIds, response.data[i].id)) {
									  			downloadImage(response.data[i].id, substr);
									  			newProductIds.push({id: response.data[i].id, name: response.data[i].name, 
									  					permalink: response.data[i].permalink, website: response.data[i].stock_quantity, 
									  					inventory: 0, expiry: 'YYYY-MM-DD', buy: 0});
								  			} else if (forceDownloadImagesAgain) {
								  				downloadImage(response.data[i].id, substr);
								  			}
								  	}

								  	setTimeout(function(){ callback(null); }, 2000);
							  })
							  .catch((error) => {
								    console.log("fail " + whattodo + "  e: " + error);
								    setTimeout(function(){ callback(null); }, 2000);
							  });
				}, function(err, results) {
				    rcallback(newProductIds);
				});
		  })
		  .catch((error) => {
			  	console.log("Failed to get api.get (products)");
			    console.log(error.response);
			    rcallback([]);
		  });
		  createPreviewImages();
}



function get_all_orders(type, limitto, rcallback) 
{
		if (config.useWooCommApi) {
				get_all_orders_api(type, limitto, rcallback) 
		} else {
				get_all_orders_curl(type, limitto, rcallback) 
		}
}
function get_all_orders_curl(type, limitto, rcallback) 
{

		var postdata = {status : type, page : 1};
		var options = {
		   host: 'snack-cart.in',
		   port: 443,
		   path: '/wp-json/wc/v3/orders/',
		   //method: 'POST',
		   // authentication headers
		   headers: {
		      'Authorization': 'Basic ' + new Buffer(config.wooCommCurlAuth).toString('base64'),
		      'Content-Length': JSON.stringify(postdata).length,
		      'Content-Type': 'application/json',
		   }
		};

		//this is the call
		request = https.request(options, function(res){
		   var body = "";

			  	console.log(res.headers["x-wp-total"]);
			  	console.log(res.headers["x-wp-totalpages"]);
			  	var pageCnt = parseInt(res.headers["x-wp-totalpages"]);
			  	console.log("====get_all_orders==== " + pageCnt);

			  	if (typeof res.headers["x-wp-total"] == 'undefined' || 
			  				typeof res.headers["x-wp-totalpages"] == 'undefined' || 
			  					typeof res.headers["x-wp-totalpages"] == 'undefined') {
			  		console.log("INCORRECT DATA RETURNED FROM WORDPRESS FOR ORDERS/s");
			  		rcallback([]);
			  		return;
			  	}

			  	compute_simplified_orders(type, pageCnt, limitto, rcallback);

		   res.on('data', function(data) {
		      body += data;
		   });
		   res.on('end', function() {

		      //console.log("***************" + body);
		      //var jsonbody = JSON.parse(body);
		      //dont do anything for body. we have what we need in response headers
		   })
		   res.on('error', function(e) {
		      console.log("Got error: " + e.message);
		      rcallback([]);
		   });
			});

		request.write(JSON.stringify(postdata));
		request.end();

}

function compute_simplified_orders(type, pageCnt, limitto, rcallback)
{
		  	var simplifiedOrderData = [];
		  	var arr = [];
		  	pageCnt = (limitto < pageCnt) ? limitto : pageCnt;
		  	
		  	for (var c=1 ; c <= pageCnt; c++) {
		  			arr.push(c);
		  	}
		  	console.log(arr + ">>> array elements, i.e pages");
				async.eachSeries(arr, function(whattodo, callbackinternal2) {
							console.log("Async page " + whattodo);
							get_orders_by_page(type, whattodo, function(list) {
									console.log("get_orders_by_page retunrs,,," + whattodo + " " + list.length);
									
									for (var i=0;i<list.length;i++) {
											simplifiedOrderData.push(list[i]);
									}
									callbackinternal2(null);
							})

				}, function(err, results) {
						console.log("we have list of orders in compute_simplified_orders " + simplifiedOrderData.length);
				    rcallback(simplifiedOrderData);
				});

}

function get_all_orders_api(type, limitto, rcallback) 
{
	

	console.log("get_all_orders : type >>>> " + type);

	api.get("/orders", {status : type, page : 1})
		  .then((response) => {
		  		console.log("----------------------------------------------------------------------");
		  		console.log(response);
			  	console.log("----------------------------------------------------------------------");
			  	

			  	console.log(response.headers["x-wp-total"]);
			  	console.log(response.headers["x-wp-totalpages"]);
			  	var pageCnt = parseInt(response.headers["x-wp-totalpages"]);
			  	console.log("==== " + pageCnt);

			  	if (typeof response.headers["x-wp-total"] == 'undefined' || 
			  				typeof response.headers["x-wp-totalpages"] == 'undefined' || 
			  					typeof response.headers["x-wp-totalpages"] == 'undefined') {
			  		console.log("INCORRECT DATA RETURNED FROM WORDPRESS FOR ORDERS/s");
			  		rcallback([]);
			  		return;
			  	}

			  	compute_simplified_orders(type, pageCnt, limitto, rcallback);
		  })
		  .catch((error) => {
		    console.log("Failed to get orders " + error.response.data);
		    rcallback([]);
		  });
}

function updateRawQuantityInfo(productId, quantity) {

	  var query = "products/" + productId;
	  console.log("query ---> " + query + " qan=" + quantity);
	  api.put(query, {
	     stock_quantity : quantity
	  }).then((response) => {
		    // Successful request
		    console.log("Response Status: (updateRawQuantityInfo)", response.status);
		    //console.log("Response Data: (updateRawQuantityInfo) ", response.data);
	  })
	  .catch((error) => {
		    // Invalid request, for 4xx and 5xx statuses
		    console.log("Response Status:", error.response.status);
		    console.log("Response Headers:", error.response.headers);
		    console.log("Response Data:", error.response.data);
	  })
	  .finally(() => {
	    // Always executed.
	  });
}

function getPriceAndQuantityInfo_api(productId, callback)
{
	  var query = "products/" + productId;
	  api.get(query, {

	  }).then((response) => {
		    callback(response.data.name, response.data.stock_quantity, response.data.regular_price, response.data.sale_price);
	  })
	  .catch((error) => {

	  })
	  .finally(() => {
	    // Always executed.
	  });
}

function getPriceAndQuantityInfo_curl(productId, callback)
{
		var options = {
		   host: 'snack-cart.in',
		   port: 443,
		   path: '/wp-json/wc/v3/products/' + productId,
		   // authentication headers
		   headers: {
		      'Authorization': 'Basic ' + new Buffer(config.wooCommCurlAuth).toString('base64')
		   }   
		};

		//this is the call
		request = https.get(options, function(res){
		   var body = "";
		   res.on('data', function(data) {
		      body += data;
		   });
		   res.on('end', function() {
		    //here we have the full response, html or json object
		      //console.log(body);
		      var bodyjson = JSON.parse(body);
		      callback(bodyjson.name, bodyjson.stock_quantity, bodyjson.regular_price, bodyjson.sale_price);
		   })
		   res.on('error', function(e) {
		      console.log("Got error: " + e.message);
		      callback({error : 'FAILED', result: {}});
		   });
			});


}

function createPreviewImages()
{
		fs.readdir('productImages', (err, files) => {
		  files.forEach(file => {
		    	var isJPGFile = (file.indexOf('.jpg') == (file.length - 4) || file.indexOf('.jpeg') == (file.length - 5))? true : false;
		    	var isPNGFile = (file.indexOf('.png') == (file.length - 4))? true : false;

			    if (isJPGFile) {
			    		//convert jpg to png file in product images
			    		var convfileName = file.substr(0, file.indexOf('.')) + ".png";
			    		console.log(convfileName);
			    		
							Jimp.read('productImages/' + file, (err, lenna) => {
							  if (err) throw err;
							  lenna
							    //.resize(256, 256) // resize
							    .quality(100) // set JPEG quality
							    //.greyscale() // set greyscale
							    .write('productImages/' + convfileName); // save
							});
							
							//now again convert the jpg to png preview
							Jimp.read('productImages/' + file, (err, lenna) => {
							  if (err) throw err;
							  lenna
							    .resize(256, 256) // resize
							    .quality(100) // set JPEG quality
							    //.greyscale() // set greyscale
							    .write('productImagesPreview/' + convfileName); // save
							});

		    	} else if (isPNGFile) {
		    		//we have a png file, convert to png preview
		    		console.log(file);
							Jimp.read('productImages/' + file, (err, lenna) => {
							  if (err) console.log( err);
							  else {
								  lenna
								    .resize(256, 256) // resize
								    .quality(100) // set JPEG quality
								    //.greyscale() // set greyscale
								    .write('productImagesPreview/' + file); // save
							  }
							});
							 		
		    	}
		  });
		});

}

function getPriceAndQuantityInfo(productId, callback)
{
		if (config.useWooCommApi) {
				getPriceAndQuantityInfo_api(productId, callback);
		} 
		else 
		{
				getPriceAndQuantityInfo_curl(productId, callback);
		}

}

//Long running
var updateStockQuantityAsSeenInWebsite = function(inProgressTasks, productIdList)
{
			var counter = 0;
		  console.log("Updating stock quantity for " + productIdList.length + " products");
			async.eachSeries(productIdList, function(productid, callbackinternal2) {
					getPriceAndQuantityInfo(productid, function(name, quantity, rp, sp) {
							callbackinternal2(null);

							//XXX todo update the database
							console.log(productid + ":"  + name + ":" + quantity);
							inProgressTasks.syncQuantityInfo.percent = (100*counter++)/productIdList.length;
					});
			}, function(err, results) {
        	inProgressTasks.syncQuantityInfo.running = false;
        	inProgressTasks.syncQuantityInfo.percent = 0;
        	inProgressTasks.syncQuantityInfo.lastupdatetime = Math.floor((new Date()).getTime() / 1000);

        	//XXX write the cached list to disk.
			});
}

//Item count normally in the invoice must be deleted from stockroom
//Item count in supplimented quantity, ex. gift/free samples must be removed
//both from website and stockroom. WooCommerceWrapper has similar function
var acceptOrderAndDecrementInventory = function(order, finalCallback)
{
	  console.log(JSON.stringify(order));
		async.eachSeries(order.items, function(item, callback6) {
				if (item.supplimented_quantity > 0) {
					getPriceAndQuantityInfo(item.product_id, function(stock, rp, sp) {
							console.log("------> " + item.product_id + " quantity = " + stock + " suppl = " + item.supplimented_quantity);
							updateRawQuantityInfo(item.product_id, stock - item.supplimented_quantity);
							callback6(null);
					});
				} else {
					console.log("------> " + item.product_id + " has no supplicmented quantity");
					callback6(null);
				}
		}, function(err, results) {
				finalCallback("Update in website is sucessfull");
		});
}

module.exports.init = init;
module.exports.get_product = get_product;
module.exports.get_product_curl = get_product_curl;
module.exports.get_order = get_order;
module.exports.get_all_orders = get_all_orders;
module.exports.get_all_new_products = get_all_new_products;
module.exports.get_orders_by_page = get_orders_by_page;

module.exports.updateRawQuantityInfo = updateRawQuantityInfo;
module.exports.getPriceAndQuantityInfo = getPriceAndQuantityInfo;
module.exports.updateStockQuantityAsSeenInWebsite = updateStockQuantityAsSeenInWebsite;
module.exports.acceptOrderAndDecrementInventory = acceptOrderAndDecrementInventory;