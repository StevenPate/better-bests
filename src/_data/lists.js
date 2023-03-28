const aba = require("./aba.json");
const dayjs = require("dayjs");
const EleventyFetch = require("@11ty/eleventy-fetch");
const Image = require("@11ty/eleventy-img");
const JsBarcode = require('jsbarcode');
const { createCanvas } = require("canvas");
const canvas = createCanvas();

previousDateString = (dateString) =>
    dayjs(dateString.replace(/(\d{2})(\d{2})(\d{2})/, "20$1-$2-$3"))
        .subtract(1, "week")
        .format("YYMMDD");

// getImage = async (isbn) => {
//     // console.log(`starting getImage for ${isbn}`);
//     let ISBNdbURL = `https://api2.isbndb.com/book/${isbn}`;
//     // let ISBNdbURL = `https://api2.isbndb.com/book/9780593329993`;
//     try {
//         let ISBNdb = await EleventyFetch(ISBNdbURL, {
//             duration: "10d",
//             directory: "_cache",
//             type: "json",
//             fetchOptions: {
//                 headers: {
//                     Host: "api2.isbndb.com",
//                     "User-Agent": "insomnia/5.12.4",
//                     Authorization: "48565_c9d95611e5493d3ce2ac9af517dcac2a",
//                     Accept: "*/*",
//                     "Content-Type": "application/json",
//                 },
//             },
//         });
//         // return ISBNdb.book.image;
//         const bookImage = ISBNdb.book.image;
//         return bookImage;
//     } catch (error) {
//         console.log(error);
//         return "https://via.placeholder.com/150";
//     }
// }
        
parseListTxts = (text) => {

    let lines = text.split("\n");
    lines.splice(0, 5);
    lines = lines
        .map((line) => line.replace("\r", ""))
        .map((line) => line.replace(/\s+$/, ""))
        .filter((line) => line !== "");

    let lists = [];
    for (let i = 0; i < lines.length; i++) {
        if (/^[0-9]/.test(lines[i])) {
            if (!/^[0-9]/.test(lines[i + 1])) {
                break;
            }
            if (!/[A-Z]*$/.test(lines[i + 1])) {
                break;
            }
            lines[i] = lines[i] + ", " + lines[i + 1];
            lines.splice(i + 1, 1);
        }
    }

    for (let i = 0; i < lines.length; i++) {
        let thisLine = lines[i].replace(/[\W_]/g, "");
        if (/^[A-Z]*$/.test(thisLine)) {
            let list = lines[i];
            let listItems = [];
            let listISBNs = [];
            for (let j = i + 1; j < lines.length; j++) {
                let entry;
                let nextLine = lines[j + 1]
                    ? lines[j + 1].replace(/[\W_]/g, "")
                    : "";
                if (
                    lines[j + 1] === undefined ||
                    lines[j + 1] === "" ||
                    /^[A-Z]*$/.test(nextLine)
                ) {
                    break;
                }

                if (/^[0-9]/.test(lines[j])) {
                    let entryParts = [];
                    if (lines[j].slice(0, 4).includes(".")) {
                        entryParts.push(...lines[j].split(". "));
                    }
                    if (lines[j + 1] && !/^[0-9]/.test(lines[j + 1])) {
                        let laterLine = lines[j + 2]
                            ? lines[j + 2].replace(/[\W_]/g, "")
                            : "";
                        if (
                            lines[j + 2] &&
                            !/^[0-9]/.test(lines[j + 2]) &&
                            !/^[A-Z]*$/.test(laterLine)
                        ) {
  
                            entryParts[1] =
                                entryParts[1] + ", " + lines[j + 1];
                            entryParts.push(...lines[j + 2].split(", "));
                        } else {
                            entryParts.push(...lines[j + 1].split(", "));
                        }
                    }
                    let position = entryParts[0];
                    let title = entryParts[1];
                    let author =
                        entryParts.length > 6
                            ? entryParts
                                  .slice(2, entryParts.length - 3)
                                  .join(", ")
                            : entryParts[2];
                    let publisher = entryParts[entryParts.length - 3];
                    let price = entryParts[entryParts.length - 2];
                    let isbn = entryParts[entryParts.length - 1];

                    if (title.length > 50) {
                        title = title.slice(0, 50) + "...";
                    }
                    // if (!isbn || isbn.length < 10 || isbn.length > 13 || isbn === "") {
                    //     console.log(lines[j]);
                    //     console.log("ISBN is not valid: ", isbn, list, position, title);
                        
                    //     // isbn = "0000000000000";
                    // }

                    const barCode = (isbn) => {
                        JsBarcode(canvas, isbn, {
                            format: "EAN13",
                            lineColor: "#000",
                            width: 2,
                            height: 40,
                            displayValue: true,
                            textMargin: 0,
                            fontSize: 15,
                            margin: 16,
                        });
                        return `<img src="${canvas.toDataURL()}" style="max-width:120%;" />`;
                    };
                    let barcode = barCode(isbn);

                    // let cover = await getImage(isbn);

                    entry = {
                        position,
                        title,
                        author,
                        publisher,
                        price,
                        isbn,
                        barcode,
                        coverImage: `https://images-us.bookshop.org/ingram/${isbn}.jpg?height=500&v=v2`
                    };

                    listItems.push(entry);
                    listISBNs.push(isbn);
                }
                if (/^[A-Z]*$/.test(lines[j])) {
                    break;
                }
            }

            lists.push({
                listName: list,
                listItems,
                listISBNs,
            });
        }
    }

    return lists;

};

module.exports = async function () {
    const allCurrentLists = await EleventyFetch(aba.listsPageURL, {
        duration: "1d", // save for 1 day
        type: "text",
    });

    let regionLists = [];

    aba.regions.forEach((region) => {
        const regionRegex = new RegExp(`.*${region.regionSuffix}.txt`, "g");
        const currentDate = allCurrentLists
            .match(regionRegex)[0]
            .slice(-12, -6);
        const postDate = dayjs("20" + currentDate, "YYYYMMDD").format("MM-DD-YYYY");
        const listDate = dayjs("20" + currentDate, "YYYYMMDD").subtract(3, 'day').format("MM-DD-YYYY");
        const currentListURL = `${aba.textFilePath}${currentDate}${region.regionSuffix}.txt`;
        const pastListURL = `${aba.textFilePath}${previousDateString(
            currentDate
        )}${region.regionSuffix}.txt`;
        regionLists.push({
            region: region.regionalAssociation,
            regionAbbreviation: region.regionSuffix,
            listDate,
            currentListURL,
            pastListURL,
        });
    });

    await Promise.all(
        regionLists.map(async (regionList) => {
            currentText = await EleventyFetch(
                regionList.currentListURL,
                {
                    duration: "1d", // save for 1 day
                    type: "text",
                }
            );
            // console.log(regionList);
            regionList.current = parseListTxts(currentText);
            pastText = await EleventyFetch(
                regionList.pastListURL, 
                {
                    duration: "1d", // save for 1 day
                    type: "text",
                }
            );
            regionList.past = parseListTxts(pastText);

            regionList.current.forEach((currentList) => {
                currentList.addedItems = [];
                currentList.droppedItems = [];
                let pastList = regionList.past.find(
                    (pastList) => pastList.listName === currentList.listName
                );
                if (pastList) {
                    currentList.listItems.forEach((currentListItem) => {
                        if (
                            !pastList.listItems.find(
                                (pastListItem) =>
                                    pastListItem.isbn ==
                                    currentListItem.isbn
                            )
                        ) {
                            currentList.addedItems.push(
                                currentListItem
                            );
                        }
                    });
                    pastList.listItems.forEach((pastListItem) => {
                        if (
                            !currentList.listItems.find(
                                (currentListItem) =>
                                    currentListItem.isbn ==
                                    pastListItem.isbn
                            )
                        ) {
                            currentList.droppedItems.push(
                                pastListItem
                            );

                        }

                    }
                    );
                }
            });
            

        })
    );
    return regionLists;
};
