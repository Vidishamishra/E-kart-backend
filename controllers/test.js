const pdf2html = require('pdf2html')
 
console.log("--------------------------------------------------");

pdf2html.html('sample.pdf', (err, html) => {
    if (err) {
        console.error('Conversion error: ' + err)
    } else {
        console.log(html)
    }
});

console.log("isdie test gfile ======")