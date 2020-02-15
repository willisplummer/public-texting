const express = require('express')
const bodyParser = require("body-parser");
const { pool } = require('./config')

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// make it easier for folks without credentials to run locally
let twilioClient;
if (accountSid && authToken) {
  twilioClient = require('twilio')(accountSid, authToken);
} else {
  console.log('no twilio credentials provided -- running with mock twilioClient')
  twilioClient = {
    messages: {
      create: () => Promise.resolve('ok')
    }
  }
}

const app = express()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.set('views', './views')
app.set('view engine', 'pug')

const getConversations = () =>
  pool.query('SELECT conversations.id, conversations.created_at, first_participant.name as first_user_name, second_participant.name as second_user_name FROM conversations JOIN users AS first_participant ON conversations.first_user_id = first_participant.id JOIN users AS second_participant ON conversations.second_user_id = second_participant.id ORDER BY conversations.created_at DESC')
    .then(results => results.rows)
    .catch(e => console.error(e))

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

app.get('/conversations/new', (req, res) => {
  res.render('new-conversation')
})

app.get('/conversations/:conversationId', async (req, res) => {
  const conversationId = req.params.conversationId
  const messages = await getMessages(conversationId)

  const participants = await getConversationParticipants(conversationId)

  res.render('show-conversation', { messages, participants: Object.values(participants) })
})

// TODO: remove before publishing (just for testing locally)
app.get('/users', async (req, res) => {
  const users = await getUsers()

  res.send(JSON.stringify(users))
})

app.post('/conversations', async (req, res) => {
  const HARDCODED_TWILIO_NUMBER = '+18163987214'

  console.log(req.body)

  const {
    first_user_name,
    first_user_phone_number,
    second_user_name,
    second_user_phone_number
  } = req.body

  const cleanupNumber = str => {
    const newNum = '+' + str.replace(/\D/g,'')
    if (newNum.length != 12) {
      throw "invalid phone number"
    }
    return newNum
  }

  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const createUserText = 'INSERT INTO users(name, phone_number) VALUES($1, $2) RETURNING *'
    const firstUser = await client.query(
      createUserText,
      [first_user_name, cleanupNumber(first_user_phone_number)]
    ).then(res => res.rows[0])

    const secondUser = await client.query(
      createUserText,
      [second_user_name, cleanupNumber(second_user_phone_number)]
    ).then(res => res.rows[0])

    const insertConversationText = 'INSERT INTO conversations(first_user_id, second_user_id, twilio_phone_number) VALUES ($1, $2, $3) RETURNING id'
    const conversationId = await client.query(
      insertConversationText,
      [firstUser.id, secondUser.id, HARDCODED_TWILIO_NUMBER]
    ).then(res => res.rows[0].id)


    const newThreadMsg = `this is your new thread for public texting. see your conversation at https://public-texting.herokuapp.com/conversations/${conversationId}`

    twilioClient.messages.create({
      body: newThreadMsg,
      to: firstUser.phone_number,
      from: HARDCODED_TWILIO_NUMBER
    }).catch(e => { throw e })

    twilioClient.messages.create({
      body: newThreadMsg,
      to: secondUser.phone_number,
      from: HARDCODED_TWILIO_NUMBER
    }).catch(e => { throw e })

    await client.query('COMMIT')

    res.sendStatus(200)
  } catch (e) {
    await client.query('ROLLBACK')
    console.log(e)
    throw e
  } finally {
    client.release()
  }
})

app.get('/', async (req, res) => {
  const conversationsRes = await getConversations()

  const conversations = conversationsRes.map(convo => {
    return {
      title: convo.first_user_name + ', ' + convo.second_user_name,
      path: '/conversations/' + convo.id
    }
  })

  res.render('index', { conversations })
})

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
)
