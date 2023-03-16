const {watch, parse}  = require("./watch");

getLists = async () => {

    const listsAsObjects = await watch('https://www.bookweb.org/print/111');
    const lists = parse(listsAsObjects);
    
    console.log(JSON.stringify(lists, null, 2));
}
getLists();

// console.log("listsAsText: ", listsAsText);