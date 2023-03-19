const { window } = require("page-evaluate");
const fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));

const watch = async (fileURI) => {
    const { document } = await window(fileURI);
    const result = document.querySelector("#node-111 ").textContent;

    // todo might change this to grab ALL the lists?
    const regex = /.*pn.txt/g;
    const region = 'PNBA';
    const match = result.match(regex);
    // const match = ['https://www.bookweb.org/sites/default/files/regional_bestseller/230308pn.txt']

    for (let i = 0; i < match.length; i++) {
        let url = match[i].startsWith("\t")
            ? match[i].replace("\t", "")
            : match[i];
        const dateString = match[i].slice(-12, -6);
        const date =
            "20" +
            dateString.slice(0, 2) +
            "-" +
            dateString.slice(2, 4) +
            "-" +
            dateString.slice(4, 6);
        const response = await fetch(url);
        const text = await response.text();

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
            let thisLine = lines[i].replace(/[\W_]/g, "");
            if (/^[A-Z]*$/.test(thisLine)) {
                let list = lines[i];
                let listItems = [];
                for (let j = i + 1; j < lines.length; j++) {
                    let entry;
                    let nextLine = lines[j + 1]
                        ? lines[j + 1].replace(/[\W_]/g, "")
                        : "";
                    if (
                        lines[j + 1] === undefined ||
                        lines[j + 1] === "" ||
                        /^[A-Z]*$/.test(nextLine)
                    ) {
                        break;
                    }

                    if (/^[0-9]/.test(lines[j])) {
                        let entryParts = [];
                        if (lines[j].slice(0, 4).includes(".")) {
                            entryParts.push(...lines[j].split(". "));
                        }
                        if (lines[j + 1] && !/^[0-9]/.test(lines[j + 1])) {
                            let laterLine = lines[j + 2]
                                ? lines[j + 2].replace(/[\W_]/g, "")
                                : "";
                            if (
                                lines[j + 2] &&
                                !/^[0-9]/.test(lines[j + 2]) &&
                                !/^[A-Z]*$/.test(laterLine)
                            ) {
      
                                entryParts[1] =
                                    entryParts[1] + ", " + lines[j + 1];
                                // console.log("entryParts[1]: ", entryParts[1]);
                                entryParts.push(...lines[j + 2].split(", "));
                            } else {
                                entryParts.push(...lines[j + 1].split(", "));
                            }
                        }
                        let position = entryParts[0];
                        let title = entryParts[1];
                        let author =
                            entryParts.length > 6
                                ? entryParts
                                      .slice(2, entryParts.length - 3)
                                      .join(", ")
                                : entryParts[2];
                        let publisher = entryParts[entryParts.length - 3];
                        let price = entryParts[entryParts.length - 2];
                        let isbn = entryParts[entryParts.length - 1];

                        entry = {
                            position,
                            title,
                            author,
                            publisher,
                            price,
                            isbn,
                        };

                        listItems.push(entry);
                    }
                    if (/^[A-Z]*$/.test(lines[j])) {
                        break;
                    }
                }

                lists.push({
                    listName: list,
                    listItems,
                });
            }
        }

        return { region, date, lists };
    }
};

module.exports.watch = watch;
