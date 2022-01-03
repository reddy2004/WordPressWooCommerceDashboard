var Jimp = require('jimp');
const fs = require('fs');

fs.readdir('../productImages', (err, files) => {
  files.forEach(file => {
    	var isJPGFile = (file.indexOf('.jpg') == (file.length - 4) || file.indexOf('.jpeg') == (file.length - 5))? true : false;
    	var isPNGFile = (file.indexOf('.png') == (file.length - 4))? true : false;

	    if (isJPGFile) {
	    		//convert jpg to png file in product images
	    		var convfileName = file.substr(0, file.indexOf('.')) + ".png";
	    		console.log(convfileName);
	    		
					Jimp.read('../productImages/' + file, (err, lenna) => {
					  if (err) throw err;
					  lenna
					    //.resize(256, 256) // resize
					    .quality(100) // set JPEG quality
					    //.greyscale() // set greyscale
					    .write('../productImages/' + convfileName); // save
					});
					
					//now again convert the jpg to png preview
					Jimp.read('../productImages/' + file, (err, lenna) => {
					  if (err) throw err;
					  lenna
					    .resize(256, 256) // resize
					    .quality(100) // set JPEG quality
					    //.greyscale() // set greyscale
					    .write('../productImagesPreview/' + convfileName); // save
					});

    	} else if (isPNGFile) {
    		//we have a png file, convert to png preview
    		console.log(file);
					Jimp.read('../productImages/' + file, (err, lenna) => {
					  if (err) console.log( err);
					  else {
						  lenna
						    .resize(256, 256) // resize
						    .quality(100) // set JPEG quality
						    //.greyscale() // set greyscale
						    .write('../productImagesPreview/' + file); // save
					  }
					});
					 		
    	}
  });
});
