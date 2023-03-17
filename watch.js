const { window } = require("page-evaluate");
const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
        const date =
            "20" +
            dateString.slice(0, 2) +
            "-" +
            dateString.slice(2, 4) +
            "-" +
            dateString.slice(4, 6);
        // console.log("date: ", date);
        const response = await fetch(url);
        const text = await response.text();
        // console.log("text: ", text);
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
            // create a variable that removes all non-alphanumeric characters
            let thisLine = lines[i].replace(/[\W_]/g, "");
            // if it's all caps, it's a list name
            if (/^[A-Z]*$/.test(thisLine)) {
                let list = lines[i];
                // add the items to the list
                let listItems = [];
                for (let j = i + 1; j < lines.length; j++) {
                    // if the line starts with a number
                    if (/^[0-9]/.test(lines[j])) {
                        if (lines[j].slice(0, 4).includes(".")) {
                            lines[j] = lines[j].replace(". ", "., ");
                        }

                        // let currentLine = lines[j].replace(/[\W_]/g, "");
                        if (
                            !/^[0-9]/.test(lines[j + 1])
                            // &&
                            // /^[A-Z]*$/.test(currentLine)
                        ) {
                            lines[j] = lines[j] + ", " + lines[j + 1];
                            lines.splice(j + 1, 1);
                        }
                    }

                    // add comma after period (for list poositions)
                    // if (/^[0-9]/.test(lines[j])) {
                    //     if (lines[j].slice(0, 4).includes(".")) {
                    //         lines[j] = lines[j].replace(". ", "., ");
                    //     }
                    // }

                    listItems.push(lines[j]);
                    if (!/^[0-9]/.test(lines[j])) {
                        break;
                    }
                }
                listItems = listItems.filter((item) => /^[0-9]/.test(item));

                // console.log("list: ", listName);
                // console.log("listItems: ", listItems);
                lists.push({
                    list,
                    listItems,
                });
            }
        }

        return { date, lists };
    }
};

parse = (listsToParse) => {
    return listsToParse;
    // console.log("lists: ", lists.lines);
};

module.exports.watch = watch;
module.exports.parse = parse;
