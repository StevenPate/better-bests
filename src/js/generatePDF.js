const PDFDocument = require('pdfkit');
const fs = require('fs');
const doc = new PDFDocument({
    bufferPages: true});

function generatePDF(regionLists) {
    const { region, listDate, associationAbbreviation, current } = regionLists;
    console.log(`Starting to build PDF for ${region} ${listDate}...`);
    const pdfPath = `./_site/${associationAbbreviation}`;
    
    doc.pipe(fs.createWriteStream(pdfPath + '.pdf'));
    doc
        .fontSize(10)
        .font('Times-Roman')
  
    const titleOptions = {
        lineBreak: false,
        ellipsis: true,
        width: 225,
        height:15,
    }

    current.forEach(list => {
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(list.listName, 30, 30)
        doc.text(list.listName, 315, 30)
        doc.font('Helvetica').fontSize(10);
        doc.text(`Added (${listDate})`, 30, 50)
        doc.text(`Dropped (${listDate})`, 315, 50);

        for (let i = 0; i < list.addedItems.length; i++) {
            if (i === 7) {
                doc.addPage();
            }
            let y = 75 + (i * 100);
            doc.image(list.addedItems[i].barcodeURL, 35, y + 10, {width:225})
            .text(list.addedItems[i].title, 50, y, titleOptions)
            .text(list.addedItems[i].author, 50, y + 10, titleOptions)
            doc.image(list.droppedItems[i].barcodeURL, 320, y + 10, {width:225})
            .text(list.droppedItems[i].title, 335, y, titleOptions)
            .text(list.droppedItems[i].author, 335, y + 10, titleOptions)
        }
        
        // if this is the last list, don't add a page break
        if (list !== current[current.length - 1]) {
            doc.addPage();
        }
        
        // doc.addPage()
    });

    // manually flush pages that have been buffered
    doc.flushPages();

    // Finalize PDF file
    doc.end();

    // region: 'Pacific Northwest Booksellers Association (PNBA)',
    // associationAbbreviation: 'PNBA',
    // current: [
    //     {
    //       listName: 'HARDCOVER FICTION',
    //       listItems: [Array],
    //       listISBNs: [Array],
    //       listType: 'a',
    //       addedItems: [Array],
    //       droppedItems: [Array]
    //     },

    // console.log(list)
    // const { addedItems, droppedItems, ...theRest } = regionLists.current;
    // console.log(`${JSON.stringify(theRest, null, 2)}`)
}

module.exports = generatePDF;