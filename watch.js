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
                let listName = lines[i];
                let listItems = [];
                for (let j = i + 1; j < lines.length; j++) {
                    // if the next line starts wwith a number
                    if (/^[0-9]/.test(lines[j])) {
                        let currentLine = lines[j].replace(/[\W_]/g, "");
                        if (
                            !/^[0-9]/.test(lines[j + 1]) 
                            // &&
                            // /^[A-Z]*$/.test(currentLine)
                        ) {
                            lines[j] = lines[j] + ", " + lines[j + 1];
                            lines.splice(j + 1, 1);
                        }
                    }
                    listItems.push(lines[j]);
                    if (!/^[0-9]/.test(lines[j])) {
                        break;
                    }
                }
                console.log("listName: ", listName);
                console.log("listItems: ", listItems);
            }

            // let thisLine = lines[i].replace(/[\W_]/g, "");
            // thisLine = thisLine.trim();
            // console.log("thisLine: ", thisLine);
            // if (/[\W_]/.test[thisLine]) {
            //     console.log ("all CAPS?: ", thisLine);
            // }
        }
        //     if (/^[0-9]/.test(lines[i])) {

        // if (!/^[0-9]/.test(lines[i]) && /^[0-9]/.test(lines[i - 1])) {
        //     lines[i - 1] = lines[i - 1] + ", " + lines[i];
        //     lines.splice(i, 1);
        // }

        // for (let i = 0; i < lines.length; i++) {
        //     if (!/^[0-9]/.test(lines[i])) {
        //         listName = lines[i];
        //         console.log("listName: ", listName);
        //         // console.log("lines[i]: ", lines[i]);
        //         // delete lines[i]
        //         lines.splice(i, 1);
        //         listItems = [];
        //         for (let j = 0; j < lines.length; i++) {
        //             if (/^[0-9]/.test(lines[j])) {
        //                 listItems.push(lines[j]);
        //                 lines.splice(j, 1);
        //             }
        //             if (!/^[0-9]/.test(lines[i])) {
        //                 break;
        //             }
        //         }
        //         // console.log("listItems: ", listItems);

        //         //

        //         // let listItems = [];
        //         // let j = lines[i + 1];
        //         // console.log("j: ", j);
        //         // while (j < lines.length && !/^[0-9]/.test(lines[j])) {
        //         //     listItems.push(lines[j]);
        //         //     j++;
        //         // }
        //         // console.log("listItems: ", listItems);
        //     }
        // }

        // console.log("lines: ", lines);
        return { date, lines };
    }
};

parse = (lists) => {
    // console.log("lists: ", lists.lines);
};

module.exports.watch = watch;
module.exports.parse = parse;
