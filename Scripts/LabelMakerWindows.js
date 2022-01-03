var async = require('async');
var fs = require('fs');
const pdf = require('pdf-poppler');
const path = require('path');
var Jimp = require('jimp');

var arr = ["createTempFolder", "downloadInvoice", "downloadShipping","convertInvoice","convertShippingLabel", "generateLabel"];
var isWin = process.platform === "win32";

var joinImages = function(img1, img2, outputimg, callback) {
	let image = new Jimp(724, 1024, 'white', (err, image) => {
	    if (err) throw err;
	    image.rotate(90);
		
		Jimp.read(img1, (err, fir_img) => {
		        if(err) {
		            console.log(err);
		            callback(err);
		        } else {
		        	fir_img.rotate(90);
		        	console.log("Fimage 1 = " + fir_img.bitmap.width + " & " + fir_img.bitmap.height);
		            Jimp.read(img2, (err, sec_img) => {
		                if(err) {
		                    console.log(err);
		                    callback(err);
		                } else {
		                	fir_img.resize(724, Jimp.AUTO);
		                	console.log("Fimage2 = " + fir_img.bitmap.width + " & " + fir_img.bitmap.height);
		                	fir_img.rotate(-90);
		                	console.log(sec_img.bitmap.width + " & " + sec_img.bitmap.height);
		                    //fir_img.resize(600, 450);
		                    sec_img.crop( 106, 0, 512, 724, function() {
		                    	console.log(sec_img.bitmap.width + " & " + sec_img.bitmap.height);
			                    image.blit(sec_img, 0, 0);
			                    image.blit(fir_img, 512, 0);
			                    image.write(outputimg);
			                    callback(0);
		                    });
		                }
		            })
		        }
			});

	});
}

var convertPDFToImageRotated90deg = function(orderid) {
	var file1 = "invoices/" + orderid + ".pdf";
	var dest = path.basename(file1, path.extname(file1));
	let opts1 = {
	    format: 'png',
	    out_dir: "invoicesPreview/",
	    out_prefix: dest,
	    page: null
	}

	pdf.convert(file1, opts1)
	    .then(res => {
	        //now lets rotate
	        Jimp.read("invoicesPreview/" + orderid + "-1.png", (err, fir_img) => {
	        	if (!err) {
	        		fir_img.rotate(-90);
	        		fir_img.write("invoicesPreview/" + orderid + ".png");
	        		console.log('Successfully converted');
	        	} else {
	        		console.log(err);
	        	}
	        });
	    })
	    .catch(error => {
	        console.error(error);
	    })
}

var generateLabel = function(orderid) {
	if (isWin) {
		generateLabelWindows(orderid);
	} else {
		generateLabelLinux(orderid);
	}
}

var generateLabelLinux = function(orderid) {

}

var generateLabelWindows = function(orderid) {
	async.eachSeries(arr, function(whattodo, callbackinternal2) {
			console.log("Fetchind page  " + whattodo);
			if (whattodo == "createTempFolder") {
				fs.rmdirSync("TEMP/" + orderid, { recursive: true });
				fs.mkdirSync("TEMP/" + orderid);
				console.log("Created Temp folder ");
				callbackinternal2(null);
			} else if (whattodo == "downloadInvoice") {
				if (fs.existsSync("invoices/" + orderid + ".pdf")) {
					console.log("Invoice " + orderid + " exists");
					callbackinternal2(null);
				}
			} else if (whattodo == "downloadShipping") {
				if (fs.existsSync("labels/" + orderid + ".pdf")) {
					console.log("Label for " + orderid + " exists");
					callbackinternal2(null);
				}
			} else if (whattodo == "convertInvoice") {
				var file1 = "invoices/" + orderid + ".pdf";
				let opts1 = {
				    format: 'jpeg',
				    out_dir: "TEMP/" + orderid ,
				    out_prefix: "i" + path.basename(file1, path.extname(file1)),
				    page: null
				}

				pdf.convert(file1, opts1)
				    .then(res => {
				        console.log('Successfully converted');
				        callbackinternal2(null);
				    })
				    .catch(error => {
				        console.error(error);
				    })
			} else if (whattodo == "convertShippingLabel") {
				var file2 = "labels/" + orderid + ".pdf";
				let opts2 = {
				    format: 'jpeg',
				    out_dir: "TEMP/" + orderid,
				    out_prefix: "d" + path.basename(file2, path.extname(file2)),
				    page: null
				}

				pdf.convert(file2, opts2)
				    .then(res => {
				        console.log('Successfully converted');
				        callbackinternal2(null);
				    })
				    .catch(error => {
				        console.error(error);
				    })
			} else if (whattodo == "generateLabel") {
				//we could have multiple images, join them together with the delivery label at the end.
				var numFiles = 0;
				fs.readdirSync("TEMP/" + orderid).forEach(file => {
					console.log("->" + file);
					if (numFiles == 0) img2 = "TEMP/" + orderid + "/" + file;
					else if (numFiles == 1) img1 = "TEMP/" + orderid + "/" + file;
					numFiles++;
				});
				console.log (img1);
				console.log(img2);
				if (numFiles == 2) {
					joinImages(img1, img2, "RTP/" + orderid + ".png", function(err) {
						if (err) {
							console.log("Couldnt merge images");
						}
						callbackinternal2(null)

					});
				}
			}
			
	}, function(err, results) {
	    //console.log(err);
	    console.log("forEachSeries results : " + results);

	});

}

module.exports.generateLabel = generateLabel;
module.exports.convertPDFToImageRotated90deg = convertPDFToImageRotated90deg;