const fetch = require('node-fetch')

const BUILD_HOOK =
    'https://api.netlify.com/build_hooks/641a9f84a3547c4fe04cbd55'



exports.handler =
    await fetch(BUILD_HOOK, {
        method: 'POST'
    }).then(response => {
        console.log('Build hook response:', response)
    })

return {
    statusCode: 200
}

