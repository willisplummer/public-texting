# public-texting
create a public record of a text convo proxy'd through twilio


## Development

- add a .env file with TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN (can be found on the twilio dashboard)

- in one console `yarn start`
- in another `ngrok http 3000`
- update the webhook in twilio to post to the new ngrok endpoint `/messages`

## Todos

- fix the way that the number to proxy a message to is determined (on line ~60)
- create a simple html representation of a conversation
- expose a frontend for creating a new conversation (on creation, twilio needs to text both participants so that they know what number to text)
