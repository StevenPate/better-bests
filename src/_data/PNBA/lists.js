const current = require("./current.json");
const past = require("./past.json");
const JsBarcode = require('jsbarcode');
const { createCanvas } = require("canvas");
const canvas = createCanvas();

const barCode = (isbn) => {
    JsBarcode(canvas, isbn, {
        format: "EAN13",
        lineColor: "#000",
        width: 2,
        height: 50,
        displayValue: true,
        textMargin: 0,
        fontSize: 15,
        margin: 20,
    });
    return `<img src="${canvas.toDataURL()}" />`;
};

module.exports = function() {

    // for each list in current, console log the list name
    let listsWithChanges = [];
    current.forEach(list => {
        const pastList = past.find(pastList => pastList.listName === list.listName);

        const allBooks = list.listItems;
        let allISBNs = [];
        const pastBooks = pastList.listItems;
        let addedBooks = [];
        let droppedBooks = [];

        allBooks.forEach(item => {
            item.barcode = barCode(item.isbn);
            allISBNs.push(item.isbn);
            // console.log(item.isbn, item.title, item.author);
            if (!pastList.listItems.find(book => book.isbn === item.isbn)) {
                
                addedBooks.push(item);
            }
      
        });
        pastBooks.forEach(item => {
            item.barcode = barCode(item.isbn);
            // console.log(item.isbn, item.title, item.author);
            if (!allBooks.find(book => book.isbn === item.isbn)) {
                droppedBooks.push(item);
            }
      
        });

        // console.log('List = ', list.listName);
        // console.log('ALL BOOKS');
        // for (let i = 0; i < allBooks.length; i++) {
        //     console.log(allBooks[i].isbn, allBooks[i].title, allBooks[i].author);
        // }
        // console.log('ADDED BOOKS');
        // for (let i = 0; i < addedBooks.length; i++) {
        //     console.log(addedBooks[i].isbn, addedBooks[i].title, addedBooks[i].author);
        // }
        // console.log('DROPPED BOOKS');
        // for (let i = 0; i < droppedBooks.length; i++) {
        //     console.log(droppedBooks[i].isbn, droppedBooks[i].title, droppedBooks[i].author);
        // }
        // console.log(addedBooks);
        // console.log(allBooks.length, addedBooks.length, droppedBooks.length)
        if (addedBooks.length > 0 || droppedBooks.length > 0) {
            listsWithChanges.push({listName:list.listName, allBooks, allISBNs, addedBooks, droppedBooks});
        }

    });


    return listsWithChanges;
  };