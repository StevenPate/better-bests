const aba = require("./aba.json");
const generatePDF = require("../js/generatePDF.js");
const stockStatus = require("../js/stockStatus.js");
const dayjs = require("dayjs");
const EleventyFetch = require("@11ty/eleventy-fetch");
// const Image = require("@11ty/eleventy-img");
// const JsBarcode = require("jsbarcode");
// const { createCanvas } = require("canvas");
// const canvas = createCanvas();

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
                    if (!isbn || isbn.length < 10 || isbn.length > 13 || isbn === "") {
                        // console.log(lines[j]);
                        console.log("ISBN is not valid: ", isbn, list, position, title);
                        // isbn = "0000000000000";
                        isbn = "";
                        break;
                        // return;
                    }


                    entry = {
                        position,
                        title,
                        author,
                        publisher,
                        price,
                        isbn,
                        // inventoryInfo,
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
    // console.log("🚀 ~ file: lists.js:137 ~ allCurrentLists:", allCurrentLists)
    // console.log(`allCurrentLists`);

    let regionLists = [];

    // console.log(aba.regions)
    aba.regions.forEach((region) => {
        const regionRegex = new RegExp(`.*${region.regionSuffix}.txt`, "g");
        const date = new Date()
            .toLocaleString("en-US", { timeZone: "US/Pacific" });

        // wrong date because of time zone

        const currentDate = dayjs(date, "YYYYMMDD")
            //     .subtract(1, "day") /////////////////////////////
            .format(
                "YYMMDD"
            );
        // const currentDate = "230920"

        const previousDate = previousDateString(currentDate);
        // const postDate = dayjs("20" + currentDate, "YYYYMMDD").format(
        //     "MM-DD-YYYY"
        // );
        const listDate = dayjs(currentDate)
            .subtract(3, "day")
            .format("YYMMDD");
        const currentListURL = `${aba.textFilePath}${currentDate}${region.regionSuffix}.txt`;
        const previousListURL = `${aba.textFilePath}${previousDate}${region.regionSuffix}.txt`;
        regionLists.push({
            region: region.regionalAssociation,
            associationAbbreviation: region.regionalAssociationAbbreviation,
            regionAbbreviation: region.regionSuffix,
            listDate,
            currentListURL,
            previousListURL,
        });
    });
    // console.log(`regionLists: ${JSON.stringify(regionLists, null, 2)}`)


    await Promise.all(
        regionLists.map(async (regionList) => {
            // console.log(regionList);

            console.log("🚀 ~ file: lists.js:179 ~ regionLists.map ~ regionList.currentListURL:", regionList.currentListURL)
            currentText = await EleventyFetch(regionList.currentListURL, {
                duration: "1d", // save for 1 day
                type: "text",
            });
            regionList.current = parseListTxts(currentText);
            previousText = await EleventyFetch(regionList.previousListURL, {
                duration: "1d", // save for 1 day
                type: "text",
            });
            regionList.past = parseListTxts(previousText);
            // console.log(regionList.currentListURL);
            // console.log(regionList.past.length);


            let uniqueItemsList = {
                listName: 'Unique Items to this Region',
                listItems: [],
                listISBNs: [],
                addedItems: [],
                droppedItems: [],
            }
            // console.log(`regionList.current.uniqueItems: ${JSON.stringify(regionList.current.uniqueItems, null, 2)}`)

            regionList.current.forEach((currentList) => {
                currentList.listType = (currentList.listName === "CHILDREN'S ILLUSTRATED" || currentList.listName === "EARLY & MIDDLE GRADE READERS" | currentList.listName === "YOUNG ADULT" | currentList.listName === "CHILDREN'S SERIES TITLES")
                    ? "c"
                    : "a";
                currentList.addedItems = [];
                currentList.droppedItems = [];
                currentList.uniqueItems = [];
                let previousList = regionList.past.find(
                    (previousList) => previousList.listName === currentList.listName
                );
                if (previousList) {
                    currentList.listItems.forEach((currentListItem) => {

                        // find positionDifference from previous list
                        if (
                            !previousList.listItems.find(
                                (previousListItem) =>
                                    previousListItem.isbn == currentListItem.isbn
                            )
                        ) {
                            currentListItem.added = true;
                            currentList.addedItems.push(currentListItem);
                        } else {
                            let previousListItem = previousList.listItems.find(
                                (previousListItem) =>
                                    previousListItem.isbn == currentListItem.isbn
                            );
                            if (
                                previousListItem.position !==
                                currentListItem.position
                            ) {
                                currentListItem.moved = true;
                            }
                            // get difference in position
                            currentListItem.positionDifference =
                                previousListItem.position -
                                currentListItem.position;

                            // console.log(currentListItem.title, previousListItem.position, currentListItem.position, currentListItem.positionDifference);
                        }

                        // indicate positionDifference with a symbol
                        currentListItem.positionDifference =
                            currentListItem.positionDifference === undefined
                                ? `<span class="is-blue">&star;</span>`
                                : currentListItem.positionDifference === 0
                                    ? "&harr;"
                                    : currentListItem.positionDifference > 0
                                        ? `<span class="is-green">&uarr; ${currentListItem.positionDifference}</span>`
                                        : `<span class="is-red">&darr; ${Math.abs(currentListItem.positionDifference)}</span>`;

                        // find this book in other lists
                        currentListItem.otherPositions = [];
                        regionLists.forEach((otherRegionList) => {
                            if (otherRegionList.region !== regionList.region) {
                                let otherList = otherRegionList?.current.find(
                                    (otherList) => otherList.listName === currentList.listName
                                );
                                if (otherList) {
                                    let otherListItem = otherList.listItems.find(
                                        (otherListItem) =>
                                            otherListItem.isbn == currentListItem.isbn
                                    );
                                    if (otherListItem) {
                                        currentListItem.otherPositions.push({
                                            region: otherRegionList.regionAbbreviation,
                                            item: otherListItem,
                                        });
                                    }
                                }
                            }
                        });

                        // currentListItem.uniqueItem = (currentListItem.otherPositions.length == 0) ? `<span alt="this book is not found on any other region's lists!"> ❄️ </span>` : "";   
                        if (currentListItem.otherPositions.length == 0) {
                            currentListItem.uniqueItem = `<span alt="this book is not found on any other region's lists!"> ❄️ </span>`
                            uniqueItemsList.listItems.push(currentListItem);
                        } else {
                            currentListItem.uniqueItem = "";
                        }
                    });
                    previousList.listItems.forEach((previousListItem) => {
                        if (
                            !currentList.listItems.find(
                                (currentListItem) =>
                                    currentListItem.isbn == previousListItem.isbn
                            )
                        ) {
                            currentList.droppedItems.push(previousListItem);
                        }
                    });
                    // console.log(`uniqueItemsList: ${JSON.stringify(uniqueItemsList, null, 2)}`)
                }
                // console.log(regionList.current)
            });
            regionList.current.push(uniqueItemsList);


            if (regionList.associationAbbreviation == "PNBA") {
                regionList.zeroStockItems = [];
                regionList.current = await stockStatus(regionList.current);
                regionList.lsiTime = regionList.current[0].lsiTime;
                regionList.current.forEach((currentList) => {
                    currentList.zeroStockItems = [];
                    currentList.listItems.forEach((currentListItem) => {
                        if (currentListItem.lsiQuantity === '0') {
                            currentListItem.listName = currentList.listName;
                            regionList.zeroStockItems.push(currentListItem);
                        }
                    }
                    );
                });
            }

            // console.log(uniqueItemsList)
            regionList.uniqueItemsList = uniqueItemsList;

            if (regionList?.current[0]?.listItems[0]?.lsiTime) {
                regionList.lsiTime = regionList.current[0].listItems[0].lsiTime;
            }

            generatePDF(regionList);

        })

    );

    return regionLists;
};
