//Do the following here
//Take an invoice and delivery id
//take images and put them in a single sheet.
//If not make multiple sheets.

const path = require('path');
const pdf = require('pdf-poppler');

let file1 = '../invoices/16159.pdf';
let file2 = '../labels/16159.pdf';


let opts1 = {
    format: 'jpeg',
    out_dir: "../RTP",
    out_prefix: "i" + path.basename(file1, path.extname(file1)),
    page: null
}

let opts2 = {
    format: 'jpeg',
    out_dir: "../RTP",
    out_prefix: "d" + path.basename(file2, path.extname(file2)),
    page: null
}

pdf.convert(file1, opts1)
    .then(res => {
        console.log('Successfully converted');
    })
    .catch(error => {
        console.error(error);
    })

pdf.convert(file2, opts2)
    .then(res => {
        console.log('Successfully converted');
    })
    .catch(error => {
        console.error(error);
    })