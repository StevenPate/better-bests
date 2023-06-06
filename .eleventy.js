module.exports = function (eleventyConfig) {
    eleventyConfig.addCollection("rawISBNs", (collection) => {
        let bsa = [];
        let bsc = [];
        // todo: get all regions, make object with two keys, one for each listType
        collection.getAll()[0].data.lists[0].current.filter((item) => {
            if (item.listType === "a") {
                bsa.push(...item.listISBNs);
            }
            if (item.listType === "c") {
                bsc.push(...item.listISBNs);
            }
        });
        // console.log(bsa, bsc);
        return {bsa, bsc};
    });
    eleventyConfig.addFilter('fromJson', JSON.parse);
    eleventyConfig.addFilter('toJson', JSON.stringify);
    eleventyConfig.addPassthroughCopy("src/static");
    return {
        dir: {
            input: "src",
            includes: "_includes",
            layouts: "_includes/layouts",
            data: "_data",
            output: "_site",
        },
    };
};
