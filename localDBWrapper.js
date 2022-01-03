/*
 Code to handle local database
*/
var fs = require('fs');
HashMap = require('hashmap');
var async = require('async');
var lastUpdatedTime = 0;
var request = require('request');

//In memory, must be re-read from disk after an update.
var product_map = new HashMap();
var cached_product_list = [];
var cached_log_list = [];
var isWin = process.platform === "win32";

//This will not contain all the orders, only orders in processing, on hold, in transit.
//Cancelled orders and delivered orders will not be kept in memory.
/* 
 *  Allowed state of order.
 *	From WP: Processing, Completed
 *  Ours: [New, Approved, Packed, Manifested, Handover, InTransit Delivered/RTO] [Completed]
 *  Each of the above also has other requirements for each stage
 *  New -> 
 *  Approved -> Edit item list if not same as invoice & mode of delivery
 *  Packed ->
 *  Manifested -> Generate slip either delhivery or indiapost or by hand
 *  In Transit -> Autotracked
 *  Delivered/RTO -> Autotrack
 *  Completed -> Rmove from our tracking list and update wordpres
 */
//var order_map = new HashMap();
var cached_order_list = [];
var in_process_orders_map = new HashMap();
var all_orders_list = [];

var init = function(downloadInvoices) {
	var array1 = fs.readFileSync('database/products.json').toString();
	var productList = JSON.parse(array1);

	product_map = new HashMap();
	cached_product_list = [];
	
	console.log("KNOWN PRODUCTS = " + productList.length);

	for (var i = 0; i < productList.length; i++) {
		product_map.set(productList[i].id, productList[i]);
		cached_product_list.push(productList[i]);
	}

	var array2 = fs.readFileSync('database/orders.json').toString();
	//var orderList = JSON.parse(array2);

	//order_map = new HashMap();
	//for (var i = 0; i < orderList.length; i++) {
	//	order_map.set(orderList[i].id, orderList[i]);
	//}

	var array3 = fs.readFileSync('database/inProcessOrders.json').toString();
	var orderList3 = JSON.parse(array3);

	in_process_orders_map = new HashMap();
	cached_order_list = [];
	for (var i = 0; i < orderList3.length; i++) {
		in_process_orders_map.set(orderList3[i].OrderId, orderList3[i]);
		cached_order_list.push(orderList3[i]);

		//download the invoices
		if (downloadInvoices) {
			console.log("Download " + cached_order_list[i].invoiceLink);
			downloadInvoice(cached_order_list[i].OrderId, cached_order_list[i].invoiceLink, "invoices/" + cached_order_list[i].OrderId + ".pdf", function(oid) {
				console.log("done downloading " + oid);
				/* Lets convert it to an image rotated 90 deg */
				makeImageOfInvoice(oid);
			});
		}

	}
	console.log("init arr: " + cached_order_list.length);
	console.log("init map: " + in_process_orders_map.count());
}

var makeImageOfInvoice = function(orderid) {
	if (isWin) {
		var labelMakerWin =  require('./Scripts/LabelMakerWindows.js');
		labelMakerWin.convertPDFToImageRotated90deg(orderid);
	} else {
		var labelMakerLin =  require('./Scripts/LabelMakerLin.js');
		labelMakerLin.convertPDFToImageRotated90deg(orderid);
	}
}

var downloadInvoice = function(orderid, uri, filename, callback){
	  console.log("downloadInvoice : " + uri);
	  if (typeof uri == "undefined") {
	  	return;
	  }
	  request.head(uri, function(err, res, body){
	    //console.log('content-type:', res.headers['content-type']);
	    //console.log('content-length:', res.headers['content-length']);

	    request(uri).pipe(fs.createWriteStream(filename)).on('close', function() {
	    	callback(orderid);
	    });
	  });
};

var flushTempLogToDisk = function() {
	var array2 = fs.readFileSync('database/logs.json').toString();
	var allLogs = JSON.parse(array2);

	for (var i =0 ;i<cached_log_list.length;i++) {
		allLogs.push(cached_log_list[i]);
	}

	fs.writeFile('database/logs.json', JSON.stringify(allLogs, null, 4), function (data) {
			console.log("..wrote logs.json : total " + allLogs.length);
			cached_log_list = [];
	});
}

var updateProductCountChangeIntoTempLog = function(productid, comment, old_count, new_count, web_new_count) {
	var newLogEntry = {};
	newLogEntry.productid = productid;
	newLogEntry.comment = comment;
	newLogEntry.old_count = old_count;
	newLogEntry.new_count = new_count;
	newLogEntry.web_new_count = web_new_count;
	cached_log_list.push(newLogEntry);
}

var saveProductListAndReinit = function() {
	var random = Math.floor(Math.random() * Math.floor(99999999));
	var swapfile = "Backups/products.json." + random;

	fs.rename("database/products.json", swapfile, function (err) {
		  fs.writeFile('database/products.json', JSON.stringify(cached_product_list, null, 4), function (data) {
		  		console.log("..wrote products.json : total " + cached_product_list.length);
		  		cached_product_list = [];
		  		product_map = new HashMap();
		  		init(false);
		  });
	});	
}

var saveProcessingOrdersAndReinit = function() {
	var random = Math.floor(Math.random() * Math.floor(99999999));
	var swapfile = "Backups/inProcessOrders.json." + random;

	fs.rename("database/inProcessOrders.json", swapfile, function (err) {
		  fs.writeFile('database/inProcessOrders.json', JSON.stringify(cached_order_list, null, 4), function (data) {
	  		console.log("..wrote inProcessOrders.json : total " + cached_order_list.length);
	  		init(false);
		  });
	});	
}

var convertOrderStruct = function (orderFromWP) {
        var ordd = {};
        ordd.OrderId = orderFromWP.orderid
        ordd.CustomerName = orderFromWP.firstName + " " + orderFromWP.lastName;
        ordd.Type = orderFromWP.type;
        ordd.Amount = orderFromWP.amount;
        ordd.Phone = orderFromWP.phone;
        ordd.Address = orderFromWP.address_1 + " "  + orderFromWP.address_2 + " " + orderFromWP.city + " " + orderFromWP.state + " " + orderFromWP.postcode;
        ordd.Status = "New";
        ordd.StatusSeq = 1;
        ordd.items = orderFromWP.items;
		ordd.orderKey = orderFromWP.order_key;
		ordd.invoiceLink = orderFromWP.invoiceLink;

        ordd.customData = {};
        ordd.customData.orderid = orderFromWP.orderid;

        //just default to some values but udpate later
        ordd.customData.sameAsInvoice = 1;
        ordd.customData.modifiedInvoice = 0;
        ordd.customData.supplimentaryItemsIncluded = 0;
        //the above 3 are dummy updates;

        ordd.customData.hasComment = 0;
        ordd.customData.comments = "";
        ordd.isDirty = false;

        ordd.shipping = {};
        ordd.shipping.via = "";
        ordd.shipping.trackingId = "";
        ordd.shipping.status = "new";
        ordd.shipping.customoid = "";
        ordd.shipping.manualTrackingId = "";
        ordd.email = orderFromWP.email;

        //First flag says we have taken action on the inventory part. Either update or drop
        ordd.inventoryUpdateIsDone = false;
        ordd.orderGoodToDelete = false;
        return ordd;
}

var getAllKnownProductIds = function(rcallback) {
	var idList = [];
	for (var i=0;i<cached_product_list.length;i++) {
			idList.push(cached_product_list[i].id);
	}
	rcallback(idList);
}

//Given product id, return productId, name, imagelink, expirty and inventory etc of that product
var findProductData = function(productId, callback) {
	for (var i=0;i<cached_product_list.length;i++) {
		if (cached_product_list[i].id == productId) {
			callback(cached_product_list[i]);
			break;
		}
	}
}

//Update to edit items, update manifest, mark as picked, in transit, rto/delivered.
//if new insert, or copy the new information.
//This could happen if we sync from db and new orders are present.
var updateInProcessingOrder = function(order, callback) {

	for (var i=0;i<cached_order_list.length;i++) {
		if (cached_order_list[i].OrderId == order.OrderId) {
			console.log("Updating order " + order.OrderId)
			cached_order_list[i] = order;
			in_process_orders_map.set(order.OrderId, order);
			break;
		}
	}
	saveProcessingOrdersAndReinit();
	callback({result : "SUCCESS", data: "Saved the modified order"});
}

var printOrderIds = function(prefix, array1) {
	for (var i=0;i<array1.length;i++) {
		console.log(prefix + " " + array1[i].OrderId);
	}
}

var getCachedOrderList = function(callback) {
	callback(cached_order_list);
}

var getDeliveryStatusStruct = function(orderid, trackingId, deliveryStatus, existingStruct) {
	var shipping = {};
	var oidToUse = orderid;

	if (typeof (existingStruct) != 'undefined') {
		shipping.via = existingStruct.via;
		shipping.trackingId = existingStruct.trackingId;
		shipping.manualTrackingId = "";
		shipping.status = trackingId.status;
		shipping.customoid = existingStruct.customoid;
		oidToUse = (typeof (existingStruct.customoid) != 'undefined' && existingStruct.customoid != "")? existingStruct.customoid : orderid;
	} else {
		shipping.via = "";
		shipping.trackingId = "";
		shipping.manualTrackingId = "";
		shipping.status = "new";
		shipping.customoid = "";	
	}

	console.log("Using " + oidToUse + " b/w " + shipping.customoid + " & " + orderid);

	for (var i1=0;i1<deliveryStatus["manifested"].length;i1++) {
		if (deliveryStatus["manifested"][i1].oid == oidToUse) {
			shipping.via = "Delhivery";
			shipping.trackingId = deliveryStatus["manifested"][i1].tid;
			shipping.status = "manifested";
			console.log("In getDeliveryStatusStruct, computed [MANIFESTED] for " + orderid  + "(" + oidToUse + ")");
			return shipping;
		}
	}
	for (var i1=0;i1<deliveryStatus["intransit"].length;i1++) {
		if (deliveryStatus["intransit"][i1].oid == oidToUse) {
			shipping.via = "Delhivery";
			shipping.trackingId = deliveryStatus["intransit"][i1].tid;
			shipping.status = "intransit";
			console.log("In getDeliveryStatusStruct, computed [INTRANSIT] for " + orderid  + "(" + oidToUse + ")");
			return shipping;
		}
	}
	for (var i1=0;i1<deliveryStatus["outfordelivery"].length;i1++) {
		if (deliveryStatus["outfordelivery"][i1].oid == oidToUse) {
			shipping.via = "Delhivery";
			shipping.trackingId = deliveryStatus["outfordelivery"][i1].tid;
			shipping.status = "outfordelivery";
			console.log("In getDeliveryStatusStruct, computed [OUTFORDELIVER] for " + orderid  + "(" + oidToUse + ")");
			return shipping;
		}
	}
	for (var i1=0;i1<deliveryStatus["delivered"].length;i1++) {
		if (deliveryStatus["delivered"][i1].oid == oidToUse) {
			shipping.via = "Delhivery";
			shipping.trackingId = deliveryStatus["delivered"][i1].tid;
			shipping.status = "delivered";
			console.log("In getDeliveryStatusStruct, computed [DELIVERED] for " + orderid);

			for (var i1=0;i1<deliveryStatus["charges"].length;i1++) {
				if (deliveryStatus["charges"][i1].tid == trackingId) {
					shipping.charges = deliveryStatus["charges"][i1].amount;
					console.log("In getDeliveryStatusStruct, computed [CHARGES] for " + orderid  + "(" + oidToUse + ")");
					return shipping;
				}
			}

			return shipping;
		}
	}
	for (var i1=0;i1<deliveryStatus["returned"].length;i1++) {
		if (deliveryStatus["returned"][i1].oid == oidToUse) {
			shipping.via = "Delhivery";
			shipping.trackingId = deliveryStatus["returned"][i1].tid;
			shipping.status = "returned";
			console.log("In getDeliveryStatusStruct, computed [RETURNED] for " + orderid + "(" + oidToUse + ")");
			return shipping;
		}
	}

	console.log("In getDeliveryStatusStruct, computed [NEW] for " + orderid);
	return shipping;
}

/*
 * This is called with all the processing orders that we get from wooCommerce.
 * If there are new orders, just add them to our inProcessOrders orders but dont update
 * anything else. 
*/
var updateBulkInProcessingOrdersFetchedFromWooCommerce = function(data, deliveryStatus, callback) {
	lastUpdatedTime = Math.floor((new Date()).getTime() / 1000);

	var ordersFromWP = new HashMap();

	for (var i=0;i<data.length;i++) {
		var orderid = data[i].orderid;

		//var orderObject = in_process_orders_map.get(orderid);
		if (!in_process_orders_map.has(orderid)) {
			console.log(".... adding " + orderid + " & map " + in_process_orders_map.count() + " arry: " + cached_order_list.length + "  " + in_process_orders_map.has(orderid));
			var currentOrder = convertOrderStruct(data[i]);
			cached_order_list.push(currentOrder);
			in_process_orders_map.set(orderid,currentOrder);
			downloadInvoice(currentOrder.OrderId, currentOrder.invoiceLink, "invoices/" + currentOrder.OrderId + ".pdf", function(oid) {
				console.log("done downloading " + oid);
				/* Lets convert it to an image rotated 90 deg */
				makeImageOfInvoice(oid);
			});
		}

		ordersFromWP.set(orderid, data[i]);
	}

	//Now lets check if we have orders, but already marked completed in WP
	for (var k=0;k<cached_order_list.length;k++) {
		var orderid2 = cached_order_list[k].OrderId;
		cached_order_list[k].shipping = getDeliveryStatusStruct(orderid2, cached_order_list[k].shipping.trackingId, deliveryStatus, cached_order_list[k].shipping);
		
		if (!ordersFromWP.has(orderid2)) {
			cached_order_list[k].removedInWp = true;
		} else {
			cached_order_list[k].removedInWp = false;
		}
	}

	printOrderIds("I", cached_order_list);
	cached_order_list.sort(function (a,b) {
		return b.OrderId - a.OrderId;
	});
	printOrderIds("O", cached_order_list);
	callback(cached_order_list);
	saveProcessingOrdersAndReinit();
}


//This is when the inventory is updated.
var shipOrder = function(orderId) {

}

var updateAllProductData = function(all_products) 
{
	cached_product_list = all_products;
	saveProductListAndReinit();
}

var getCompleteProductList = function(callback) {
	callback (cached_product_list);
}

var removeOrderNotInWPProcessing = function(postdata, callback) {
	var tempList = [];
	for (var t=0;t<cached_order_list.length;t++) {
		if (!(cached_order_list[t].OrderId == postdata.OrderId)) {
			tempList.push(cached_order_list[t]);
		}
	}
	cached_order_list = tempList;
	callback("SUCCESS");
	saveProcessingOrdersAndReinit();
}

var updateRawQuantityInfo = function(productid, RoomNewCount, WebsiteNewCount, product_comment, product_expiry_date, product_buy_price) {
	for (var i=0;i<cached_product_list.length;i++) {
		if (productid == cached_product_list[i].id) {
			if (cached_product_list[i].inventory != RoomNewCount) {
				updateProductCountChangeIntoTempLog(productid, product_comment, cached_product_list[i].inventory, RoomNewCount, WebsiteNewCount);
			}
			cached_product_list[i].inventory = RoomNewCount;
			cached_product_list[i].expiry = product_expiry_date;
			cached_product_list[i].buy = product_buy_price;
			cached_product_list[i].website = WebsiteNewCount;
			flushTempLogToDisk();
			break;
		}
	}
	saveProductListAndReinit();	
}

//Item count normally in the invoice must be deleted from stockroom
//Item count in supplimented quantity, ex. gift/free samples must be removed
//both from website and stockroom. WooCommerceWrapper has similar function
var acceptOrderAndDecrementInventory = function(order, finalCallback)
{
 	console.log(JSON.stringify(order));
 	for (var t=0;t<cached_order_list.length;t++) {
		if (cached_order_list[t].OrderId == order.OrderId) {
			cached_order_list[t].inventoryUpdateIsDone = true;
			cached_order_list[t].orderGoodToDelete = true;
			break;
		}
	}

	async.eachSeries(order.items, function(item, callback6) {
			if (item.quantity > 0 || item.supplimented_quantity > 0) {
				for (var k = 0;k<cached_product_list.length;k++) {
					if (cached_product_list[k].id == item.product_id) {
						//decrement here. productid, comment, old_count, new_count, web_new_count
						var newcount = cached_product_list[k].inventory - (item.supplimented_quantity + item.quantity)
						updateProductCountChangeIntoTempLog(item.product_id, "Order " + order.OrderId, 
								cached_product_list[k].inventory, newcount, "NA");
						cached_product_list[k].inventory = newcount;
					}
				}
				callback6(null);
			} else {
				console.log("------> " + item.product_id + " has no normal quantity");
				callback6(null);
			}
	}, function(err, results) {
			finalCallback("Update in local DB is sucessfull");
			saveProductListAndReinit();
			saveProcessingOrdersAndReinit();
	});	
}

module.exports.init = init;

//Product data
module.exports.findProductData = findProductData;
module.exports.updateAllProductData = updateAllProductData;
module.exports.getAllKnownProductIds = getAllKnownProductIds;
module.exports.getCompleteProductList = getCompleteProductList;

//Order Data
module.exports.updateInProcessingOrder = updateInProcessingOrder;
module.exports.shipOrder = shipOrder;
module.exports.updateBulkInProcessingOrdersFetchedFromWooCommerce = updateBulkInProcessingOrdersFetchedFromWooCommerce;
module.exports.getCachedOrderList = getCachedOrderList;
module.exports.removeOrderNotInWPProcessing = removeOrderNotInWPProcessing;

module.exports.updateRawQuantityInfo = updateRawQuantityInfo;
module.exports.acceptOrderAndDecrementInventory = acceptOrderAndDecrementInventory;