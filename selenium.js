const webdriverio = require('webdriverio')

const options = { desiredCapabilities: { browserName: 'chrome' } }
const client = webdriverio.remote(options)

const username = process.env.NAB_USERNAME
const password = process.env.NAB_PASSWORD

client.init().url('https://ib.nab.com.au/nabib/index.jsp')
  .setValue('input[name="userid"]', username)
  .setValue('input[name="password"]', password)
  .click('//a[text()="Login"]')
