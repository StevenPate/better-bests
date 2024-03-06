const PDFDocument = require('pdfkit');
const fs = require('fs');
const barCode = require('./barCode');

function generatePDF(regionLists) {
    const doc = new PDFDocument({
        bufferPages: true
    });

    const { region, listDate, associationAbbreviation, current } = regionLists;
    const pdfPath = `./_site/${associationAbbreviation}`;
    const titleOptions = {
        lineBreak: false,
        ellipsis: true,
        width: 180,
        height: 15,
    }

    // console.log(`Starting to build PDF for ${region} ${listDate}...`);
    doc.pipe(fs.createWriteStream(pdfPath + '.pdf'));
    doc
        .fontSize(10)
        .font('Times-Roman')
    current.forEach(list => {
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(list.listName, 30, 30)
        doc.font('Helvetica').fontSize(10);
        doc.text(`Current ${region} list, (${listDate})`, 30, 42)
        for (let i = 0; i < list.listItems.length; i++) {
            let x = (i > 7) ? 350 : 60;
            let y = 60 + ((i > 7) ? (i - 8) * 90 : i * 90);
            doc
                .image(barCode(list.listItems[i].isbn), x - 15, y + 10, { width: 190 })
                .text(list.listItems[i].title, x, y, titleOptions)
                .text(`${list.listItems[i].author} (${list.listItems[i].lsiQuantity})`, x, y + 10, titleOptions)
            if (list.listItems[i].added) {
                doc.image("src/assets/plus.png", x - 30, y, { width: 20 })
            }
        }
        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(list.listName, 30, 30)
        doc.font('Helvetica').fontSize(10);
        doc.text(`Items removed for the week of (${listDate})`, 30, 42)
        for (let i = 0; i < list.droppedItems.length; i++) {
            let x = (i > 7) ? 350 : 60;
            let y = 60 + ((i > 7) ? (i - 8) * 90 : i * 90);
            doc
                .image(barCode(list.droppedItems[i].isbn), x - 15, y + 10, { width: 190 })
                .text(list.droppedItems[i].title, x, y, titleOptions)
                .text(`${list.droppedItems[i].author} (${list.droppedItems[i].lsiQuantity})`, x, y + 10, titleOptions)
                .image("src/assets/minus.png", x + 180, y, { width: 20 })
        }
        // if this is the last list, don't add a page break
        if (list !== current[current.length - 1]) {
            doc.addPage();
        }
    });

    doc.flushPages();

    // Finalize PDF file
    doc.end();
}

module.exports = generatePDF;