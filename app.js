const {watch, parse}  = require("./watch");

getLists = async () => {

    const listsAsObjects = await watch('https://www.bookweb.org/print/111');
    const allLists = parse(listsAsObjects);
    
    // console.log(JSON.stringify(allLists, null, 2));
    // console.log(allLists)
    // for each list in allLists.lists, get the list name and the list items
    for (let i = 0; i < allLists.lists.length; i++) {
        console.log(JSON.stringify(allLists.lists[i], null, 2));
        // console.log(allLists.lists[i].name);
        // console.log(allLists.lists[i]);
        allLists.lists[i].isbns = [];
        for (let j = 0; j < allLists.lists[i].listItems.length; j++) {
            allLists.lists[i].isbns.push(allLists.lists[i].listItems[j].isbn);
        }
        console.log(allLists.lists[i].isbns);

    }



        
}
getLists();
