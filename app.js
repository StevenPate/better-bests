const {watch, parse}  = require("./watch");

getLists = async () => {
    const listsAsText = await watch('https://www.bookweb.org/print/111');
    // console.log("listsAsText: ", listsAsText);
    const lists = parse(listsAsText);
    console.log("lists: ", lists);
}
getLists();

// console.log("listsAsText: ", listsAsText);