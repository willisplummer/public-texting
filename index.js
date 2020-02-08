require('dotenv').config()

const express = require('express')
const bodyParser = require("body-parser");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

const app = express()
const port = 3000
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const twilioNumber = '+18163987214'

const users = { '+15412618972': 'Willis', '+13475451506': 'Luiza' }
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
