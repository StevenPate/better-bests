import fetch from 'node-fetch'
import { schedule } from '@netlify/functions'

const BUILD_HOOK =
  'https://api.netlify.com/build_hooks/641a9f84a3547c4fe04cbd55'

// Schedules the handler function to run at midnight on
// Mondays, Wednesday, and Friday
const handler = schedule('0 0/30 0 ? * 2/1 *', async () => {
  await fetch(BUILD_HOOK, {
    method: 'POST'
  }).then(response => {
    console.log('Build hook response:', response)
  })

  return {
    statusCode: 200
  }
})

export { handler }