const aba = require("./aba.json");
const generatePDF = require("../js/generatePDF.js");
const stockStatus = require("../js/stockStatus.js");
const dayjs = require("dayjs");
const EleventyFetch = require("@11ty/eleventy-fetch");
// const Image = require("@11ty/eleventy-img");
const JsBarcode = require("jsbarcode");
const { createCanvas } = require("canvas");
const canvas = createCanvas();

previousDateString = (dateString) =>
    dayjs(dateString.replace(/(\d{2})(\d{2})(\d{2})/, "20$1-$2-$3"))
        .subtract(1, "week")
        .format("YYMMDD");

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
                            entryParts[1] = entryParts[1] + ", " + lines[j + 1];
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
                            textPosition: "bottom",
                            margin: 16,
                            flat: true
                        });
                        return canvas.toDataURL();
                    };
                    let barcode = `<img src="${barCode(isbn)}" style="max-width:120%;" />`;
                    let barcodeURL = barCode(isbn);

                    entry = {
                        position,
                        title,
                        author,
                        publisher,
                        price,
                        isbn,
                        // inventoryInfo,
                        barcode,
                        barcodeURL,
                        coverImage: `https://images-us.bookshop.org/ingram/${isbn}.jpg?height=500&v=v2`,
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
    // console.log(`allCurrentLists`);

    let regionLists = [];

    // console.log(aba.regions)
    aba.regions.forEach((region) => {
        const regionRegex = new RegExp(`.*${region.regionSuffix}.txt`, "g");
        const currentDate = allCurrentLists
            .match(regionRegex)[0]
            .slice(-12, -6);
        const previousDate = previousDateString(currentDate);
        // const postDate = dayjs("20" + currentDate, "YYYYMMDD").format(
        //     "MM-DD-YYYY"
        // );
        const listDate = dayjs("20" + currentDate, "YYYYMMDD")
            .subtract(3, "day")
            .format("MM-DD-YYYY");
        const currentListURL = `${aba.textFilePath}${currentDate}${region.regionSuffix}.txt`;
        const pastListURL = `${aba.textFilePath}${previousDate}${region.regionSuffix}.txt`;
        regionLists.push({
            region: region.regionalAssociation,
            associationAbbreviation: region.regionalAssociationAbbreviation,
            regionAbbreviation: region.regionSuffix,
            listDate,
            currentListURL,
            pastListURL,
        });
    });
    // console.log(`regionLists: ${JSON.stringify(regionLists, null, 2)}`)


    await Promise.all(
        regionLists.map(async (regionList) => {
            // console.log(regionList.currentListURL);
            currentText = await EleventyFetch(regionList.currentListURL, {
                duration: "1d", // save for 1 day
                type: "text",
            });
            regionList.current = parseListTxts(currentText);
            pastText = await EleventyFetch(regionList.pastListURL, {
                duration: "1d", // save for 1 day
                type: "text",
            });
            regionList.past = parseListTxts(pastText);
            // console.log(regionList.currentListURL);
            // console.log(regionList.past.length);

            regionList.current = await stockStatus(regionList.current);

            regionList.current.forEach((currentList) => {
                currentList.listType = (currentList.listName === "CHILDREN'S ILLUSTRATED" || currentList.listName === "EARLY & MIDDLE GRADE READERS" | currentList.listName === "YOUNG ADULT" | currentList.listName === "CHILDREN'S SERIES TITLES") 
                    ? "c"
                    : "a";
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
                                    pastListItem.isbn == currentListItem.isbn
                            )
                        ) {
                            currentList.addedItems.push(currentListItem);
                        } else {
                            let pastListItem = pastList.listItems.find(
                                (pastListItem) =>
                                    pastListItem.isbn == currentListItem.isbn
                            );
                            if (
                                pastListItem.position !==
                                currentListItem.position
                            ) {
                                currentListItem.moved = true;
                            }
                            // get difference in position
                            currentListItem.positionDifference =
                                pastListItem.position -
                                currentListItem.position;

                            // console.log(currentListItem.title, pastListItem.position, currentListItem.position, currentListItem.positionDifference);
                        }
                        currentListItem.positionDifference =
                        currentListItem.positionDifference === undefined
                            ? `<span class="is-blue">*</span>`
                            : currentListItem.positionDifference === 0
                                ? "="
                                : currentListItem.positionDifference > 0
                                ? `<span class="is-green">↑ ${currentListItem.positionDifference}</span>`
                                : `<span class="is-red">↓ ${Math.abs(currentListItem.positionDifference)}</span>`;
                        
                        
                    });
                    pastList.listItems.forEach((pastListItem) => {
                        if (
                            !currentList.listItems.find(
                                (currentListItem) =>
                                    currentListItem.isbn == pastListItem.isbn
                            )
                        ) {
                            currentList.droppedItems.push(pastListItem);
                        }
                    });
                }
            });
            regionList.lsiTime = (regionList.current[0].listItems[0].stockStatus) 
                ? regionList.current[0].listItems[0].stockStatus.lsiTime
                : "No LSI Time";
            console.log(`regionList.lsiTime: ${regionList.lsiTime}`);

            // TODO move generatePDF to here
        })
    );

    // for each item in regionLists create a forPrint object
    regionLists.forEach((regionList) => {
        // console.log(regionList);
        generatePDF(regionList);
    });


    // console.log(regionLists[0]);


    // for each item in regionLists,
    //     for each list in current
    //         send an object to pdfOutput script 
    //     name the outputfile regionList.pdf

    // console.log(JSON.stringify(regionLists, null, 2));
    return regionLists;
};
