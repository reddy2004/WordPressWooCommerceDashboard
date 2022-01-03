var async = require('async');
var fs = require('fs');
const path = require('path');
var Jimp = require('jimp');

const { Poppler } = require("node-poppler");
const poppler = new Poppler("./usr/bin");

var arr = ["createTempFolder", "downloadInvoice", "downloadShipping","convertInvoice","convertShippingLabel", "generateLabel"];
var isWin = process.platform === "win32";

var joinImages = function(img1, img2, outputimg, callback) {
	let image = new Jimp(724*2, 1024*2, 'white', (err, image) => {
	    if (err) throw err;
	    image.rotate(90);
		
		Jimp.read(img1, (err, fir_img) => {
		        if(err) {
		            console.log(err);
		            callback(err);
		        } else {
		        	fir_img.resize(724*2, 1024*20);
		        	fir_img.rotate(90);
		        	console.log("Fimage 1 = " + fir_img.bitmap.width + " & " + fir_img.bitmap.height);
		            Jimp.read(img2, (err, sec_img) => {
		                if(err) {
		                    console.log(err);
		                    callback(err);
		                } else {
		                	sec_img.resize(724*2, 1024*2);
		                	fir_img.resize(724*2, Jimp.AUTO);
		                	console.log("Fimage 2 = " + fir_img.bitmap.width + " & " + fir_img.bitmap.height);
		                	fir_img.rotate(-90);
		                	console.log(sec_img.bitmap.width + " & " + sec_img.bitmap.height);
		                    //fir_img.resize(600, 450);
		                    sec_img.crop( 106*2, 0, 512*2, 724*2, function() {
		                    	console.log(sec_img.bitmap.width + " & " + sec_img.bitmap.height);
			                    image.blit(sec_img, 0, 0);
			                    image.blit(fir_img, 512*2, 0);
			                    image.write(outputimg);
			                    callback(0);
		                    });
		                }
		            })
		        }
			});

	});
}

var generateLabeltest = function(orderid) {
	const file = "docs/example.pdf";
	const poppler = new Poppler();
	const options = {
		firstPageToConvert: 1,
		lastPageToConvert: 2,
		pngFile: true,
	};
	const outputFile = `test_document.png`;

	const res = poppler.pdfToCairo(file, outputFile, options).then((res) => {
		console.log(res);
	});

}

var convertPDFToImageRotated90deg = function (orderid) {
		var file1 = "invoices/" + orderid + ".pdf";
		const poppler = new Poppler("/usr/bin");
		const options = {
			firstPageToConvert: 1,
			lastPageToConvert: 1,
			pngFile: true,
		};
		const outputFile = "invoicesPreview/" + orderid;

		poppler.pdfToCairo(file1, outputFile, options).then((res) => {
			console.log(res);

			//Now lets use jimp and rotate it.
			Jimp.read(outputFile + "-1.png", (err, fir_img) => {
				if (!err) {
					fir_img.rotate(-90);
					fir_img.write(outputFile + ".png");
				}
			});
		}).catch((err) => {console.log("pdftocario err = " + err);});
}

var generateLabel = function(orderid) {

	async.eachSeries(arr, function(whattodo, callbackinternal2) {
			console.log("Fetchind page  " + whattodo);
			if (whattodo == "createTempFolder") {
				if (fs.existsSync("TEMP/" + orderid)) {
					fs.rmdirSync("TEMP/" + orderid, { recursive: true });
				}
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
				console.log("Entering convertInvoice");
				var file1 = "invoices/" + orderid + ".pdf";
				const poppler = new Poppler("/usr/bin");
				const options = {
					firstPageToConvert: 1,
					lastPageToConvert: 1,
					pngFile: true,
				};
				const outputFile = "TEMP/" + orderid + "/i" + orderid + ".png";

				poppler.pdfToCairo(file1, outputFile, options).then((res) => {
					console.log(res);
					callbackinternal2(null);
				}).catch((err) => {console.log("pdftocario err = " + err);});

			} else if (whattodo == "convertShippingLabel") {
				    console.log("Entering convertShippingLabel");
					var file2 = "labels/" + orderid + ".pdf"
					const poppler = new Poppler("/usr/bin");
					const options = {
						firstPageToConvert: 1,
						lastPageToConvert: 1,
						pngFile: true,
					};
					const outputFile2 = "TEMP/" + orderid + "/d" + orderid + ".png";

					poppler.pdfToCairo(file2, outputFile2, options).then((res) => {
						console.log(res);
						callbackinternal2(null);
					}).catch((err) => {console.log("pdftocario err = " + err);});

			} else if (whattodo == "generateLabel") {
				//we could have multiple images, join them together with the delivery label at the end.
				var numFiles = 0;
				var img1 = '', img2 = '';
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