//join invoice and delivery into a single page

var Jimp = require('jimp');
const fs = require('fs');


var Jimp = require('jimp');

let image = new Jimp(724, 1024, 'white', (err, image) => {
    if (err) throw err;
    image.rotate(90);
	
	Jimp.read('../RTP/i16159.jpg', (err, fir_img) => {
	        if(err) {
	            console.log(err);
	        } else {
	        	fir_img.rotate(90);
	        	console.log("Fimage = " + fir_img.bitmap.width + " & " + fir_img.bitmap.height);
	            Jimp.read('../RTP/d16159.jpg', (err, sec_img) => {
	                if(err) {
	                    console.log(err);
	                } else {
	                	fir_img.resize(724, Jimp.AUTO);
	                	console.log("Fimage = " + fir_img.bitmap.width + " & " + fir_img.bitmap.height);
	                	fir_img.rotate(-90);
	                	console.log(sec_img.bitmap.width + " & " + sec_img.bitmap.height);
	                    //fir_img.resize(600, 450);
	                    sec_img.crop( 106, 0, 512, 724, function() {
	                    	console.log(sec_img.bitmap.width + " & " + sec_img.bitmap.height);
		                    image.blit(sec_img, 0, 0);
		                    image.blit(fir_img, 512, 0);
		                    image.write('new_imgae.png');
	                    });


	                }
	            })
	        }
	    });

});

