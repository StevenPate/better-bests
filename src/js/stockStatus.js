const EleventyFetch = require("@11ty/eleventy-fetch");
const cheerio = require("cheerio");

const getData = async (isbn) => {
    let pbnURL = `https://www.portbooknews.com/book/${isbn}`;
    try {
        let pbnData = await EleventyFetch(pbnURL, {
            duration: "1d",
            directory: "_cache",
            type: "text",
        });
        const pbnHTML = cheerio.load(pbnData);
        const abaproductStatus = 
            pbnHTML("div.abaproduct-status")
                .contents()
                .text();
        if (abaproductStatus === "") {
            return {
                lsiQuantity: "0",
                lsiTime: ""
            }
        }
        const lsiQuantity = (abaproductStatus === "Usually Ships in 1-5 Days" || abaproductStatus == (undefined || null) ) ? '0' :
            pbnHTML("span.abaproduct-lsi-quantity")
                .contents()
                .text()
                .match(/\d+/)[0];
        const lsiTime = (abaproductStatus === "Usually Ships in 1-5 Days" || abaproductStatus == (undefined || null) ) ? '' : 
            pbnHTML("span.abaproduct-lsi-timestamp")
                .contents()
                .text();
        const html = `<a href="https://www.portbooknews.com/book/${isbn}" data-tooltip="${lsiTime}" class="has-text-info has-background-info-light">${lsiQuantity} on hand</a>`
        return {
            lsiQuantity,
            html,
            lsiTime
        };
    }
    catch (e) {
        console.log(e);
    }
    
};


module.exports = async function (regionLists) {
    // console.log(`regionLists: ${JSON.stringify(regionLists, null, 2)}`);
    for ( let i = 0; i < regionLists.length; i++ ) {
        for ( let j = 0; j < regionLists[i].listItems.length; j++ ) {
            const isbn = regionLists[i].listItems[j].isbn;
             const stockStatus = await getData(isbn);
            // console.log(`stockStatus: ${JSON.stringify(stockStatus)}`);
            regionLists[i].listItems[j].stockStatus = stockStatus.html;
            regionLists[i].listItems[j].lsiTime = stockStatus.lsiTime;
            regionLists[i].listItems[j].lsiQuantity = stockStatus.lsiQuantity;
        }
        regionLists[i].lsiTime = regionLists[i]?.listItems[0]?.lsiTime || "";
    }
    // console.log(`regionLists[0].listITems[0].lsiTime: ${JSON.stringify(regionLists[0]?.listItems[0]?.lsiTime, null, 2)}`);
    // regionLists.lsiTime = regionLists[0].lsiTime;
    return regionLists;
};
 
