const express = require('express')
const bodyParser = require("body-parser");
const { pool } = require('./config')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

const twilioNumber = process.env.TWILIO_PHONE;
const willisNumber = process.env.WILLIS_PHONE;
const luizaNumber = process.env.LUIZA_PHONE;

const app = express()
const port = 3000
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const users = { [willisNumber]: 'Willis', [luizaNumber]: 'Luiza' }
const chats = []

app.post('/messages', (req, res) => {
  console.log(req.body);

  const fromNumber = req.body.From
  const fromUser = users[fromNumber]

  // if there's no fromUser, we just throw it away
  if (fromUser) {
    const msgBody = req.body.Body

    // unsafe
    const proxyToNumber = Object.keys(users).filter(x => x != fromNumber)[0]

    // write to memory
    chats.push({ from: fromUser, body: msgBody })

    // proxy number to other conversation participant
    twilioClient.messages.create({
      body: msgBody,
      to: proxyToNumber,
      from: twilioNumber
    })
  }

  res.send('<Response></Response>');
})

app.get('/messages', (req, res) => {
  res.send(JSON.stringify(chats))
})

// TODO: remove before publishing (just for testing locally)
app.get('/users', (req, res) => {
  pool.query('SELECT * FROM users', (error, results) => {
    if (error) {
      throw error
    }
    res.status(200).json(results.rows)
  })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
