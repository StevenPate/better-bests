const fetch = require('node-fetch')
const { schedule } = require('@netlify/functions')

const BUILD_HOOK =
    'https://api.netlify.com/build_hooks/641a9f84a3547c4fe04cbd55'

// import fetch from 'node-fetch'
// import { schedule } from '@netlify/functions'

// const BUILD_HOOK =
//     'https://api.netlify.com/build_hooks/641a9f84a3547c4fe04cbd55'

// 0 0/30 12-24 ? * 4/1 *
// Schedules the handler function to on Wednesdays
// every 30 minutes from 12:00 to 24:00 UTC (5:00 to 17:00 PST)
// const handler = schedule('0 0/30 0 ? * 2/1 *', async () => {
//   await fetch(BUILD_HOOK, {
//     method: 'POST'
//   }).then(response => {
//     console.log('Build hook response:', response)
//   })

//   return {
//     statusCode: 200
//   }
// })

// export { handler }


exports.handler = schedule('0 0 * ? * *', async () => {
    await fetch(BUILD_HOOK, {
        method: 'POST'
    }).then(response => {
        console.log('Build hook response:', response)
    })

    return {
        statusCode: 200
    }
})

