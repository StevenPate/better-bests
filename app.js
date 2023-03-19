const config = require('./config');
const {watch}  = require("./watch");
const fs = require('fs');

getLists = async () => {
    const allLists = await watch(config.sourceURL);
    let data = JSON.stringify(allLists.lists, null, 2);
    if (!fs.existsSync(`src/data/${allLists.region}`)){
        fs.mkdirSync(`src/data/${allLists.region}`);
    }
    fs.writeFileSync(`src/data/${allLists.region}/${allLists.date}.json`, data, err => {
        if (err) {
            console.error(err);
        }
    });
        
}
getLists();
