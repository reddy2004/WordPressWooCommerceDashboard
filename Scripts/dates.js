
//var labelMaker =  require('./labelMakerWindows.js');

//labelMaker.convertPDFToImageRotated90deg(11111); 

var dl = require('../delhiveryWrapper.js');
dl.init(function(err) {
	dl.getDeliveryCharges(function(data) {
		console.log(data);
		console.log(data.results.length);
	});

});
