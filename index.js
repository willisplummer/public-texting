const express = require('express')
const bodyParser = require("body-parser");
const { pool } = require('./config')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = require('twilio')(accountSid, authToken);

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', './views')
app.set('view engine', 'pug')

const getUsers = () =>
  pool.query('SELECT * FROM users')
    .then(results => results.rows)
    .catch(e => console.error(e))

const getUserByPhoneNumber = (phoneNumber) =>
  pool.query(
    "SELECT * FROM users WHERE phone_number = $1",
    [phoneNumber])
    .then(results => results.rows[0])
    .catch(e => console.error(e))

const getConversationParticipants = (conversationId) =>
  pool.query(
    "SELECT first_participant.name as first_user_name, second_participant.name as second_user_name FROM conversations JOIN users AS first_participant ON conversations.first_user_id = first_participant.id JOIN users AS second_participant ON conversations.second_user_id = second_participant.id WHERE conversations.id = $1",
    [conversationId]
  ).then(results => results.rows[0])
  .catch(e => console.error(e))

const getConversationByParticipantId = (userId) =>
  pool.query(
    "SELECT conversations.*, recipient.phone_number AS recipient_phone_number FROM conversations JOIN users AS recipient ON (recipient.id = conversations.first_user_id OR recipient.id = conversations.second_user_id) AND recipient.id != $1 WHERE first_user_id = $1 OR second_user_id = $1",
    [userId]
  ).then(results => results.rows[0])
  .catch(e => console.error(e))

const writeMessage = (fromUser, conversation, msgBody) =>
  pool.query(
    "INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)",
    [conversation.id, fromUser.id, msgBody]
  )

const getMessages = (conversationId) =>
  pool.query(
    'SELECT messages.*, users.name AS sender_name FROM messages JOIN users ON users.id = messages.sender_id WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  ).then(results => results.rows)
  .catch(e => console.error(e))

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

    // write to memory
    await writeMessage(fromUser, conversation, msgBody)

    // proxy number to other conversation participant
    twilioClient.messages.create({
      body: msgBody,
      to: conversation.recipient_phone_number,
      from: conversation.twilio_phone_number
    }).catch(e => console.log(e))
  }

  res.send('<Response></Response>');
})

app.get('/messages/:conversationId', async (req, res) => {
  const conversationId = req.params.conversationId
  const messages = await getMessages(conversationId)

  const participants = await getConversationParticipants(conversationId)

  res.render('index', { messages, participants: Object.values(participants) })
})

// TODO: remove before publishing (just for testing locally)
app.get('/users', async (req, res) => {
  console.log('get users')
  const users = await getUsers()

  res.send(JSON.stringify(users))
})

app.get('/', (req, res) => {
  res.sendStatus(200)
})

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
)
