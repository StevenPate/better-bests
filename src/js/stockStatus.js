const EleventyFetch = require("@11ty/eleventy-fetch");
const cheerio = require("cheerio");

const getData = async (isbn) => {
    // console.log(`isbn for checking stock: ${isbn}`);
    let pbnURL = `https://www.portbooknews.com/book/${isbn}`;
    try {
        let pbnData = await EleventyFetch(pbnURL, {
            duration: "1d",
            directory: "_cache",
            type: "text",
        });
        const pbnHTML = cheerio.load(pbnData);
        // console.log(`isbn: ${isbn}`);
        // console.log(`pbnURL: ${pbnURL}`);
        const abaproductStatus = 
            pbnHTML("div.abaproduct-status")
                .contents()
                .text();
        // console.log(`abaproductStatus: ${abaproductStatus}`);
        if (abaproductStatus === "") {
            return {
                lsiQuantity: "0",
                lsiTime: ""
            }
        }
        // console.log(`abaproductStatus: ${abaproductStatus}`);
        // abaproduct-status
        const lsiQuantity = (abaproductStatus === "Usually Ships in 1-5 Days" || abaproductStatus == (undefined || null) ) ? '0' :
            pbnHTML("span.abaproduct-lsi-quantity")
                .contents()
                .text()
                .match(/\d+/)[0];
        // console.log(`lsiQuantity: ${lsiQuantity}`);
        const lsiTime = (abaproductStatus === "Usually Ships in 1-5 Days" || abaproductStatus == (undefined || null) ) ? '' : 
            pbnHTML("span.abaproduct-lsi-timestamp")
                .contents()
                .text();
        // console.log(`lsiTime: ${lsiTime}`);
        const html = `(<a href="https://www.portbooknews.com/book/${isbn}" data-tooltip="${lsiTime}">${lsiQuantity} on hand</a>)`
        return {
            html,
            lsiTime
        };
        // return `(<a href="https://www.portbooknews.com/book/${isbn}" name="here's a name"  data-tooltip="${lsiTime}">${lsiQuantity} on hand</a>)`;

    }
    catch (e) {
        console.log(e);
    }
    
};


// getData('9780063251922');
// module.exports = getData;
module.exports = async function (regionLists) {
    // console.log(regionLists.length);
    // console.log(`listItems: ${JSON.stringify(listItems, null, 2)}`);
    for ( let i = 0; i < regionLists.length; i++ ) {
        // console.log(`here's a regionList: ${regionLists[i].listName}`);
        for ( let j = 0; j < regionLists[i].listItems.length; j++ ) {
            // console.log(`here's a list item: ${regionLists[i].listItems[j].title}`);
            const isbn = regionLists[i].listItems[j].isbn;
            // console.log(`isbn: ${isbn}`);
            const stockStatus = await getData(isbn);
            // console.log(`stockStatus for ${isbn}: ${JSON.stringify(stockStatus, null, 2)}`)
            regionLists[i].listItems[j].stockStatus = stockStatus.html;
            regionLists[i].lsiTime = stockStatus.lsiTime;
            // console.log(`regionLists p[i]: ${JSON.stringify(regionLists[i], null, 2)}`);
        }
    }
    return regionLists;
};

