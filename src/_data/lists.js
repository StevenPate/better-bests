const aba = require("./aba.json");
const dayjs = require("dayjs");
const EleventyFetch = require("@11ty/eleventy-fetch");
const JsBarcode = require('jsbarcode');
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
                            height: 50,
                            displayValue: true,
                            textMargin: 0,
                            fontSize: 15,
                            margin: 20,
                        });
                        return `<img src="${canvas.toDataURL()}" />`;
                    };
                    let barcode = barCode(isbn);

                    entry = {
                        position,
                        title,
                        author,
                        publisher,
                        price,
                        isbn,
                        barcode
                    };

                    listItems.push(entry);
                }
                if (/^[A-Z]*$/.test(lines[j])) {
                    break;
                }
            }

            lists.push({
                listName: list,
                listItems,
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
        const currentListURL = `${aba.textFilePath}${currentDate}${region.regionSuffix}.txt`;
        const pastListURL = `${aba.textFilePath}${previousDateString(
            currentDate
        )}${region.regionSuffix}.txt`;
        regionLists.push({
            region: region.regionalAssociation,
            regionAbbreviation: region.regionSuffix,
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
