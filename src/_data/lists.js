const aba = require("./aba.json");
const dayjs = require("dayjs");
const EleventyFetch = require("@11ty/eleventy-fetch");

previousDateString = (dateString) =>
    dayjs(dateString.replace(/(\d{2})(\d{2})(\d{2})/, "20$1-$2-$3"))
        .subtract(1, "week")
        .format("YYMMDD");

module.exports = async function () {

    const allCurrentLists = await EleventyFetch(aba.listsPageURL, {
        duration: "1d", // save for 1 day
        type: "text",
    });

    aba.regions.forEach(region => {
        const regionRegex = new RegExp(`.*${region.regionSuffix}.txt`, "g");
        const currentDate = allCurrentLists.match(regionRegex)[0].slice(-12, -6);
        const currentListURL = `${aba.textFilePath}${currentDate}${region.regionSuffix}.txt`;
        const pastListURL = `${aba.textFilePath}${previousDateString(currentDate)}${region.regionSuffix}.txt`;
        console.log("currentListURL: ", currentListURL);
        console.log("pastListURL: ", pastListURL);
        
    });




    // const regionalAssociation = "PNBA";
    // const regionSuffix = "pn";
    // const regionRegex = /.*pn.txt/g;
    // const currentListURL = `${aba.textFilePath}${currentDate}${regionSuffix}.txt`;
    // const pastListURL = `${aba.textFilePath}${pastDate}${regionSuffix}.txt`;
    // console.log("currentListURL: ", currentListURL);
    // console.log("pastListURL: ", pastListURL);
    // const current = await fetch(currentListURL);
    // const text = await current.text();

    return "hi";

    /* This returns a promise */
    // return EleventyFetch(url, {
    //     duration: "1d", // save for 1 day
    //     type: "text"    // we’ll parse JSON for you
    // });
};

// const sampleDateString = "230315";
// const previous = previousDateString(sampleDateString);
// console.log('previous: ', previous);

// const sampleDateString = "230315";
// const date = formatDateString(sampleDateString);
// console.log('date: ', date);
// const previousDate = dayjs(date).subtract(1, 'week').format('YYMMDD');
// console.log('previousDate: ', previousDate);

// formatDateString = (dateString) => dateString.replace(/(\d{2})(\d{2})(\d{2})/, "20$1-$2-$3");
// // const sampleDateString = "230315";
// // const date = formatDateString(sampleDateString);
// // const date = formatDateString(sampleDateString);
// const date = dayjs(formatDateString(sampleDateString)).format('YYYY-MM-DD');
// console.log('date: ', date);

// const newDate = dayjs(date).format('YYYY-MM-DD')
// // const newDate = dayjs(date).format('L LT')
// console.log('newDate: ', newDate);
// // .subtract(7, 'year')
