const { window } = require("page-evaluate");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));


const watch = async (fileURI) => {
    const { document } = await window(fileURI);
    const result = document.querySelector("#node-111 ").textContent;
    // console.log("result: ", result);
    
    // find string in result that ends with "pn.txt"
    const regex = /.*pn.txt/g;
    const match = result.match(regex);
    // if string begins with "\t" remove it
    if (match[0].startsWith("\t")) {
        match[0] = match[0].replace("\t", "");
    }
    // console.log("match: ", match);

    // for each url in match, fetch the url and save the content to a file
    for (let i = 0; i < match.length; i++) {
        const url = match[i];
        // console.log("url: ", url);
        const dateString = match[i].slice(-12, -6);
        const date = "20" + dateString.slice(0, 2) + "-" + dateString.slice(2, 4) + "-" + dateString.slice(4, 6);
        // console.log("date: ", date);
        const response = await fetch(url);
        const text = await response.text();
        // console.log("text: ", text);
        var lines = text.split('\n');
        lines.splice(0, 5);
        // console.log("lines: ", lines);
        return {date, lines};

    }

}

 parse = (lists) => {
    // return `Date: ${lists.date}`;
    console.log("lists: ", lists.lines);
}


module.exports.watch = watch;
module.exports.parse = parse;
// .watch = watch('https://www.bookweb.org/print/111');

