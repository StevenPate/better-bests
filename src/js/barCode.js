const JsBarcode = require("jsbarcode");
const { createCanvas } = require("canvas");
const canvas = createCanvas();
const barCode = (isbn) => {
    JsBarcode(canvas, isbn, {
        format: "EAN13",
        lineColor: "#000",
        width: 2,
        height: 40,
        displayValue: true,
        textMargin: 0,
        fontSize: 15,
        textPosition: "bottom",
        margin: 16,
        flat: true
    });
    return canvas.toDataURL();
};
module.exports = barCode;