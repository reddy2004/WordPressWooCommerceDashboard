var Jimp = require('jimp');
const fs = require('fs');

fs.readdir('productImages', (err, files) => {
  files.forEach(file => {
    	var isJPGFile = (file.indexOf('.jpg') == (file.length - 4) || file.indexOf('.jpeg') == (file.length - 5))? true : false;
	    	if (isJPGFile) {
	    		
	    		var convfileName = file.substr(0, file.indexOf('.')) + ".png";
	    		console.log(convfileName);
	    		/*
					Jimp.read('productImages/' + file, (err, lenna) => {
					  if (err) throw err;
					  lenna
					    //.resize(256, 256) // resize
					    .quality(60) // set JPEG quality
					    //.greyscale() // set greyscale
					    .write('productImages/' + convfileName); // save
					});
					*/

    	}
  });
});
