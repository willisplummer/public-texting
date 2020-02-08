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

const getUserByPhoneNumber = (phoneNumber) =>
  pool.query(
    "SELECT * FROM users WHERE phone_number = $1",
    [phoneNumber])
    .then(results => results.rows[0])

const getConversationByParticipantId = (userId) =>
  pool.query(
    ```
    SELECT * FROM conversations
    JOIN users AS recipient
      ON (recipient.id = conversations.first_user_id
          OR recipient.id = conversations.second_user_id)
        AND recipient.id != $1
    WHERE first_user_id = $1
      OR second_user_id = $1
    ```,
    [userId]
  ).then(results => results.rows[0])

const writeMessage = (fromUser, conversation, msgBody) =>
  pool.query(
    "INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)",
    [conversation.id, fromUser.id, msgBody]
  )

const getMessages = (conversationId) =>
  pool.query(
    'SELECT * FROM messages WHERE conversation_id = $1',
    [conversationId]
  ).then(results => results.rows)

app.post('/messages', async (req, res) => {
  console.log(req.body);

  const fromNumber = req.body.From
  const fromUser = await getUserByPhoneNumber(fromNumber)

  console.log(fromNumber, fromUser)
  // if there's no fromUser, we just throw it away
  if (fromUser) {
    const msgBody = req.body.Body

    // unsafe
    const conversation = await getConversationByParticipantId(fromUser.id)
    console.log(conversation)

    // TODO
    const proxyToNumber = Object.keys(users).filter(x => x != fromNumber)[0]

    // write to memory
    await writeMessage(fromUser, conversation, msgBody)
    chats.push({ from: fromUser, body: msgBody })

    // proxy number to other conversation participant
    twilioClient.messages.create({
      body: msgBody,
      to: proxyToNumber,
      from: conversation.twilio_number
    })
  }

  res.send('<Response></Response>');
})

app.get('/messages/:conversationId', async (req, res) => {
  const conversationId = req.params.conversationId
  const messages = await getMessages(conversationId)
  console.log(messages)
  res.send(JSON.stringify(messages))
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
