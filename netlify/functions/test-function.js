// YOUR_BASE_DIRECTORY/netlify/functions/test-function.js

exports.handler = async function(event, context) {
    console.log("Received event:", event);

    return {
        statusCode: 200,
    };
};